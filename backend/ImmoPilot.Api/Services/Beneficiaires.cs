using ImmoPilot.Api.Exceptions;

namespace ImmoPilot.Api.Services;

// Qui reçoit le loyer payé en ligne ?
// Le propriétaire du logement s'il est renseigné, sinon celui de l'immeuble, sinon le bailleur (compte donné à l'inscription).
// Utile pour une agence qui gère les biens de plusieurs propriétaires.
public static class Beneficiaires
{
    public record Beneficiaire(string Nom, string Compte);

    public static Beneficiaire? Resoudre(
        string? compteLogement, string? nomLogement,
        string? compteImmeuble, string? nomImmeuble,
        string? compteBailleur, string nomBailleur)
    {
        if (compteLogement is not null) return new(nomLogement ?? nomImmeuble ?? nomBailleur, compteLogement);
        if (compteImmeuble is not null) return new(nomImmeuble ?? nomBailleur, compteImmeuble);
        return compteBailleur is null ? null : new(nomBailleur, compteBailleur);
    }

    // Numéro Mobile Money saisi (facultatif) → format 2376XXXXXXXX, ou null s'il est vide
    public static string? NumeroOuNull(string? saisie) =>
        string.IsNullOrWhiteSpace(saisie)
            ? null
            : Abonnements.NormaliserTelephone(saisie)
              ?? throw new DonneesInvalidesException("Numéro de réception invalide : saisissez un numéro Orange Money ou MTN MoMo du Cameroun (ex : 677 12 34 56).");

    public static string? NomOuNull(string? saisie) => string.IsNullOrWhiteSpace(saisie) ? null : saisie.Trim();
}
