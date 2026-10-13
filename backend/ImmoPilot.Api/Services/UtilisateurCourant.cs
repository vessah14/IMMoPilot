using System.Security.Claims;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Services;

// Lit l'identité de l'utilisateur dans le jeton de la requête en cours.
// Utilisé par les services pour ne renvoyer que les données de cet utilisateur.
public class UtilisateurCourant(IHttpContextAccessor accesseur) : IUtilisateurCourant
{
    private ClaimsPrincipal Principal =>
        accesseur.HttpContext?.User ?? throw new InvalidOperationException("Aucune requête HTTP en cours.");

    public int Id =>
        int.TryParse(Principal.FindFirstValue(JetonService.ClaimId), out var id)
            ? id
            : throw new UnauthorizedAccessException("Utilisateur non connecté.");

    public RoleUtilisateur Role =>
        Enum.TryParse<RoleUtilisateur>(Principal.FindFirstValue(JetonService.ClaimRole), out var role)
            ? role
            : throw new UnauthorizedAccessException("Utilisateur non connecté.");
}
