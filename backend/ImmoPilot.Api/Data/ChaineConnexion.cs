using Npgsql;

namespace ImmoPilot.Api.Data;

// Lit la chaîne de connexion PostgreSQL de façon tolérante, pour éviter les erreurs de copier-coller chez l'hébergeur :
// - accepte le format « clé=valeur » (Host=…;Database=…) ET l'adresse donnée par Neon / Supabase (postgresql://…)
// - retire les guillemets et espaces autour, et ignore les lignes en trop collées par erreur
// - en cas d'erreur, le message indique quoi corriger sans jamais afficher le mot de passe
public static class ChaineConnexion
{
    public const string Variable = "ConnectionStrings__ImmoPilot";

    public static string Normaliser(string? brute, ILogger? journal = null)
    {
        if (string.IsNullOrWhiteSpace(brute))
            throw new InvalidOperationException($"Chaîne de connexion manquante : renseignez la variable {Variable} (voir README).");

        // Seule la première ligne compte (le reste vient d'un copier-coller de plusieurs variables)
        var lignes = brute.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (lignes.Length > 1)
            journal?.LogWarning("La variable {Variable} contient {Lignes} lignes : seule la première est utilisée. Corrigez-la chez votre hébergeur.",
                Variable, lignes.Length);
        var valeur = lignes[0].Trim().Trim('"', '\'').Trim();

        try
        {
            var constructeur = valeur.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
                               || valeur.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
                ? DepuisAdresse(valeur)
                : new NpgsqlConnectionStringBuilder(valeur);

            if (string.IsNullOrWhiteSpace(constructeur.Host))
                throw new ArgumentException("l'hôte (Host) est absent");
            return constructeur.ConnectionString;
        }
        catch (Exception e) when (e is ArgumentException or FormatException or UriFormatException or KeyNotFoundException)
        {
            // Le message d'origine peut contenir le mot de passe : on ne garde qu'une explication générale
            throw new InvalidOperationException(
                $"Chaîne de connexion invalide dans {Variable} ({TypeErreur(e)}). Format attendu : l'adresse donnée par Neon " +
                "(postgresql://utilisateur:motdepasse@hote/base?sslmode=require) ou Host=…;Database=…;Username=…;Password=…;SSL Mode=Require");
        }
    }

    // postgresql://utilisateur:motdepasse@hote:5432/base?sslmode=require&channel_binding=require
    private static NpgsqlConnectionStringBuilder DepuisAdresse(string adresse)
    {
        var uri = new Uri(adresse);
        var identifiants = uri.UserInfo.Split(':', 2);
        var constructeur = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(identifiants[0]),
            Password = identifiants.Length > 1 ? Uri.UnescapeDataString(identifiants[1]) : null,
            SslMode = SslMode.Require, // les hébergeurs exigent le chiffrement
        };

        foreach (var (cle, val) in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries)
                     .Select(p => p.Split('=', 2))
                     .Where(p => p.Length == 2)
                     .Select(p => (p[0].ToLowerInvariant(), Uri.UnescapeDataString(p[1]))))
        {
            if (cle == "sslmode" && Enum.TryParse<SslMode>(val.Replace("-", ""), true, out var ssl)) constructeur.SslMode = ssl;
            if (cle == "channel_binding" && Enum.TryParse<ChannelBinding>(val, true, out var liaison)) constructeur.ChannelBinding = liaison;
        }
        return constructeur;
    }

    private static string TypeErreur(Exception e) => e switch
    {
        UriFormatException => "adresse postgresql:// mal formée",
        KeyNotFoundException => "mot-clé inconnu",
        _ when e.Message.Contains("hôte") => "l'hôte (Host) est absent",
        _ => "valeur inattendue, souvent un guillemet ou du texte en trop",
    };
}
