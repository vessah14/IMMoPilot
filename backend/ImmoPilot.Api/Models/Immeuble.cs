namespace ImmoPilot.Api.Models;

public class Immeuble
{
    public int Id { get; set; }
    public required string Nom { get; set; }
    public TypeImmeuble Type { get; set; }
    public string? Description { get; set; }

    // Localisation
    public required string Adresse { get; set; }
    public required string Ville { get; set; }
    public required string Quartier { get; set; }

    // Caractéristiques
    public int? NombreEtages { get; set; }
    public int? AnneeConstruction { get; set; }

    // Photo principale, hébergée sur Cloudinary
    public string? PhotoUrl { get; set; }
    public string? PhotoId { get; set; } // identifiant Cloudinary (pour la supprimer)

    public DateTime DateCreation { get; set; }

    // Bailleur propriétaire de l'immeuble : chaque bailleur ne voit que ses données
    public int ProprietaireId { get; set; }
    public Utilisateur Proprietaire { get; set; } = null!;

    public ICollection<Logement> Logements { get; set; } = [];
}
