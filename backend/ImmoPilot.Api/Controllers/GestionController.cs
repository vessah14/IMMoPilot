using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Controllers;

// GET /api/tableau-de-bord
[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/tableau-de-bord")]
public class TableauDeBordController(ITableauDeBordService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TableauDeBordDto>> Obtenir() => Ok(await service.ObtenirAsync());
}

// GET /api/rapports
[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/rapports")]
public class RapportsController(IRapportService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<RapportDto>> Obtenir() => Ok(await service.ObtenirAsync());
}

[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/loyers")]
public class LoyersController(ILoyerService service) : ControllerBase
{
    // GET /api/loyers?mois=2026-09-01
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EcheanceDto>>> Echeancier([FromQuery] DateOnly mois) =>
        Ok(await service.EcheancierAsync(mois));

    // POST /api/loyers/relances
    [HttpPost("relances")]
    public async Task<ActionResult<EcheanceDto>> Relancer(RelanceRequeteDto requete) =>
        await service.RelancerAsync(requete) is { } echeance ? Ok(echeance) : NotFound();
}

[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/notifications")]
public class NotificationsController(INotificationService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> Lister() => Ok(await service.ListerAsync());

    // PUT /api/notifications/5/lue
    [HttpPut("{id:int}/lue")]
    public async Task<IActionResult> MarquerLue(int id) =>
        await service.MarquerLueAsync(id) ? NoContent() : NotFound();

    // PUT /api/notifications/lues → tout marquer comme lu
    [HttpPut("lues")]
    public async Task<IActionResult> ToutMarquerLu()
    {
        await service.ToutMarquerLuAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Supprimer(int id) =>
        await service.SupprimerAsync(id) ? NoContent() : NotFound();
}

// Tickets de support côté bailleur
[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/support")]
public class SupportController(ISupportService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TicketDto>>> MesTickets() => Ok(await service.MesTicketsAsync());

    [HttpPost]
    public async Task<ActionResult<TicketDto>> Creer(TicketRequeteDto requete) =>
        StatusCode(StatusCodes.Status201Created, await service.CreerAsync(requete));
}

// GET /api/offre → formules et prix (public, pour la page d'inscription)
[ApiController]
[AllowAnonymous]
[Route("api/offre")]
public class OffreController(IParametresService parametres) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<OffrePubliqueDto>> Obtenir() => Ok(await parametres.OffreAsync());
}
