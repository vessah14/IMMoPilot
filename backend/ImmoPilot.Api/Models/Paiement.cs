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

    // Payé par le locataire lui-même depuis son lien personnel (Mobile Money)
    public bool EnLigne { get; set; }
    public DateTime? DateDemande { get; set; } // envoi de la demande sur le téléphone
    public string? CompteVersement { get; set; } // numéro du bailleur crédité (gardé même s'il change ensuite)

    // Reversement automatique au propriétaire (null : paiement saisi à la main, rien à reverser)
    public StatutReversement? StatutReversement { get; set; }
    public decimal? MontantNet { get; set; } // reçu sur le wallet IMMO PILOT, après les frais d'encaissement
    public decimal? MontantReverse { get; set; } // effectivement reçu par le propriétaire, après les frais de reversement
    public string? ReferenceReversement { get; set; } // identifiant du reversement chez SasPay
    public string? CleReversement { get; set; } // clé d'idempotence : un même essai n'est jamais versé deux fois
    public int EchecsReversement { get; set; } // reversements refusés par l'opérateur (abandon au 3e)
    public DateTime? DateReversement { get; set; } // dernier essai, puis date de réception
    public string? ErreurReversement { get; set; } // dernière raison d'attente ou d'échec

    public int LocataireId { get; set; }
    public Locataire Locataire { get; set; } = null!;
}
