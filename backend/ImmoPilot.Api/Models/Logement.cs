namespace ImmoPilot.Api.Models;

public class Logement
{
    public int Id { get; set; }
    public required string Reference { get; set; } // ex : "A-12", unique dans un immeuble
    public TypeLogement Type { get; set; }
    public int Etage { get; set; } // 0 = rez-de-chaussée
    public decimal Surface { get; set; } // m²
    public decimal Loyer { get; set; } // FCFA par mois
    public decimal Charges { get; set; } // FCFA par mois
    public StatutLogement Statut { get; set; } = StatutLogement.Vacant;

    public int ImmeubleId { get; set; }
    public Immeuble Immeuble { get; set; } = null!;

    public ICollection<Locataire> Locataires { get; set; } = [];
}
