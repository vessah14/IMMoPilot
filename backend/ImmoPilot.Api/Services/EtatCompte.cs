namespace ImmoPilot.Api.Services;

// État du compte vérifié à chaque requête connectée (compte actif, dernier changement de mot de passe).
// Gardé 30 s en mémoire pour éviter une requête à la base à chaque appel, et effacé dès qu'il change.
public record EtatCompte(bool Actif, DateTime? MotDePasseModifieLe)
{
    public static readonly TimeSpan DureeCache = TimeSpan.FromSeconds(30);

    public static string Cle(int utilisateurId) => $"etat-compte-{utilisateurId}";
}
