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
public class SaspayWebhookController(IAbonnementService service) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(64 * 1024)]
    public async Task<IActionResult> Recevoir()
    {
        // La signature porte sur le corps brut exact : on le lit tel quel, sans le désérialiser d'abord
        using var lecteur = new StreamReader(Request.Body);
        var corps = await lecteur.ReadToEndAsync();

        var valide = await service.TraiterNotificationAsync(corps,
            Request.Headers["X-Webhook-Signature"].FirstOrDefault(), Request.Headers["X-Webhook-Timestamp"].FirstOrDefault());
        return valide ? Ok() : Unauthorized();
    }
}
