using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace ImmoPilot.Api.Services;

// Client de l'API CamPay.
// Configuration (user secrets en développement, variables d'environnement en production) :
//   Campay:BaseUrl      https://demo.campay.net (tests) ou https://www.campay.net (production)
//   Campay:Username     nom d'utilisateur de l'application CamPay
//   Campay:Password     mot de passe de l'application CamPay
//   Campay:WebhookKey   clé webhook de l'application (vérifie que les notifications viennent de CamPay)
public class CampayService(
    HttpClient http,
    IConfiguration configuration,
    IMemoryCache cache,
    ILogger<CampayService> journal) : ICampayService
{
    private const string CleJeton = "campay-jeton";

    private string BaseUrl => (configuration["Campay:BaseUrl"] ?? "https://demo.campay.net").TrimEnd('/');
    private string? Username => configuration["Campay:Username"];
    private string? Password => configuration["Campay:Password"];

    public bool EstConfigure => !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password);

    public async Task<DemandeCampay> DemanderPaiementAsync(decimal montant, string telephone, string description, string referenceExterne)
    {
        using var requete = await RequeteAsync(HttpMethod.Post, "/api/collect/");
        requete.Content = JsonContent.Create(new
        {
            amount = decimal.Round(montant).ToString(CultureInfo.InvariantCulture), // montant réel facturé en FCFA
            currency = "XAF",
            from = telephone,
            description,
            external_reference = referenceExterne,
        });

        using var reponse = await http.SendAsync(requete);
        var corps = await reponse.Content.ReadAsStringAsync();
        if (!reponse.IsSuccessStatusCode)
        {
            journal.LogWarning("CamPay collect refusé ({Statut}) : {Corps}", (int)reponse.StatusCode, corps);
            throw new DonneesInvalidesException(MessageErreur(corps)
                ?? "La demande de paiement a été refusée. Vérifiez le numéro (Orange Money ou MTN MoMo) et réessayez.");
        }

        using var json = JsonDocument.Parse(corps);
        var r = json.RootElement;
        return new DemandeCampay(Texte(r, "reference")!, Texte(r, "ussd_code"), Texte(r, "operator"));
    }

    public async Task<StatutCampay> StatutAsync(string reference)
    {
        using var requete = await RequeteAsync(HttpMethod.Get, $"/api/transaction/{Uri.EscapeDataString(reference)}/");
        using var reponse = await http.SendAsync(requete);
        var corps = await reponse.Content.ReadAsStringAsync();
        if (!reponse.IsSuccessStatusCode)
        {
            journal.LogWarning("CamPay statut indisponible ({Statut}) : {Corps}", (int)reponse.StatusCode, corps);
            return new StatutCampay("PENDING", null, null); // on réessaiera plus tard
        }

        using var json = JsonDocument.Parse(corps);
        var r = json.RootElement;
        return new StatutCampay(Texte(r, "status") ?? "PENDING", Texte(r, "operator"), Texte(r, "operator_reference"));
    }

    // La signature des webhooks CamPay est un jeton JWT signé (HS256) avec la clé webhook de l'application
    public async Task<bool> SignatureValideAsync(string? signature)
    {
        var cle = configuration["Campay:WebhookKey"];
        if (string.IsNullOrWhiteSpace(cle) || string.IsNullOrWhiteSpace(signature)) return false;

        var resultat = await new JsonWebTokenHandler().ValidateTokenAsync(signature, new TokenValidationParameters
        {
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cle)),
            ValidateIssuerSigningKey = true,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false, // CamPay n'indique pas toujours d'expiration : seule la signature compte
            RequireExpirationTime = false,
        });
        return resultat.IsValid;
    }

    // Requête authentifiée : "Authorization: Token <jeton>"
    private async Task<HttpRequestMessage> RequeteAsync(HttpMethod methode, string chemin)
    {
        if (!EstConfigure) throw new RegleMetierException("Le paiement en ligne n'est pas encore configuré.");
        var requete = new HttpRequestMessage(methode, BaseUrl + chemin);
        requete.Headers.Authorization = new AuthenticationHeaderValue("Token", await JetonAsync());
        return requete;
    }

    // Jeton d'accès temporaire, gardé en mémoire jusqu'à peu avant son expiration
    private async Task<string> JetonAsync()
    {
        if (cache.TryGetValue(CleJeton, out string? jeton) && jeton is not null) return jeton;

        using var reponse = await http.PostAsJsonAsync($"{BaseUrl}/api/token/", new { username = Username, password = Password });
        var corps = await reponse.Content.ReadAsStringAsync();
        if (!reponse.IsSuccessStatusCode)
        {
            journal.LogError("Authentification CamPay refusée ({Statut}) : vérifiez Campay:Username et Campay:Password", (int)reponse.StatusCode);
            throw new RegleMetierException("Le service de paiement est momentanément indisponible.");
        }

        using var json = JsonDocument.Parse(corps);
        jeton = Texte(json.RootElement, "token")!;
        var expire = json.RootElement.TryGetProperty("expires_in", out var e) && e.TryGetInt32(out var secondes) ? secondes : 3600;
        cache.Set(CleJeton, jeton, TimeSpan.FromSeconds(Math.Max(expire - 60, 60)));
        return jeton;
    }

    private static string? Texte(JsonElement element, string propriete) =>
        element.TryGetProperty(propriete, out var v) && v.ValueKind != JsonValueKind.Null ? v.ToString() : null;

    // Message d'erreur éventuel renvoyé par CamPay (ex : {"message": "..."})
    private static string? MessageErreur(string corps)
    {
        try
        {
            using var json = JsonDocument.Parse(corps);
            return Texte(json.RootElement, "message");
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
