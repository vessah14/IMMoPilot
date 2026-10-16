using System.Collections.Concurrent;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Simulateur de paiement : imite SasPay sans argent réel (abonnements en développement / démo, et loyers pour l'instant).
// Activation (développement uniquement) : dans appsettings.Development.json → "Paiement": { "Simulation": true }
//
// Le résultat dépend des 4 derniers chiffres du numéro saisi :
//   …0000 → paiement refusé (ex : solde insuffisant), 3 secondes après la demande
//   …1111 → le client ne valide jamais (reste « en attente »)
//   autre → paiement réussi, 8 secondes après la demande (le temps de « taper son code »)
public class SimulateurPaiement(TimeProvider horloge, ILogger<SimulateurPaiement> journal) : IPaiementMobile
{
    private static readonly TimeSpan DelaiReussite = TimeSpan.FromSeconds(8);
    private static readonly TimeSpan DelaiRefus = TimeSpan.FromSeconds(3);

    private record Transaction(string Telephone, decimal Montant, DateTimeOffset Debut);

    // Transactions en mémoire (perdues au redémarrage de l'API, comme il se doit pour un simulateur)
    private readonly ConcurrentDictionary<string, Transaction> transactions = new();
    private readonly ConcurrentDictionary<string, decimal> reversements = new();

    public bool EstConfigure => true;
    public bool EstSimulation => true;

    public Task<DemandePaiementMobile> DemanderPaiementAsync(decimal montant, ClientPaiement client, string description,
        string referenceExterne, string? urlRetour)
    {
        if (montant <= 0) throw new DonneesInvalidesException("Montant invalide.");

        var reference = $"SIMU-{Guid.NewGuid():N}"[..17];
        transactions[reference] = new Transaction(client.Telephone, montant, horloge.GetUtcNow());
        journal.LogInformation("[Simulateur] Demande de {Montant} FCFA au {Telephone} ({Description}) → {Reference}",
            montant, client.Telephone, description, reference);

        var operateur = Operateurs.De(client.Telephone);
        return Task.FromResult(new DemandePaiementMobile(reference, operateur == Operateurs.Mtn ? "*126#" : "#150*50#", operateur, null));
    }

    public Task<StatutPaiementMobile> StatutAsync(string reference)
    {
        if (!transactions.TryGetValue(reference, out var t))
            return Task.FromResult(new StatutPaiementMobile(EtatPaiementMobile.Echoue, null, null)); // inconnue (ex : API redémarrée)

        var ecoule = horloge.GetUtcNow() - t.Debut;
        var etat = t.Telephone.EndsWith("0000") ? (ecoule >= DelaiRefus ? EtatPaiementMobile.Echoue : EtatPaiementMobile.EnAttente)
            : t.Telephone.EndsWith("1111") ? EtatPaiementMobile.EnAttente
            : ecoule >= DelaiReussite ? EtatPaiementMobile.Reussi : EtatPaiementMobile.EnAttente;

        return Task.FromResult(new StatutPaiementMobile(etat, Operateurs.De(t.Telephone),
            etat == EtatPaiementMobile.Reussi ? $"SIMU{reference[^8..].ToUpperInvariant()}" : null,
            etat == EtatPaiementMobile.Reussi ? t.Montant : null, // pas de frais en simulation
            t.Montant, "XAF"));
    }

    // Reversement simulé : toujours accepté puis reçu immédiatement, sans frais
    public Task<DemandeReversement> ReverserAsync(decimal montant, string telephone, string nomBeneficiaire, string description,
        string cleIdempotence)
    {
        var reference = $"SIMU-REV-{Guid.NewGuid():N}"[..21];
        reversements[reference] = montant;
        journal.LogInformation("[Simulateur] Reversement de {Montant} FCFA au {Telephone} ({Description}) → {Reference}",
            montant, telephone, description, reference);
        return Task.FromResult(new DemandeReversement(ResultatReversement.Accepte, reference, null));
    }

    public Task<StatutPaiementMobile> StatutReversementAsync(string reference) =>
        Task.FromResult(reversements.TryGetValue(reference, out var montant)
            ? new StatutPaiementMobile(EtatPaiementMobile.Reussi, null, reference, montant, montant, "XAF")
            : new StatutPaiementMobile(EtatPaiementMobile.Echoue, null, null)); // inconnu (ex : API redémarrée)

    // Pas de webhook en simulation : la page de paiement et la tâche de fond interrogent StatutAsync
    public bool SignatureWebhookValide(string corps, string? signature, string? horodatage) => false;
}
