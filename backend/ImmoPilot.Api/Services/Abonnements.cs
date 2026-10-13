using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Services;

// Règles de calcul des abonnements, partagées par les services
public static class Abonnements
{
    public const int JoursDeGrace = 5; // après l'échéance, tout fonctionne encore pendant 5 jours
    public static readonly int[] Durees = [1, 3, 12];

    // 12 mois payés 10 : 2 mois offerts pour l'abonnement annuel
    public static int MoisOfferts(int dureeMois) => dureeMois == 12 ? 2 : 0;

    public static decimal Montant(decimal prixMensuel, int dureeMois) => prixMensuel * (dureeMois - MoisOfferts(dureeMois));

    public static IReadOnlyList<OffreFormuleDto> Offres(ParametresPlateforme p) =>
        new[] { Formule.Pro, Formule.Enterprise }
            .Select(f => new OffreFormuleDto(f, p.Prix(f),
                Durees.Select(d => new TarifDto(d, Montant(p.Prix(f), d), MoisOfferts(d))).ToList()))
            .ToList();

    // aDejaPaye : au moins un paiement réussi (sinon, avant l'échéance, c'est encore l'essai gratuit)
    public static EtatAbonnement Etat(Formule formule, DateTime? fin, bool aDejaPaye, DateTime maintenant)
    {
        if (formule == Formule.Starter || fin is null) return EtatAbonnement.Gratuit;
        if (maintenant <= fin) return aDejaPaye ? EtatAbonnement.Actif : EtatAbonnement.Essai;
        return maintenant <= fin.Value.AddDays(JoursDeGrace) ? EtatAbonnement.Grace : EtatAbonnement.Expire;
    }

    // Numéros camerounais : "677 12 34 56", "+237677123456", "00237…" → "237677123456"
    public static string? NormaliserTelephone(string saisie)
    {
        var chiffres = new string(saisie.Where(char.IsDigit).ToArray());
        if (chiffres.StartsWith("00")) chiffres = chiffres[2..];
        if (chiffres.Length == 9) chiffres = "237" + chiffres;
        return chiffres.Length == 12 && chiffres.StartsWith("2376") ? chiffres : null;
    }
}
