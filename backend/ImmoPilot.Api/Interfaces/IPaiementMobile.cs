namespace ImmoPilot.Api.Interfaces;

// Personne qui paie (le prestataire demande son nom, son e-mail et son numéro)
public record ClientPaiement(string NomComplet, string Email, string Telephone);

// Réponse à une demande de paiement.
// UrlPaiement renseignée : aucune demande n'arrive sur le téléphone, la personne doit être redirigée vers cette page
// (cas habituel d'Orange Money chez SasPay). Sinon, elle valide la demande reçue sur son téléphone.
public record DemandePaiementMobile(string Reference, string? CodeUssd, string? Operateur, string? UrlPaiement);

public enum EtatPaiementMobile { EnAttente, Reussi, Echoue }

// MontantNet : ce qui arrive réellement (paiement : sur notre wallet ; reversement : chez le bénéficiaire), frais déduits.
// MontantDemande et Devise : ce que le prestataire a réellement traité, contrôlés avant toute confirmation.
public record StatutPaiementMobile(
    EtatPaiementMobile Etat,
    string? Operateur,
    string? ReferenceOperateur,
    decimal? MontantNet = null,
    decimal? MontantDemande = null,
    string? Devise = null)
{
    // Vérification obligatoire côté serveur : un paiement « réussi » ne vaut que s'il porte exactement
    // sur le montant attendu, en francs CFA (XAF). null = conforme, sinon la raison du refus.
    public string? Anomalie(decimal montantAttendu)
    {
        if (MontantDemande is null || Devise is null) return "montant ou devise absents de la réponse du prestataire";
        if (!string.Equals(Devise, "XAF", StringComparison.OrdinalIgnoreCase)) return $"devise {Devise} au lieu de XAF";
        return decimal.Round(MontantDemande.Value) != decimal.Round(montantAttendu)
            ? $"montant {MontantDemande:0.##} XAF au lieu de {montantAttendu:0.##} XAF"
            : null;
    }
}

// Résultat de l'envoi d'un reversement :
//   Accepte   : reversement créé (Reference), sa confirmation arrive ensuite
//   Incertain : coupure réseau ou panne du prestataire, il a pu être créé → réessayer avec la MÊME clé d'idempotence
//   NonEnvoye : refus avant toute création (solde pas encore disponible, IP non autorisée…) → réessayer plus tard avec une nouvelle clé
//   Refuse    : demande invalide (numéro, réseau…) → inutile de réessayer
public enum ResultatReversement { Accepte, Incertain, NonEnvoye, Refuse }

public record DemandeReversement(ResultatReversement Resultat, string? Reference, string? Erreur);

// Encaissement et reversement Orange Money / MTN MoMo : SasPay (https://saspay.me), ou simulateur sans argent réel
public interface IPaiementMobile
{
    bool EstConfigure { get; }

    // true = simulateur de paiement (aucun argent réel), voir SimulateurPaiement
    bool EstSimulation => false;

    // Téléphone au format 2376XXXXXXXX ; urlRetour : page où revenir après un paiement sur la page du prestataire
    Task<DemandePaiementMobile> DemanderPaiementAsync(decimal montant, ClientPaiement client, string description,
        string referenceExterne, string? urlRetour);

    Task<StatutPaiementMobile> StatutAsync(string reference);

    // Envoie de l'argent de notre wallet vers un numéro Mobile Money (frais déduits du montant envoyé)
    Task<DemandeReversement> ReverserAsync(decimal montant, string telephone, string nomBeneficiaire, string description,
        string cleIdempotence);

    Task<StatutPaiementMobile> StatutReversementAsync(string reference);

    // Vérifie qu'une notification (webhook) vient bien du prestataire : signature calculée sur le corps brut reçu
    bool SignatureWebhookValide(string corps, string? signature, string? horodatage);
}
