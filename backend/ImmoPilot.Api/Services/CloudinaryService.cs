using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Envoi signé vers l'API REST de Cloudinary (https://cloudinary.com/documentation/upload_images)
// Configuration : Cloudinary:CloudName, Cloudinary:ApiKey, Cloudinary:ApiSecret (à mettre dans les user secrets)
public class CloudinaryService(HttpClient http, IConfiguration configuration, TimeProvider horloge) : IStockagePhotos
{
    public const long TailleMax = 5 * 1024 * 1024; // 5 Mo
    private static readonly string[] TypesAcceptes = ["image/jpeg", "image/png", "image/webp"];

    private string? CloudName => configuration["Cloudinary:CloudName"];
    private string? ApiKey => configuration["Cloudinary:ApiKey"];
    private string? ApiSecret => configuration["Cloudinary:ApiSecret"];

    public bool EstConfigure =>
        !string.IsNullOrWhiteSpace(CloudName) && !string.IsNullOrWhiteSpace(ApiKey) && !string.IsNullOrWhiteSpace(ApiSecret);

    public async Task<(string Url, string Id)> EnvoyerAsync(IFormFile fichier, string dossier)
    {
        if (!EstConfigure) throw new RegleMetierException("L'envoi de photos n'est pas configuré sur le serveur.");
        if (fichier.Length == 0) throw new DonneesInvalidesException("Le fichier est vide.");
        if (fichier.Length > TailleMax) throw new DonneesInvalidesException("La photo dépasse 5 Mo.");
        if (!TypesAcceptes.Contains(fichier.ContentType))
            throw new DonneesInvalidesException("Format non accepté : envoyez une image JPG, PNG ou WebP.");

        var parametres = new SortedDictionary<string, string>
        {
            ["folder"] = dossier,
            ["timestamp"] = horloge.GetUtcNow().ToUnixTimeSeconds().ToString(),
        };

        using var formulaire = new MultipartFormDataContent();
        foreach (var (cle, valeur) in parametres) formulaire.Add(new StringContent(valeur), cle);
        formulaire.Add(new StringContent(ApiKey!), "api_key");
        formulaire.Add(new StringContent(Signer(parametres)), "signature");
        await using var flux = fichier.OpenReadStream();
        formulaire.Add(new StreamContent(flux), "file", fichier.FileName);

        using var reponse = await http.PostAsync($"https://api.cloudinary.com/v1_1/{CloudName}/image/upload", formulaire);
        var corps = await reponse.Content.ReadAsStringAsync();
        if (!reponse.IsSuccessStatusCode)
            throw new DonneesInvalidesException("La photo n'a pas pu être envoyée (image invalide ou service indisponible).");

        using var json = JsonDocument.Parse(corps);
        return (json.RootElement.GetProperty("secure_url").GetString()!, json.RootElement.GetProperty("public_id").GetString()!);
    }

    public async Task SupprimerAsync(string id)
    {
        if (!EstConfigure) return;
        var parametres = new SortedDictionary<string, string>
        {
            ["public_id"] = id,
            ["timestamp"] = horloge.GetUtcNow().ToUnixTimeSeconds().ToString(),
        };
        using var formulaire = new FormUrlEncodedContent(new Dictionary<string, string>(parametres)
        {
            ["api_key"] = ApiKey!,
            ["signature"] = Signer(parametres),
        });
        // Échec non bloquant : au pire, l'ancienne image reste stockée chez Cloudinary
        using var _ = await http.PostAsync($"https://api.cloudinary.com/v1_1/{CloudName}/image/destroy", formulaire);
    }

    // Signature Cloudinary : SHA-1 de "cle1=valeur1&cle2=valeur2" (par ordre alphabétique) + secret
    private string Signer(SortedDictionary<string, string> parametres)
    {
        var texte = string.Join("&", parametres.Select(p => $"{p.Key}={p.Value}")) + ApiSecret;
        return Convert.ToHexStringLower(SHA1.HashData(Encoding.UTF8.GetBytes(texte)));
    }
}
