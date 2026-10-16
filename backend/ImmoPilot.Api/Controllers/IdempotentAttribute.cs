using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ImmoPilot.Api.Data;
using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ImmoPilot.Api.Controllers;

// [Idempotent] sur une action qui crée un paiement : avec l'en-tête « Idempotency-Key: <uuid> », une même demande
// envoyée deux fois (double clic, nouvel essai après une coupure réseau) n'est exécutée qu'une seule fois.
//   - même clé + même demande, déjà traitée  → la réponse d'origine est renvoyée (en-tête Idempotent-Replayed: true)
//   - même clé + même demande, encore en cours → 409, rien n'est exécuté une seconde fois
//   - même clé + demande différente           → 409 (une clé = une seule opération)
// Seules les réussites (2xx) sont mémorisées : après une erreur de saisie, on peut corriger et renvoyer avec la même clé.
[AttributeUsage(AttributeTargets.Method)]
public class IdempotentAttribute : Attribute, IFilterFactory
{
    public bool IsReusable => false;

    public IFilterMetadata CreateInstance(IServiceProvider services) =>
        ActivatorUtilities.CreateInstance<FiltreIdempotence>(services);
}

public class FiltreIdempotence(
    ImmoPilotDbContext db,
    IOptions<JsonOptions> json,
    TimeProvider horloge,
    ILogger<FiltreIdempotence> journal) : IAsyncResourceFilter
{
    public const string Entete = "Idempotency-Key";
    private static readonly TimeSpan Abandon = TimeSpan.FromMinutes(2); // demande « en cours » depuis trop longtemps : API redémarrée

    public async Task OnResourceExecutionAsync(ResourceExecutingContext contexte, ResourceExecutionDelegate suite)
    {
        var requete = contexte.HttpContext.Request;
        var cle = requete.Headers[Entete].FirstOrDefault()?.Trim();
        if (string.IsNullOrEmpty(cle))
        {
            await suite(); // sans clé : traitement normal (les autres protections restent actives)
            return;
        }
        if (cle.Length > 100 || cle.Any(char.IsControl))
        {
            contexte.Result = Probleme(StatusCodes.Status400BadRequest, "Clé d'idempotence invalide (100 caractères au plus).");
            return;
        }

        // Empreinte de la demande : méthode, chemin et corps exact (relu ensuite normalement par l'action)
        requete.EnableBuffering();
        using var lecteur = new StreamReader(requete.Body, Encoding.UTF8, leaveOpen: true);
        var corps = await lecteur.ReadToEndAsync();
        requete.Body.Position = 0;
        var empreinte = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{requete.Method} {requete.Path}\n{corps}")));
        var portee = Portee(contexte);
        var maintenant = horloge.GetUtcNow().UtcDateTime;

        var existante = await db.RequetesIdempotentes.AsNoTracking().FirstOrDefaultAsync(r => r.Portee == portee && r.Cle == cle);
        if (existante is { Terminee: false } && maintenant - existante.DateCreation > Abandon)
        {
            await db.RequetesIdempotentes.Where(r => r.Id == existante.Id).ExecuteDeleteAsync(); // première demande interrompue
            existante = null;
        }
        if (existante is not null)
        {
            contexte.Result = existante.Empreinte != empreinte
                ? Probleme(StatusCodes.Status409Conflict, "Cette clé d'idempotence a déjà servi pour une autre opération.")
                : !existante.Terminee
                    ? Probleme(StatusCodes.Status409Conflict, "Cette opération est déjà en cours de traitement : patientez quelques secondes.")
                    : Rejouer(contexte.HttpContext, existante);
            return;
        }

        // Réservation de la clé : l'index unique empêche deux demandes simultanées de passer
        var reservation = new RequeteIdempotente { Portee = portee, Cle = cle, Empreinte = empreinte, DateCreation = maintenant };
        db.RequetesIdempotentes.Add(reservation);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            contexte.Result = Probleme(StatusCodes.Status409Conflict, "Cette opération est déjà en cours de traitement : patientez quelques secondes.");
            return;
        }
        db.Entry(reservation).State = EntityState.Detached; // l'action utilise le même DbContext : on ne lui laisse rien en suivi

        ResourceExecutedContext? resultat = null;
        try
        {
            resultat = await suite();
        }
        finally
        {
            await TerminerAsync(reservation.Id, resultat);
        }
    }

    // Réussite : réponse mémorisée ; erreur ou exception : clé libérée pour un nouvel essai
    private async Task TerminerAsync(int id, ResourceExecutedContext? resultat)
    {
        var objet = resultat is { Exception: null } ? resultat.Result as ObjectResult : null;
        var statut = objet?.StatusCode ?? (resultat?.Result as IStatusCodeActionResult)?.StatusCode ?? 0;
        try
        {
            if (resultat is { Exception: null } && statut is >= 200 and < 300)
            {
                var reponse = objet?.Value is null ? null : JsonSerializer.Serialize(objet.Value, objet.Value.GetType(), json.Value.JsonSerializerOptions);
                await db.RequetesIdempotentes.Where(r => r.Id == id).ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.Terminee, true)
                    .SetProperty(r => r.StatutHttp, statut)
                    .SetProperty(r => r.Reponse, reponse));
            }
            else
                await db.RequetesIdempotentes.Where(r => r.Id == id).ExecuteDeleteAsync();
        }
        catch (Exception ex)
        {
            journal.LogWarning(ex, "Idempotence : impossible d'enregistrer le résultat de la demande {Id}", id);
        }
    }

    private static ContentResult Rejouer(HttpContext http, RequeteIdempotente r)
    {
        http.Response.Headers["Idempotent-Replayed"] = "true";
        return new ContentResult { StatusCode = r.StatutHttp, Content = r.Reponse ?? "", ContentType = "application/json; charset=utf-8" };
    }

    // Clé propre à chaque compte (ou lien de locataire) : deux personnes ne peuvent pas entrer en collision
    private static string Portee(ResourceExecutingContext contexte)
    {
        var id = contexte.HttpContext.User.FindFirst(JetonService.ClaimId)?.Value;
        if (id is not null) return $"u:{id}";
        if (contexte.RouteData.Values.TryGetValue("jeton", out var jeton) && jeton is string j)
            return $"l:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(j)))[..32]}"; // jamais le lien secret en clair
        return $"ip:{contexte.HttpContext.Connection.RemoteIpAddress}";
    }

    private static ObjectResult Probleme(int statut, string detail) =>
        new(new ProblemDetails { Status = statut, Title = "Opération refusée", Detail = detail }) { StatusCode = statut };
}
