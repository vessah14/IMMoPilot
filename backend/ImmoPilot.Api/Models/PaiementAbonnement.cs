namespace ImmoPilot.Api.Models;

// Paiement d'un abonnement IMMO PILOT par un bailleur (Orange Money / MTN MoMo via SasPay)
public class PaiementAbonnement
{
    public int Id { get; set; }
    public Formule Formule { get; set; }
    public int DureeMois { get; set; } // 1, 3 ou 12
    public decimal Montant { get; set; } // FCFA
    public required string Telephone { get; set; } // format international, ex : 237677123456
    public StatutPaiementAbonnement Statut { get; set; } = StatutPaiementAbonnement.EnAttente;

    public required string ReferenceExterne { get; set; } // notre référence, envoyée au prestataire (clé d'idempotence)
    public string? ReferencePaiement { get; set; } // identifiant du paiement chez le prestataire (SasPay)
    public string? Operateur { get; set; } // MTN, ORANGE…
    public string? ReferenceOperateur { get; set; }
    public string? NumeroFacture { get; set; } // attribué quand le paiement réussit
    public bool Manuel { get; set; } // prolongation saisie par le super admin (paiement hors SasPay)

    public DateTime DateCreation { get; set; }
    public DateTime? DateConfirmation { get; set; }

    public int UtilisateurId { get; set; }
    public Utilisateur Utilisateur { get; set; } = null!;
}
