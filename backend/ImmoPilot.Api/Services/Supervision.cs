using System.Collections.Concurrent;

namespace ImmoPilot.Api.Services;

// ---- Journal en mémoire, affiché en direct dans la page Supervision du super admin ----
// Garde les 300 derniers événements utiles : avertissements et erreurs de toute l'API,
// plus les informations de notre propre code (paiement confirmé, loyer reversé, e-mail envoyé…).
// Perdu au redémarrage : c'est un aperçu en temps réel, pas un historique (les logs Render restent la référence).
public record EntreeJournal(long Id, DateTime Date, string Niveau, string Source, string Message, string? Exception);

public class JournalMemoire
{
    private const int Taille = 300;
    private readonly ConcurrentQueue<EntreeJournal> entrees = new();
    private long dernierId;

    public void Ajouter(LogLevel niveau, string categorie, string message, Exception? exception)
    {
        entrees.Enqueue(new EntreeJournal(
            Interlocked.Increment(ref dernierId),
            DateTime.UtcNow,
            niveau.ToString(),
            categorie[(categorie.LastIndexOf('.') + 1)..], // « SaspayService » plutôt que le nom complet
            message,
            exception is null ? null : $"{exception.GetType().Name} : {exception.Message}"));
        while (entrees.Count > Taille) entrees.TryDequeue(out _);
    }

    // Les plus récentes d'abord
    public IReadOnlyList<EntreeJournal> Dernieres(int nombre) => entrees.Reverse().Take(nombre).ToList();
}

public class FournisseurJournalMemoire(JournalMemoire journal) : ILoggerProvider
{
    public ILogger CreateLogger(string categorie) => new Journaliseur(journal, categorie);

    public void Dispose() { }

    private sealed class Journaliseur(JournalMemoire journal, string categorie) : ILogger
    {
        // Notre code : à partir d'Information ; le reste (ASP.NET, EF Core, HttpClient…) : avertissements et erreurs seulement
        private readonly LogLevel minimum = categorie.StartsWith("ImmoPilot", StringComparison.Ordinal)
            ? LogLevel.Information
            : LogLevel.Warning;

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel niveau) => niveau >= minimum && niveau != LogLevel.None;

        public void Log<TState>(LogLevel niveau, EventId id, TState etat, Exception? exception, Func<TState, Exception?, string> format)
        {
            if (IsEnabled(niveau)) journal.Ajouter(niveau, categorie, format(etat, exception), exception);
        }
    }
}

// ---- État du serveur : démarrage, IP sortante, passages des tâches de fond ----
public record EtatTache(DateTime DernierPassage, long DureeMs, string? Erreur);

public class EtatServeur
{
    public DateTime DemarreLe { get; } = DateTime.UtcNow;
    public string? IpSortante { get; set; } // connue quelques secondes après le démarrage

    private readonly ConcurrentDictionary<string, EtatTache> taches = new();

    public void NoterTache(string nom, DateTime debut, string? erreur) =>
        taches[nom] = new EtatTache(debut, (long)(DateTime.UtcNow - debut).TotalMilliseconds, erreur);

    public IReadOnlyDictionary<string, EtatTache> Taches => taches;

    // Mode de paiement en clair, d'après la configuration (aucun secret affiché)
    public static string ModePaiements(IConfiguration c, bool simulation, bool modeDemo, bool developpement)
    {
        var cle = c["Saspay:CleApi"]?.Trim() ?? "";
        return modeDemo ? "simulateur (mode démo : aucun argent réel)"
            : simulation && developpement ? "simulateur (développement)"
            : cle.StartsWith("sk_test_", StringComparison.Ordinal) ? "SasPay en TEST (clé sk_test_ : aucun argent réel)"
            : cle.StartsWith("sk_live_", StringComparison.Ordinal) ? "SasPay en PRODUCTION (clé sk_live_ : argent réel)"
            : "NON configurés (Saspay__CleApi absente) : le paiement en ligne est désactivé";
    }
}
