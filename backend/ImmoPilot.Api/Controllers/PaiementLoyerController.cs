using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImmoPilot.Api.Controllers;

// Page publique : le locataire paie son loyer avec son lien personnel (/payer/{jeton}), sans compte
[ApiController]
[AllowAnonymous]
[EnableRateLimiting("paiement-public")]
[Route("api/paiement-loyer/{jeton}")]
public class PaiementLoyerController(IPaiementLoyerService service) : ControllerBase
{
    // GET /api/paiement-loyer/{jeton} → mois à payer et derniers paiements
    [HttpGet]
    public async Task<ActionResult<PageLoyerDto>> Page(string jeton) =>
        await service.PageAsync(jeton) is { } page ? Ok(page) : NotFound();

    // POST /api/paiement-loyer/{jeton}/paiements → demande Mobile Money pour le mois choisi
    [HttpPost("paiements")]
    public async Task<ActionResult<PaiementLoyerDto>> Payer(string jeton, PaiementLoyerRequeteDto requete) =>
        await service.PayerAsync(jeton, requete) is { } paiement ? StatusCode(StatusCodes.Status201Created, paiement) : NotFound();

    // GET /api/paiement-loyer/{jeton}/paiements/{id} → statut (en attente, confirmé, échoué)
    [HttpGet("paiements/{id:int}")]
    public async Task<ActionResult<PaiementLoyerDto>> Verifier(string jeton, int id) =>
        await service.VerifierAsync(jeton, id) is { } paiement ? Ok(paiement) : NotFound();
}
