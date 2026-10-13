using System.Collections.Concurrent;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Simulateur de paiement : imite CamPay sans argent réel, pour tester les abonnements en développement.
// Activation (développement uniquement) : dans appsettings.Development.json → "Campay": { "Simulation": true }
//
// Le résultat dépend des 4 derniers chiffres du numéro saisi :
//   …0000 → paiement refusé (ex : solde insuffisant), 3 secondes après la demande
//   …1111 → le client ne valide jamais (reste « en attente »)
//   autre → paiement réussi, 8 secondes après la demande (le temps de « taper son code »)
public class SimulateurCampay(TimeProvider horloge, ILogger<SimulateurCampay> journal) : ICampayService
{
    private static readonly TimeSpan DelaiReussite = TimeSpan.FromSeconds(8);
    private static readonly TimeSpan DelaiRefus = TimeSpan.FromSeconds(3);

    private record Transaction(string Telephone, decimal Montant, DateTimeOffset Debut);

    // Transactions en mémoire (perdues au redémarrage de l'API, comme il se doit pour un simulateur)
    private readonly ConcurrentDictionary<string, Transaction> transactions = new();

    public bool EstConfigure => true;
    public bool EstSimulation => true;

    public Task<DemandeCampay> DemanderPaiementAsync(decimal montant, string telephone, string description, string referenceExterne)
    {
        if (montant <= 0) throw new DonneesInvalidesException("Montant invalide.");

        var reference = $"SIMU-{Guid.NewGuid():N}"[..17];
        transactions[reference] = new Transaction(telephone, montant, horloge.GetUtcNow());
        journal.LogInformation("[Simulateur] Demande de {Montant} FCFA au {Telephone} ({Description}) → {Reference}",
            montant, telephone, description, reference);

        var operateur = Operateur(telephone);
        return Task.FromResult(new DemandeCampay(reference, operateur == "MTN" ? "*126#" : "#150*50#", operateur));
    }

    public Task<StatutCampay> StatutAsync(string reference)
    {
        if (!transactions.TryGetValue(reference, out var t))
            return Task.FromResult(new StatutCampay("FAILED", null, null)); // inconnue (ex : API redémarrée)

        var ecoule = horloge.GetUtcNow() - t.Debut;
        var statut = t.Telephone.EndsWith("0000") ? (ecoule >= DelaiRefus ? "FAILED" : "PENDING")
            : t.Telephone.EndsWith("1111") ? "PENDING"
            : ecoule >= DelaiReussite ? "SUCCESSFUL" : "PENDING";

        return Task.FromResult(new StatutCampay(statut, Operateur(t.Telephone),
            statut == "SUCCESSFUL" ? $"SIMU{reference[^8..].ToUpperInvariant()}" : null));
    }

    // Pas de webhook en simulation : la page de paiement et la tâche de fond interrogent StatutAsync
    public Task<bool> SignatureValideAsync(string? signature) => Task.FromResult(false);

    // Préfixes camerounais (2376XXXXXXXX) : MTN 67x, 650-654, 680-684 ; Orange 69x, 655-659, 685-689
    private static string Operateur(string telephone)
    {
        var p = telephone.Length >= 6 ? telephone.Substring(3, 3) : "";
        return p.StartsWith("67") || p is "650" or "651" or "652" or "653" or "654" or "680" or "681" or "682" or "683" or "684"
            ? "MTN"
            : "ORANGE";
    }
}
