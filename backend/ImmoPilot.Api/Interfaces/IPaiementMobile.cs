namespace ImmoPilot.Api.Interfaces;

// Personne qui paie (le prestataire demande son nom, son e-mail et son numéro)
public record ClientPaiement(string NomComplet, string Email, string Telephone);

// Réponse à une demande de paiement.
// UrlPaiement renseignée : aucune demande n'arrive sur le téléphone, la personne doit être redirigée vers cette page
// (cas habituel d'Orange Money chez SasPay). Sinon, elle valide la demande reçue sur son téléphone.
public record DemandePaiementMobile(string Reference, string? CodeUssd, string? Operateur, string? UrlPaiement);

public enum EtatPaiementMobile { EnAttente, Reussi, Echoue }

public record StatutPaiementMobile(EtatPaiementMobile Etat, string? Operateur, string? ReferenceOperateur);

// Encaissement Orange Money / MTN MoMo : SasPay (https://saspay.me), ou simulateur sans argent réel
public interface IPaiementMobile
{
    bool EstConfigure { get; }

    // true = simulateur de paiement (aucun argent réel), voir SimulateurPaiement
    bool EstSimulation => false;

    // Téléphone au format 2376XXXXXXXX ; urlRetour : page où revenir après un paiement sur la page du prestataire
    Task<DemandePaiementMobile> DemanderPaiementAsync(decimal montant, ClientPaiement client, string description,
        string referenceExterne, string? urlRetour);

    Task<StatutPaiementMobile> StatutAsync(string reference);

    // Vérifie qu'une notification (webhook) vient bien du prestataire : signature calculée sur le corps brut reçu
    bool SignatureWebhookValide(string corps, string? signature, string? horodatage);
}
