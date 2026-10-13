namespace ImmoPilot.Api.Interfaces;

// Réponse de CamPay à une demande de paiement
public record DemandeCampay(string Reference, string? CodeUssd, string? Operateur);

// État d'une transaction CamPay : "PENDING", "SUCCESSFUL" ou "FAILED"
public record StatutCampay(string Statut, string? Operateur, string? ReferenceOperateur);

// Encaissement Orange Money / MTN MoMo via l'API CamPay (https://www.campay.net)
public interface ICampayService
{
    bool EstConfigure { get; }

    // true = simulateur de paiement (aucun argent réel), voir SimulateurCampay
    bool EstSimulation => false;

    // Envoie une demande de paiement sur le téléphone (format 2376XXXXXXXX)
    Task<DemandeCampay> DemanderPaiementAsync(decimal montant, string telephone, string description, string referenceExterne);

    Task<StatutCampay> StatutAsync(string reference);

    // Vérifie que la signature d'un webhook a bien été produite avec notre clé webhook CamPay
    Task<bool> SignatureValideAsync(string? signature);
}
