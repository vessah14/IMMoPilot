using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImmoPilot.Api.Controllers;

// Compte bailleur : inscription, connexion, profil
[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth, IJetonService jetons, IWebHostEnvironment env) : ControllerBase
{
    // POST /api/auth/inscription → crée le compte et connecte directement
    [HttpPost("inscription")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<ActionResult<UtilisateurDto>> Inscrire(InscriptionDto requete)
    {
        var utilisateur = await auth.InscrireAsync(requete);
        CookiesAuth.Ecrire(Response, JetonService.CookieBailleur, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return StatusCode(StatusCodes.Status201Created, await MoiAvecAsync(utilisateur));
    }

    // POST /api/auth/connexion
    [HttpPost("connexion")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<ActionResult<UtilisateurDto>> Connecter(ConnexionDto requete)
    {
        var utilisateur = await auth.ConnecterAsync(requete, RoleUtilisateur.Bailleur);
        if (utilisateur is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Connexion refusée",
                detail: "E-mail ou mot de passe incorrect.");

        CookiesAuth.Ecrire(Response, JetonService.CookieBailleur, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return Ok(await MoiAvecAsync(utilisateur));
    }

    // POST /api/auth/deconnexion
    [HttpPost("deconnexion")]
    [AllowAnonymous]
    public IActionResult Deconnecter()
    {
        CookiesAuth.Effacer(Response, JetonService.CookieBailleur, !env.IsDevelopment());
        return NoContent();
    }

    // GET /api/auth/moi → le compte connecté
    [HttpGet("moi")]
    [Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
    public async Task<ActionResult<UtilisateurDto>> Moi() => Ok(await auth.MoiAsync());

    // PUT /api/auth/moi → modifier son profil
    [HttpPut("moi")]
    [Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
    public async Task<ActionResult<UtilisateurDto>> ModifierProfil(ProfilDto requete) =>
        Ok(await auth.ModifierProfilAsync(requete));

    // PUT /api/auth/mot-de-passe
    [HttpPut("mot-de-passe")]
    [Authorize(Roles = nameof(RoleUtilisateur.Bailleur))]
    [EnableRateLimiting("authentification")]
    public async Task<IActionResult> ChangerMotDePasse(ChangementMotDePasseDto requete)
    {
        await auth.ChangerMotDePasseAsync(requete);
        // Les anciennes sessions sont fermées : on redonne une session neuve à cet appareil
        var utilisateur = await auth.CompteAsync();
        CookiesAuth.Ecrire(Response, JetonService.CookieBailleur, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return NoContent();
    }

    // POST /api/auth/mot-de-passe-oublie → envoie un lien par e-mail (même réponse que le compte existe ou non)
    [HttpPost("mot-de-passe-oublie")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<IActionResult> MotDePasseOublie(MotDePasseOublieDto requete)
    {
        await auth.DemanderReinitialisationAsync(requete, RoleUtilisateur.Bailleur);
        return NoContent();
    }

    // POST /api/auth/reinitialisation → nouveau mot de passe avec le lien reçu, puis connexion directe
    [HttpPost("reinitialisation")]
    [AllowAnonymous]
    [EnableRateLimiting("authentification")]
    public async Task<ActionResult<UtilisateurDto>> Reinitialiser(ReinitialisationMotDePasseDto requete)
    {
        var utilisateur = await auth.ReinitialiserMotDePasseAsync(requete, RoleUtilisateur.Bailleur);
        CookiesAuth.Ecrire(Response, JetonService.CookieBailleur, jetons.Creer(utilisateur), jetons.Duree, !env.IsDevelopment());
        return Ok(await MoiAvecAsync(utilisateur));
    }

    // Juste après la connexion, le jeton n'est pas encore dans la requête : on lit le compte directement
    private async Task<UtilisateurDto> MoiAvecAsync(Utilisateur utilisateur)
    {
        HttpContext.User = new(new System.Security.Claims.ClaimsIdentity(
        [
            new(JetonService.ClaimId, utilisateur.Id.ToString()),
            new(JetonService.ClaimRole, utilisateur.Role.ToString()),
        ]));
        return await auth.MoiAsync();
    }
}
