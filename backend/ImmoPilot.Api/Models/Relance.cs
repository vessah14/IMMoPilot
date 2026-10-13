namespace ImmoPilot.Api.Models;

// Trace d'une relance envoyée à un locataire pour un loyer non réglé
public class Relance
{
    public int Id { get; set; }
    public DateOnly Periode { get; set; } // mois concerné (1er du mois)
    public DateTime Date { get; set; }

    public int LocataireId { get; set; }
    public Locataire Locataire { get; set; } = null!;
}
