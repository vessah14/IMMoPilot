using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Controllers;

// Supervision en temps réel : /api/admin/supervision (super admin)
[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.SuperAdmin))]
[Route("api/admin/supervision")]
public class SupervisionController(ISupervisionService supervision, IPaiementLoyerService loyers) : ControllerBase
{
    // GET /api/admin/supervision → état de l'API, reversements en attente, journal en direct
    [HttpGet]
    public async Task<ActionResult<SupervisionDto>> Etat() => Ok(await supervision.EtatAsync());

    // POST /api/admin/supervision/reversements/5/relancer → renvoie tout de suite un reversement bloqué ou abandonné
    [HttpPost("reversements/{paiementId:int}/relancer")]
    public async Task<IActionResult> Relancer(int paiementId) =>
        await loyers.RelancerReversementAsync(paiementId) ? NoContent() : NotFound();
}

// Contrôle de santé public : /api/sante (pour cron-job.org, UptimeRobot…), sans aucune donnée sensible
[ApiController]
[AllowAnonymous]
[Route("api/sante")]
public class SanteController(ISupervisionService supervision) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Sante()
    {
        var baseEtat = await supervision.BaseAsync();
        return baseEtat.Ok
            ? Ok(new { statut = "ok", baseMs = baseEtat.LatenceMs })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { statut = "base de données injoignable" });
    }
}
