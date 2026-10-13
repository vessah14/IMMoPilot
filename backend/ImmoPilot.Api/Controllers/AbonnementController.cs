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

    // GET /api/abonnement/paiements/5 → statut à jour (interroge CamPay si le paiement est en attente)
    [HttpGet("paiements/{id:int}")]
    public async Task<ActionResult<PaiementAbonnementDto>> Verifier(int id) =>
        await service.VerifierAsync(id) is { } paiement ? Ok(paiement) : NotFound();
}

// Notifications envoyées par CamPay quand un paiement change de statut.
// Adresse à indiquer dans l'application CamPay : https://<votre-domaine>/api/campay/webhook
[ApiController]
[AllowAnonymous]
[Route("api/campay/webhook")]
public class CampayWebhookController(IAbonnementService service) : ControllerBase
{
    // CamPay envoie les informations dans l'URL (GET) ; on accepte aussi un formulaire POST
    [HttpGet]
    [HttpPost]
    public async Task<IActionResult> Recevoir()
    {
        string? Lire(string cle) =>
            Request.Query.TryGetValue(cle, out var q) && !string.IsNullOrEmpty(q) ? q.ToString()
            : Request.HasFormContentType && Request.Form.TryGetValue(cle, out var f) ? f.ToString()
            : null;

        var valide = await service.TraiterNotificationAsync(Lire("reference"), Lire("external_reference"), Lire("signature"));
        return valide ? Ok() : Unauthorized();
    }
}
