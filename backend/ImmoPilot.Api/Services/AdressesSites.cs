namespace ImmoPilot.Api.Services;

// Adresses publiques du site et du super admin, pour les liens envoyés par e-mail.
// Ordre : variable dédiée (Frontend:Url / SuperAdmin:FrontendUrl), sinon l'origine CORS correspondante
// (Cors:Origines:0 = site, Cors:Origines:1 = super admin), sinon l'adresse locale de développement.
public static class AdressesSites
{
    public static string Site(IConfiguration c) =>
        Choisir(c["Frontend:Url"], c["Cors:Origines:0"], "http://localhost:3000");

    public static string SuperAdmin(IConfiguration c) =>
        Choisir(c["SuperAdmin:FrontendUrl"], c["Cors:Origines:1"], "http://localhost:3001");

    // true si un lien d'e-mail pointerait vers localhost (configuration oubliée chez l'hébergeur)
    public static bool PointeVersLocalhost(IConfiguration c) => Site(c).Contains("localhost", StringComparison.OrdinalIgnoreCase);

    private static string Choisir(string? dediee, string? cors, string local) =>
        (!string.IsNullOrWhiteSpace(dediee) ? dediee
            : !string.IsNullOrWhiteSpace(cors) ? cors
            : local).Trim().TrimEnd('/');
}
