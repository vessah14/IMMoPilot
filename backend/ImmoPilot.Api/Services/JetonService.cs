using System.Security.Claims;
using System.Text;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace ImmoPilot.Api.Services;

// Crée les jetons JWT remis à la connexion
public class JetonService(IConfiguration configuration) : IJetonService
{
    // Noms des informations stockées dans le jeton
    public const string ClaimId = "sub";
    public const string ClaimRole = "role";
    public const string ClaimNom = "name";

    // Le jeton est rangé dans un cookie httpOnly (illisible par le JavaScript de la page).
    // Un cookie par espace : se connecter au super admin ne déconnecte pas l'espace bailleur.
    public const string CookieBailleur = "immopilot_session";
    public const string CookieSuperAdmin = "immopilot_admin_session";

    public TimeSpan Duree => TimeSpan.FromHours(configuration.GetValue("Jwt:DureeHeures", 168)); // 7 jours

    public string Creer(Utilisateur utilisateur)
    {
        var cle = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Cle(configuration)));
        var descripteur = new SecurityTokenDescriptor
        {
            Issuer = configuration["Jwt:Emetteur"],
            Audience = configuration["Jwt:Audience"],
            Expires = DateTime.UtcNow.Add(Duree),
            SigningCredentials = new SigningCredentials(cle, SecurityAlgorithms.HmacSha256),
            Subject = new ClaimsIdentity(
            [
                new Claim(ClaimId, utilisateur.Id.ToString()),
                new Claim(ClaimRole, utilisateur.Role.ToString()),
                new Claim(ClaimNom, utilisateur.NomComplet),
            ]),
        };
        return new JsonWebTokenHandler().CreateToken(descripteur);
    }

    // La clé de signature doit faire au moins 32 caractères (256 bits)
    public static string Cle(IConfiguration configuration)
    {
        var cle = configuration["Jwt:Cle"];
        if (string.IsNullOrWhiteSpace(cle) || cle.Length < 32)
            throw new InvalidOperationException("La clé « Jwt:Cle » est absente ou trop courte (32 caractères minimum). Voir le README.");
        return cle;
    }
}
