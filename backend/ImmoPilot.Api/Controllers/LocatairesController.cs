using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
[Route("api/locataires")]
public class LocatairesController(ILocataireService service) : ControllerBase
{
    // GET /api/locataires?recherche=dupont
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LocataireDto>>> Lister([FromQuery] string? recherche) =>
        Ok(await service.ListerAsync(recherche));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LocataireDto>> Obtenir(int id) =>
        await service.ObtenirAsync(id) is { } locataire ? Ok(locataire) : NotFound();

    [HttpPost]
    public async Task<ActionResult<LocataireDto>> Creer(LocataireRequeteDto requete)
    {
        var locataire = await service.CreerAsync(requete);
        return CreatedAtAction(nameof(Obtenir), new { id = locataire.Id }, locataire);
    }

    // POST /api/locataires/5/lien-paiement → nouveau lien personnel de paiement (l'ancien est désactivé)
    [HttpPost("{id:int}/lien-paiement")]
    public async Task<ActionResult<LocataireDto>> NouveauLienPaiement(int id) =>
        await service.NouveauLienPaiementAsync(id) is { } locataire ? Ok(locataire) : NotFound();

    // POST /api/locataires/5/lien-paiement/envoi → envoie le lien au locataire par e-mail
    [HttpPost("{id:int}/lien-paiement/envoi")]
    public async Task<IActionResult> EnvoyerLienPaiement(int id) =>
        await service.EnvoyerLienParEmailAsync(id) ? NoContent() : NotFound();

    [HttpPut("{id:int}")]
    public async Task<ActionResult<LocataireDto>> Modifier(int id, LocataireRequeteDto requete) =>
        await service.ModifierAsync(id, requete) is { } locataire ? Ok(locataire) : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Supprimer(int id) =>
        await service.SupprimerAsync(id) ? NoContent() : NotFound();
}
