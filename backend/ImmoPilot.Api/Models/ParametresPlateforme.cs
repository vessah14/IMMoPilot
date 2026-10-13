namespace ImmoPilot.Api.Models;

// Réglages globaux modifiables par le super admin (une seule ligne en base, Id = 1)
public class ParametresPlateforme
{
    public int Id { get; set; } = 1;
    public string NomPlateforme { get; set; } = "IMMO PILOT";
    public string EmailSupport { get; set; } = "support@immopilot.cm";
    public string? TelephoneSupport { get; set; }
    public int DureeEssaiJours { get; set; } = 14;

    // Prix mensuels en FCFA
    public decimal PrixStarter { get; set; } = 0;
    public decimal PrixPro { get; set; } = 15000;
    public decimal PrixEnterprise { get; set; } = 45000;

    public bool InscriptionsOuvertes { get; set; } = true;
    public bool ModeMaintenance { get; set; }

    public decimal Prix(Formule formule) => formule switch
    {
        Formule.Pro => PrixPro,
        Formule.Enterprise => PrixEnterprise,
        _ => PrixStarter,
    };
}
