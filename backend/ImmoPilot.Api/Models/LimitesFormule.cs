namespace ImmoPilot.Api.Models;

// Ce que permet chaque formule (null = illimité)
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
}
