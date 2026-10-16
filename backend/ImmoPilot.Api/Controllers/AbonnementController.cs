using System.Text.Json;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImmoPilot.Api.Controllers;

// Abonnement du bailleur connecté : /api/abonnement
[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/abonnement")]
public class AbonnementController(IAbonnementService service) : ControllerBase
{
    // GET /api/abonnement → formule, échéance, tarifs, historique des paiements
    [HttpGet]
    public async Task<ActionResult<AbonnementDto>> Obtenir() => Ok(await service.MonAbonnementAsync());

    // POST /api/abonnement/paiements → envoie la demande de paiement sur le téléphone
    [HttpPost("paiements")]
    [EnableRateLimiting("authentification")]
    [Idempotent]
    public async Task<ActionResult<PaiementAbonnementDto>> Payer(PaiementAbonnementRequeteDto requete) =>
        StatusCode(StatusCodes.Status201Created, await service.PayerAsync(requete));

    // GET /api/abonnement/paiements/5 → statut à jour (interroge SasPay si le paiement est en attente)
    [HttpGet("paiements/{id:int}")]
    public async Task<ActionResult<PaiementAbonnementDto>> Verifier(int id) =>
        await service.VerifierAsync(id) is { } paiement ? Ok(paiement) : NotFound();
}

// Notifications envoyées par SasPay quand un paiement change de statut.
// À créer dans le tableau de bord SasPay → Webhooks : https://<adresse-de-l-api>/api/saspay/webhook,
// abonné aux events transaction.success, transaction.failed et transaction.cancelled
[ApiController]
[AllowAnonymous]
[Route("api/saspay/webhook")]
public class SaspayWebhookController(
    IPaiementMobile paiements,
    IAbonnementService abonnements,
    IPaiementLoyerService loyers,
    ILogger<SaspayWebhookController> journal) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(64 * 1024)]
    public async Task<IActionResult> Recevoir()
    {
        // La signature porte sur le corps brut exact : on le lit tel quel, sans le désérialiser d'abord
        using var lecteur = new StreamReader(Request.Body);
        var corps = await lecteur.ReadToEndAsync();

        if (!paiements.SignatureWebhookValide(corps,
                Request.Headers["X-Webhook-Signature"].FirstOrDefault(), Request.Headers["X-Webhook-Timestamp"].FirstOrDefault()))
        {
            journal.LogWarning("Notification SasPay rejetée : signature ou horodatage invalide");
            return Unauthorized();
        }

        // { "event": "transaction.success", "data": { "id": "…", … } } : seul l'identifiant de la transaction nous intéresse,
        // son statut est toujours redemandé à SasPay
        string? reference = null;
        try
        {
            using var json = JsonDocument.Parse(corps);
            if (json.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object
                && data.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String)
                reference = id.GetString();
        }
        catch (JsonException)
        {
            journal.LogWarning("Notification SasPay illisible");
        }

        // Abonnement d'un bailleur, sinon loyer d'un locataire ou reversement à un propriétaire
        if (reference is not null && !await abonnements.ActualiserParReferenceAsync(reference))
            await loyers.ActualiserParReferenceAsync(reference);
        return Ok(); // event sans transaction (ex : webhook.test) ou inconnue : rien à faire
    }
}
