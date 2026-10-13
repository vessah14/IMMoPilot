namespace ImmoPilot.Api.Interfaces;

// Hébergement des photos (implémenté avec Cloudinary)
public interface IStockagePhotos
{
    bool EstConfigure { get; }

    // Envoie l'image et renvoie son adresse publique et son identifiant
    Task<(string Url, string Id)> EnvoyerAsync(IFormFile fichier, string dossier);

    Task SupprimerAsync(string id);
}
