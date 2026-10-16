namespace ImmoPilot.Api.Models;

// Fonctions réservées à certaines formules (le suivi des loyers et le paiement en ligne sont ouverts à toutes)
public enum Fonctionnalite
{
    Relances,               // relance d'un locataire par e-mail / WhatsApp
    Rapports,               // rapports financiers et exports CSV
    ProprietairesMultiples, // un propriétaire (bénéficiaire des loyers) par immeuble ou par logement
    Support,                // tickets au support depuis l'espace
}

// Ce que permet chaque formule (null = illimité). Pendant l'essai gratuit, toute la formule choisie est ouverte.
public static class LimitesFormule
{
    public static int? Immeubles(Formule formule) => formule switch
    {
        Formule.Starter => 3,
        Formule.Pro => 15,
        _ => null,
    };

    public static int? Locataires(Formule formule) => formule switch
    {
        Formule.Starter => 10,
        Formule.Pro => 100,
        _ => null,
    };

    // Formule minimale de chaque fonction
    public static Formule FormuleMinimale(Fonctionnalite fonction) => fonction switch
    {
        Fonctionnalite.ProprietairesMultiples => Formule.Enterprise,
        _ => Formule.Pro, // relances, rapports, support
    };

    // Starter < Pro < Enterprise (ordre de l'énumération Formule)
    public static bool Autorise(Formule formule, Fonctionnalite fonction) => formule >= FormuleMinimale(fonction);

    public static IReadOnlyList<Fonctionnalite> Fonctionnalites(Formule formule) =>
        Enum.GetValues<Fonctionnalite>().Where(f => Autorise(formule, f)).ToList();
}
