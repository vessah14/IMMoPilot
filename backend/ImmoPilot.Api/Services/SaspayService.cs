using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Client de l'API SasPay (https://docs.saspay.me).
// Configuration (user secrets en développement, variables d'environnement en production) :
//   Saspay:CleApi          clé secrète du tableau de bord SasPay → Développeur : sk_test_… (tests) ou sk_live_… (argent réel)
//   Saspay:SecretWebhook   secret de signature du webhook (affiché une seule fois à sa création dans le tableau de bord)
//   Saspay:BaseUrl         facultatif, https://api.saspay.me/api/v1 par défaut
public class SaspayService(HttpClient http, IConfiguration configuration, TimeProvider horloge, ILogger<SaspayService> journal)
    : IPaiementMobile
{
    private static readonly TimeSpan ToleranceWebhook = TimeSpan.FromMinutes(5);

    private string BaseUrl => (configuration["Saspay:BaseUrl"] ?? "https://api.saspay.me/api/v1").TrimEnd('/');
    private string? CleApi => configuration["Saspay:CleApi"]?.Trim();

    public bool EstConfigure => !string.IsNullOrWhiteSpace(CleApi);

    public async Task<DemandePaiementMobile> DemanderPaiementAsync(decimal montant, ClientPaiement client, string description,
        string referenceExterne, string? urlRetour)
    {
        var operateur = Operateurs.De(client.Telephone);
        var (prenom, nom) = Separer(client.NomComplet);

        using var requete = Requete(HttpMethod.Post, "/payments/softpay/");
        // Même clé pour tout nouvel essai de cette demande : SasPay ne débite jamais deux fois
        requete.Headers.Add("Idempotency-Key", referenceExterne);
        requete.Content = JsonContent.Create(new Dictionary<string, object?>
        {
            ["amount"] = decimal.Round(montant).ToString("0.00", CultureInfo.InvariantCulture), // chaîne décimale, en FCFA
            ["currency"] = "XAF",
            ["country"] = "CM",
            ["network"] = operateur == Operateurs.Mtn ? "mtn_cm" : "orange_cm",
            ["description"] = description,
            ["customer"] = new { email = client.Email, first_name = prenom, last_name = nom, phone = "+" + client.Telephone },
            ["metadata"] = new { reference_externe = referenceExterne },
            // Frais SasPay à la charge d'IMMO PILOT : le bailleur paie exactement le prix affiché
            ["fee_charge_mode"] = "DEDUCTED",
            ["return_url"] = urlRetour, // retour sur IMMO PILOT après un paiement sur la page SasPay
        });

        using var reponse = await http.SendAsync(requete);
        var corps = await reponse.Content.ReadAsStringAsync();
        // Clé refusée ou sans droit d'encaissement : problème de configuration, pas de la saisie du bailleur
        if (reponse.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden)
        {
            journal.LogError("SasPay refuse la clé API ({Statut}) : vérifiez Saspay__CleApi (scope PAYIN ou BOTH) : {Corps}",
                (int)reponse.StatusCode, corps);
            throw new RegleMetierException("Le service de paiement est momentanément indisponible. Réessayez plus tard.");
        }
        if (!reponse.IsSuccessStatusCode)
        {
            journal.LogWarning("SasPay softpay refusé ({Statut}) : {Corps}", (int)reponse.StatusCode, corps);
            throw new DonneesInvalidesException(MessageErreur(corps)
                ?? "La demande de paiement a été refusée. Vérifiez le numéro (Orange Money ou MTN MoMo) et réessayez.");
        }

        var d = Donnees(corps);
        var url = Texte(d, "checkout_url");
        var instructions = Texte(d, "instructions");
        return new DemandePaiementMobile(
            Texte(d, "id") ?? throw new RegleMetierException("Réponse inattendue du service de paiement."),
            string.IsNullOrWhiteSpace(instructions) ? null : instructions,
            operateur,
            string.IsNullOrWhiteSpace(url) ? null : url);
    }

    public Task<StatutPaiementMobile> StatutAsync(string reference) =>
        VerifierAsync($"/payments/{Uri.EscapeDataString(reference)}/verify/", "Paiement", reference);

    public async Task<DemandeReversement> ReverserAsync(decimal montant, string telephone, string nomBeneficiaire,
        string description, string cleIdempotence)
    {
        var (prenom, nom) = Separer(nomBeneficiaire);
        string corps;
        System.Net.HttpStatusCode code;
        try
        {
            using var requete = Requete(HttpMethod.Post, "/payouts/initialize/");
            requete.Headers.Add("Idempotency-Key", cleIdempotence);
            requete.Content = JsonContent.Create(new Dictionary<string, object?>
            {
                ["amount"] = decimal.Floor(montant).ToString("0.00", CultureInfo.InvariantCulture),
                ["currency"] = "XAF",
                ["country"] = "CM",
                ["method"] = Operateurs.De(telephone) == Operateurs.Mtn ? "mtn_cm" : "orange_cm",
                ["recipient"] = new { msisdn = telephone },
                ["customer"] = new { first_name = prenom, last_name = nom, phone = "+" + telephone },
                ["description"] = description,
                ["metadata"] = new { cle_reversement = cleIdempotence },
                // Frais de reversement déduits : le propriétaire reçoit le montant moins ces frais
                ["fee_charge_mode"] = "DEDUCTED",
            });
            using var reponse = await http.SendAsync(requete);
            code = reponse.StatusCode;
            corps = await reponse.Content.ReadAsStringAsync();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            // La demande a pu arriver chez SasPay : on réessaiera avec la même clé, sans risque de double envoi
            journal.LogWarning(ex, "SasPay payout sans réponse (clé {Cle})", cleIdempotence);
            return new DemandeReversement(ResultatReversement.Incertain, null, "Service de paiement injoignable");
        }

        if ((int)code is >= 200 and < 300)
            return new DemandeReversement(ResultatReversement.Accepte,
                Texte(Donnees(corps), "id") ?? throw new RegleMetierException("Réponse inattendue du service de paiement."), null);

        var erreur = MessageErreur(corps) ?? $"HTTP {(int)code}";
        var codeErreur = CodeErreur(corps);
        // Panne, limite de débit, ou même clé encore en cours de traitement : il faut réessayer avec la même clé
        if ((int)code >= 500 || code is System.Net.HttpStatusCode.Conflict or System.Net.HttpStatusCode.TooManyRequests)
        {
            journal.LogWarning("SasPay payout à réessayer ({Statut}) : {Corps}", (int)code, corps);
            return new DemandeReversement(ResultatReversement.Incertain, null, erreur);
        }
        // Configuration à corriger chez SasPay (IP du serveur, droits de la clé) ou fonds pas encore disponibles
        if (code is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden
            || codeErreur is "insufficient_balance")
        {
            journal.LogError("SasPay payout non envoyé ({Statut}, {Code}) : {Corps}", (int)code, codeErreur, corps);
            return new DemandeReversement(ResultatReversement.NonEnvoye, null, erreur);
        }

        journal.LogError("SasPay payout refusé ({Statut}) : {Corps}", (int)code, corps);
        return new DemandeReversement(ResultatReversement.Refuse, null, erreur);
    }

    public Task<StatutPaiementMobile> StatutReversementAsync(string reference) =>
        VerifierAsync($"/payouts/{Uri.EscapeDataString(reference)}/verify/", "Reversement", reference);

    // Statut d'un paiement ou d'un reversement : SasPay revérifie l'état réel auprès de l'opérateur avant de répondre
    private async Task<StatutPaiementMobile> VerifierAsync(string chemin, string nature, string reference)
    {
        using var requete = Requete(HttpMethod.Get, chemin);
        using var reponse = await http.SendAsync(requete);
        var corps = await reponse.Content.ReadAsStringAsync();
        if (!reponse.IsSuccessStatusCode)
        {
            journal.LogWarning("SasPay statut indisponible ({Statut}) : {Corps}", (int)reponse.StatusCode, corps);
            return new StatutPaiementMobile(EtatPaiementMobile.EnAttente, null, null); // on réessaiera plus tard
        }

        var d = Donnees(corps);
        var etat = Texte(d, "status") switch
        {
            "SUCCESS" => EtatPaiementMobile.Reussi,
            "FAILED" or "CANCELLED" => EtatPaiementMobile.Echoue,
            _ => EtatPaiementMobile.EnAttente,
        };
        // Réponse complète de SasPay en cas d'échec (aucun secret dedans) : le motif aide à diagnostiquer
        if (etat == EtatPaiementMobile.Echoue)
            journal.LogWarning("{Nature} SasPay {Reference} échoué : {Corps}", nature, reference, corps);

        var referenceOperateur = Texte(d, "external_reference");
        if (string.IsNullOrWhiteSpace(referenceOperateur)) referenceOperateur = Texte(d, "reference");
        return new StatutPaiementMobile(etat, null, referenceOperateur,
            Montant(Texte(d, "net_amount")), Montant(Texte(d, "requested_amount")), Texte(d, "currency"));
    }

    private static decimal? Montant(string? texte) =>
        decimal.TryParse(texte, NumberStyles.Number, CultureInfo.InvariantCulture, out var m) ? m : null;

    // Code d'erreur stable de SasPay : { "error": { "code": "insufficient_balance" } }
    private static string? CodeErreur(string corps)
    {
        try
        {
            var racine = JsonDocument.Parse(corps).RootElement;
            return Texte(racine.TryGetProperty("error", out var e) ? e : racine, "code");
        }
        catch (JsonException)
        {
            return null;
        }
    }

    // Signature SasPay : HMAC-SHA256 (hexadécimal) de « horodatage.corps » avec le secret du webhook,
    // et horodatage à moins de 5 minutes de notre horloge (une notification interceptée ne peut pas être rejouée)
    public bool SignatureWebhookValide(string corps, string? signature, string? horodatage)
    {
        var secret = configuration["Saspay:SecretWebhook"]?.Trim();
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(signature)
            || !long.TryParse(horodatage, NumberStyles.None, CultureInfo.InvariantCulture, out var secondes))
            return false;

        var ecart = horloge.GetUtcNow() - DateTimeOffset.FromUnixTimeSeconds(secondes);
        if (ecart.Duration() > ToleranceWebhook) return false;

        var attendue = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes($"{horodatage}.{corps}"));
        try
        {
            // Comparaison en temps constant
            return CryptographicOperations.FixedTimeEquals(attendue, Convert.FromHexString(signature.Trim()));
        }
        catch (FormatException)
        {
            return false;
        }
    }

    // Requête authentifiée : "Authorization: Bearer sk_…"
    private HttpRequestMessage Requete(HttpMethod methode, string chemin)
    {
        if (!EstConfigure) throw new RegleMetierException("Le paiement en ligne n'est pas encore configuré.");
        var requete = new HttpRequestMessage(methode, BaseUrl + chemin);
        requete.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CleApi);
        return requete;
    }

    // « Awa Sossou Ngo » → ("Awa", "Sossou Ngo") ; un seul mot → utilisé pour les deux
    private static (string Prenom, string Nom) Separer(string nomComplet)
    {
        var mots = nomComplet.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return mots.Length switch
        {
            0 => ("Client", "IMMO PILOT"),
            1 => (mots[0], mots[0]),
            _ => (mots[0], mots[1]),
        };
    }

    // Les réponses SasPay sont enveloppées dans { "success": …, "data": { … }, "code": … }
    private static JsonElement Donnees(string corps)
    {
        var racine = JsonDocument.Parse(corps).RootElement;
        return racine.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object ? data : racine;
    }

    private static string? Texte(JsonElement element, string propriete) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(propriete, out var v) && v.ValueKind != JsonValueKind.Null
            ? v.ToString()
            : null;

    // Message d'erreur SasPay : { "error": { "message": "…" } } ou { "error": { "detail": "…" } },
    // ou erreurs de validation { "error": { "champ": ["…"] } }
    private static string? MessageErreur(string corps)
    {
        try
        {
            var racine = JsonDocument.Parse(corps).RootElement;
            var erreur = racine.TryGetProperty("error", out var e) ? e : racine;
            if ((Texte(erreur, "message") ?? Texte(erreur, "detail")) is { } message) return message;
            if (erreur.ValueKind == JsonValueKind.Object)
                foreach (var champ in erreur.EnumerateObject())
                    if (champ.Value.ValueKind == JsonValueKind.Array && champ.Value.GetArrayLength() > 0)
                        return champ.Value[0].ToString();
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
