using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Interfaces;

// L'utilisateur connecté qui fait la requête (lu depuis le jeton JWT)
public interface IUtilisateurCourant
{
    int Id { get; }
    RoleUtilisateur Role { get; }
}

public interface IJetonService
{
    string Creer(Utilisateur utilisateur);
    TimeSpan Duree { get; }
}

public interface IAuthService
{
    // Crée un compte bailleur ; renvoie l'utilisateur créé
    Task<Utilisateur> InscrireAsync(InscriptionDto requete);

    // Vérifie l'e-mail et le mot de passe pour le rôle demandé ; null si refusé
    Task<Utilisateur?> ConnecterAsync(ConnexionDto requete, RoleUtilisateur role);

    Task<UtilisateurDto> MoiAsync();
    Task<Utilisateur> CompteAsync();
    Task<UtilisateurDto> ModifierProfilAsync(ProfilDto requete);
    Task ChangerMotDePasseAsync(ChangementMotDePasseDto requete);

    // Mot de passe oublié : envoie un lien par e-mail (sans dire si le compte existe)
    Task DemanderReinitialisationAsync(MotDePasseOublieDto requete, RoleUtilisateur role);

    // Change le mot de passe avec le lien reçu par e-mail ; renvoie le compte (pour le connecter)
    Task<Utilisateur> ReinitialiserMotDePasseAsync(ReinitialisationMotDePasseDto requete, RoleUtilisateur role);
}
