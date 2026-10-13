namespace ImmoPilot.Api.Models;

public class Locataire
{
    public int Id { get; set; }
    public required string NomComplet { get; set; }
    public required string Email { get; set; }
    public required string Telephone { get; set; }

    // Lien personnel de paiement du loyer (/payer/{jeton}) : secret, remplaçable par le bailleur
    public string? JetonPaiement { get; set; }

    // Bail en cours
    public DateOnly DebutBail { get; set; }
    public DateOnly FinBail { get; set; }
    public decimal Loyer { get; set; } // FCFA par mois
    public decimal Caution { get; set; }

    public int? LogementId { get; set; } // null quand le locataire est parti
    public Logement? Logement { get; set; }

    // Bailleur du locataire (conservé même quand le locataire n'a plus de logement)
    public int ProprietaireId { get; set; }
    public Utilisateur Proprietaire { get; set; } = null!;

    public ICollection<Relance> Relances { get; set; } = [];

    public ICollection<Paiement> Paiements { get; set; } = [];
}
