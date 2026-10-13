using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/paiements")]
public class PaiementsController(IPaiementService service) : ControllerBase
{
    // GET /api/paiements?locataireId=3&moyen=OrangeMoney&mois=2026-09-01
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PaiementDto>>> Lister(
        [FromQuery] int? locataireId, [FromQuery] MoyenPaiement? moyen, [FromQuery] DateOnly? mois) =>
        Ok(await service.ListerAsync(locataireId, moyen, mois));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PaiementDto>> Obtenir(int id) =>
        await service.ObtenirAsync(id) is { } paiement ? Ok(paiement) : NotFound();

    [HttpPost]
    public async Task<ActionResult<PaiementDto>> Creer(PaiementRequeteDto requete)
    {
        var paiement = await service.CreerAsync(requete);
        return CreatedAtAction(nameof(Obtenir), new { id = paiement.Id }, paiement);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PaiementDto>> Modifier(int id, PaiementRequeteDto requete) =>
        await service.ModifierAsync(id, requete) is { } paiement ? Ok(paiement) : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Supprimer(int id) =>
        await service.SupprimerAsync(id) ? NoContent() : NotFound();
}
