using System.Diagnostics;
using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

public class SupervisionService(
    ImmoPilotDbContext db,
    EtatServeur serveur,
    JournalMemoire journal,
    IPaiementMobile paiements,
    IEnvoiEmail envoiEmails,
    FileEmails fileEmails,
    IConfiguration configuration,
    IWebHostEnvironment env,
    TimeProvider horloge) : ISupervisionService
{
    public async Task<SupervisionDto> EtatAsync()
    {
        var maintenant = horloge.GetUtcNow().UtcDateTime;
        var baseEtat = await BaseAsync();

        var compteurs = new CompteursSupervisionDto(0, 0, 0, 0, 0, 0);
        IReadOnlyList<ReversementSupervisionDto> reversements = [];
        if (baseEtat.Ok)
        {
            var debutJour = maintenant.Date;
            compteurs = new CompteursSupervisionDto(
                await db.Paiements.CountAsync(p => p.EnLigne && p.Statut == StatutPaiement.EnAttente),
                await db.PaiementsAbonnement.CountAsync(p => p.Statut == StatutPaiementAbonnement.EnAttente),
                await db.Paiements.CountAsync(p => p.StatutReversement == StatutReversement.AFaire),
                await db.Paiements.CountAsync(p => p.StatutReversement == StatutReversement.EnCours),
                await db.Paiements.CountAsync(p => p.StatutReversement == StatutReversement.Echoue),
                await db.Paiements.CountAsync(p => p.StatutReversement == StatutReversement.Reverse && p.DateReversement >= debutJour));

            reversements = (await db.Paiements.AsNoTracking()
                    .Where(p => p.StatutReversement != null && p.StatutReversement != StatutReversement.Reverse)
                    .OrderByDescending(p => p.Id)
                    .Take(50)
                    .Select(p => new
                    {
                        p.Id,
                        Locataire = p.Locataire.NomComplet,
                        Bailleur = p.Locataire.Proprietaire.NomStructure ?? p.Locataire.Proprietaire.NomComplet,
                        p.Periode,
                        p.Montant,
                        p.MontantNet,
                        p.CompteVersement,
                        p.StatutReversement,
                        p.ErreurReversement,
                        p.DateReversement,
                        p.EchecsReversement,
                    })
                    .ToListAsync())
                .Select(p => new ReversementSupervisionDto(p.Id, p.Locataire, p.Bailleur, p.Periode, p.Montant, p.MontantNet,
                    PaiementLoyerService.CompteMasque(p.CompteVersement ?? ""), p.StatutReversement!.Value, p.ErreurReversement,
                    p.DateReversement, p.EchecsReversement))
                .ToList();
        }

        var commit = Environment.GetEnvironmentVariable("RENDER_GIT_COMMIT"); // fourni par Render
        var modeDemo = configuration.GetValue<bool>("Demo:Actif");
        return new SupervisionDto(
            maintenant,
            new ApiEtatDto(serveur.DemarreLe, commit is { Length: >= 7 } ? commit[..7] : commit, env.EnvironmentName, serveur.IpSortante,
                (int)(Environment.WorkingSet / (1024 * 1024))),
            baseEtat,
            new PaiementsEtatDto(
                EtatServeur.ModePaiements(configuration, paiements.EstSimulation, modeDemo, env.IsDevelopment()),
                paiements.EstSimulation,
                !string.IsNullOrWhiteSpace(configuration["Saspay:SecretWebhook"])),
            new EmailsEtatDto(
                envoiEmails.EstConfigure,
                !envoiEmails.EstConfigure ? "non configurés" : envoiEmails is EmailService { ParApiBrevo: true } ? "API Brevo" : "SMTP",
                fileEmails.Lecteur.CanCount ? fileEmails.Lecteur.Count : 0),
            new[] { "abonnements", "loyers" }
                .Select(nom => serveur.Taches.TryGetValue(nom, out var t)
                    ? new TacheEtatDto(nom, t.DernierPassage, t.DureeMs, t.Erreur)
                    : new TacheEtatDto(nom, null, null, null))
                .ToList(),
            compteurs,
            reversements,
            journal.Dernieres(200));
    }

    // La base répond-elle, et en combien de temps ?
    public async Task<BaseEtatDto> BaseAsync()
    {
        var chrono = Stopwatch.StartNew();
        try
        {
            await db.Database.ExecuteSqlRawAsync("SELECT 1");
            return new BaseEtatDto(true, (int)chrono.ElapsedMilliseconds, null);
        }
        catch (Exception ex)
        {
            return new BaseEtatDto(false, null, ex.Message);
        }
    }
}
