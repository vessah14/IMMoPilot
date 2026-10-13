using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/immeubles")]
public class ImmeublesController(IImmeubleService service) : ControllerBase
{
    // GET /api/immeubles?ville=Douala
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ImmeubleDto>>> Lister([FromQuery] string? ville) =>
        Ok(await service.ListerAsync(ville));

    // GET /api/immeubles/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ImmeubleDto>> Obtenir(int id) =>
        await service.ObtenirAsync(id) is { } immeuble ? Ok(immeuble) : NotFound();

    // POST /api/immeubles
    [HttpPost]
    public async Task<ActionResult<ImmeubleDto>> Creer(ImmeubleRequeteDto requete)
    {
        var immeuble = await service.CreerAsync(requete);
        return CreatedAtAction(nameof(Obtenir), new { id = immeuble.Id }, immeuble);
    }

    // PUT /api/immeubles/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ImmeubleDto>> Modifier(int id, ImmeubleRequeteDto requete) =>
        await service.ModifierAsync(id, requete) is { } immeuble ? Ok(immeuble) : NotFound();

    // DELETE /api/immeubles/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Supprimer(int id) =>
        await service.SupprimerAsync(id) ? NoContent() : NotFound();

    // POST /api/immeubles/5/photo  (formulaire multipart, champ "photo")
    [HttpPost("{id:int}/photo")]
    [RequestSizeLimit(CloudinaryService.TailleMax + 100_000)]
    public async Task<ActionResult<ImmeubleDto>> ChangerPhoto(int id, IFormFile photo) =>
        await service.ChangerPhotoAsync(id, photo) is { } immeuble ? Ok(immeuble) : NotFound();

    // DELETE /api/immeubles/5/photo
    [HttpDelete("{id:int}/photo")]
    public async Task<ActionResult<ImmeubleDto>> SupprimerPhoto(int id) =>
        await service.SupprimerPhotoAsync(id) is { } immeuble ? Ok(immeuble) : NotFound();
}
