using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/logements")]
public class LogementsController(ILogementService service) : ControllerBase
{
    // GET /api/logements?immeubleId=1&statut=Vacant
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LogementDto>>> Lister(
        [FromQuery] int? immeubleId, [FromQuery] StatutLogement? statut) =>
        Ok(await service.ListerAsync(immeubleId, statut));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LogementDto>> Obtenir(int id) =>
        await service.ObtenirAsync(id) is { } logement ? Ok(logement) : NotFound();

    [HttpPost]
    public async Task<ActionResult<LogementDto>> Creer(LogementRequeteDto requete)
    {
        var logement = await service.CreerAsync(requete);
        return CreatedAtAction(nameof(Obtenir), new { id = logement.Id }, logement);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<LogementDto>> Modifier(int id, LogementRequeteDto requete) =>
        await service.ModifierAsync(id, requete) is { } logement ? Ok(logement) : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Supprimer(int id) =>
        await service.SupprimerAsync(id) ? NoContent() : NotFound();
}
