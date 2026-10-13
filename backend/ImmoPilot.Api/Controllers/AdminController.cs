using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImmoPilot.Api.Controllers;

// Espace super administrateur : /api/admin/…
// Le jeton est lu dans un cookie séparé de celui des bailleurs (voir Program.cs).
[ApiController]
[Authorize(Roles = nameof(RoleUtilisateur.SuperAdmin))]
[Route("api/admin")]
public class AdminController(
    IAuthService auth,
    IJetonService jetons,
    IAdminService admin,
    ISupportService support,
    IParametresService parametres,
    IAbonnementService abonnements,
    IWebHostEnvironment env) : ControllerBase
{
    // ---- Connexion ----

    [HttpPost("auth/connexion")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<IActionResult> Connecter(ConnexionDto requete)
    {
        var utilisateur = await auth.ConnecterAsync(requete, RoleUtilisateur.SuperAdmin);
        if (utilisateur is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Connexion refusée",
                detail: "E-mail ou mot de passe incorrect.");

        CookiesAuth.Ecrire(Response, JetonService.CookieSuperAdmin, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return Ok(new { utilisateur.Id, utilisateur.NomComplet, utilisateur.Email });
    }

    [HttpPost("auth/deconnexion")]
    [AllowAnonymous]
    public IActionResult Deconnecter()
    {
        CookiesAuth.Effacer(Response, JetonService.CookieSuperAdmin, !env.IsDevelopment());
        return NoContent();
    }

    [HttpPut("auth/mot-de-passe")]
    [EnableRateLimiting("authentification")]
    public async Task<IActionResult> ChangerMotDePasse(ChangementMotDePasseDto requete)
    {
        await auth.ChangerMotDePasseAsync(requete);
        var utilisateur = await auth.CompteAsync();
        CookiesAuth.Ecrire(Response, JetonService.CookieSuperAdmin, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return NoContent();
    }

    [HttpPost("auth/mot-de-passe-oublie")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<IActionResult> MotDePasseOublie(MotDePasseOublieDto requete)
    {
        await auth.DemanderReinitialisationAsync(requete, RoleUtilisateur.SuperAdmin);
        return NoContent();
    }

    [HttpPost("auth/reinitialisation")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<IActionResult> ReinitialiserMotDePasse(ReinitialisationMotDePasseDto requete)
    {
        var utilisateur = await auth.ReinitialiserMotDePasseAsync(requete, RoleUtilisateur.SuperAdmin);
        CookiesAuth.Ecrire(Response, JetonService.CookieSuperAdmin, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return Ok(new { utilisateur.Id, utilisateur.NomComplet, utilisateur.Email });
    }

    [HttpGet("auth/moi")]
    public async Task<ActionResult<UtilisateurDto>> Moi() => Ok(await auth.MoiAsync());

    // ---- Plateforme ----

    [HttpGet("statistiques")]
    public async Task<ActionResult<StatistiquesPlateformeDto>> Statistiques() => Ok(await admin.StatistiquesAsync());

    [HttpGet("clients")]
    public async Task<ActionResult<IReadOnlyList<ClientDto>>> Clients([FromQuery] string? recherche) =>
        Ok(await admin.ClientsAsync(recherche));

    [HttpGet("utilisateurs")]
    public async Task<ActionResult<IReadOnlyList<UtilisateurAdminDto>>> Utilisateurs([FromQuery] string? recherche) =>
        Ok(await admin.UtilisateursAsync(recherche));

    // PUT /api/admin/utilisateurs/5/activation  { "actif": false } → suspendre / bloquer
    [HttpPut("utilisateurs/{id:int}/activation")]
    public async Task<IActionResult> ChangerActivation(int id, ActivationDto requete) =>
        await admin.ChangerActivationAsync(id, requete.Actif) ? NoContent() : NotFound();

    // ---- Abonnements ----

    // GET /api/admin/paiements-abonnement → derniers paiements d'abonnement (CamPay et manuels)
    [HttpGet("paiements-abonnement")]
    public async Task<ActionResult<IReadOnlyList<PaiementAbonnementAdminDto>>> PaiementsAbonnement() =>
        Ok(await abonnements.TousAsync());

    // POST /api/admin/utilisateurs/5/prolongation  { "formule": "Pro", "dureeMois": 3 } → paiement reçu hors ligne
    [HttpPost("utilisateurs/{id:int}/prolongation")]
    public async Task<IActionResult> Prolonger(int id, ProlongationDto requete) =>
        await abonnements.ProlongerAsync(id, requete) ? NoContent() : NotFound();

    // ---- Support ----

    [HttpGet("tickets")]
    public async Task<ActionResult<IReadOnlyList<TicketDto>>> Tickets([FromQuery] StatutTicket? statut) =>
        Ok(await support.TousAsync(statut));

    [HttpPut("tickets/{id:int}")]
    public async Task<ActionResult<TicketDto>> TraiterTicket(int id, TraitementTicketDto requete) =>
        await support.TraiterAsync(id, requete) is { } ticket ? Ok(ticket) : NotFound();

    // ---- Paramètres ----

    [HttpGet("parametres")]
    public async Task<ActionResult<ParametresPlateformeDto>> Parametres() => Ok(await parametres.ObtenirDtoAsync());

    [HttpPut("parametres")]
    public async Task<ActionResult<ParametresPlateformeDto>> ModifierParametres(ParametresPlateformeDto requete) =>
        Ok(await parametres.ModifierAsync(requete));
}
