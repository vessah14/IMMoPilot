namespace ImmoPilot.Api.Controllers;

// Écriture / suppression du cookie qui contient le jeton de connexion
internal static class CookiesAuth
{
    public static void Ecrire(HttpResponse reponse, string nom, string jeton, TimeSpan duree, bool secure) =>
        reponse.Cookies.Append(nom, jeton, Options(secure, DateTimeOffset.UtcNow.Add(duree)));

    public static void Effacer(HttpResponse reponse, string nom, bool secure) =>
        reponse.Cookies.Delete(nom, Options(secure, null));

    private static CookieOptions Options(bool secure, DateTimeOffset? expiration) => new()
    {
        HttpOnly = true, // illisible par le JavaScript de la page (protège contre le vol de session par XSS)
        Secure = secure, // HTTPS uniquement en production
        SameSite = SameSiteMode.Lax, // pas envoyé par les formulaires d'autres sites (protège contre le CSRF)
        Path = "/",
        Expires = expiration,
        IsEssential = true,
    };
}
