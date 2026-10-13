using System.Globalization;

namespace ImmoPilot.Api.Services;

// Petites aides sur les dates et les montants, partagées par les services
public static class Dates
{
    private static readonly CultureInfo Francais = CultureInfo.GetCultureInfo("fr-FR");

    public static DateOnly PremierDuMois(DateOnly date) => new(date.Year, date.Month, 1);

    public static DateOnly DernierDuMois(DateOnly date) => PremierDuMois(date).AddMonths(1).AddDays(-1);

    // Aujourd'hui selon l'horloge du serveur (le Cameroun est en UTC+1, sans heure d'été)
    public static DateOnly Aujourdhui(TimeProvider horloge) => DateOnly.FromDateTime(horloge.GetLocalNow().DateTime);

    // Date d'échéance du loyer d'un mois (jour choisi par le bailleur, 5 par défaut)
    public static DateOnly Echeance(DateOnly mois, int jourEcheance) =>
        new(mois.Year, mois.Month, Math.Clamp(jourEcheance, 1, 28));

    // Textes en français, quelle que soit la langue du serveur
    public static string NomMois(DateOnly mois) => mois.ToString("MMMM yyyy", Francais);

    public static string Fcfa(decimal montant) => $"{montant.ToString("N0", Francais)} FCFA";

    public static string Jour(DateOnly date) => date.ToString("dd/MM/yyyy", Francais);
}
