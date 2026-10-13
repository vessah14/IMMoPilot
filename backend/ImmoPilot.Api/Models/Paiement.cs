namespace ImmoPilot.Api.Models;

public class Paiement
{
    public int Id { get; set; }
    public decimal Montant { get; set; } // FCFA
    public DateOnly DatePaiement { get; set; }
    public DateOnly Periode { get; set; } // mois payé, toujours le 1er du mois (ex : 2026-09-01)
    public MoyenPaiement Moyen { get; set; }
    public string? Reference { get; set; } // référence de transaction Mobile Money, n° de reçu…
    public StatutPaiement Statut { get; set; } = StatutPaiement.Confirme;

    public int LocataireId { get; set; }
    public Locataire Locataire { get; set; } = null!;
}
