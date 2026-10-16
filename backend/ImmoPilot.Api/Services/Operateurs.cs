namespace ImmoPilot.Api.Services;

// Opérateur mobile money d'un numéro camerounais (format 2376XXXXXXXX)
public static class Operateurs
{
    public const string Mtn = "MTN";
    public const string Orange = "ORANGE";

    // Préfixes : MTN 67x, 650-654, 680-684 ; Orange 69x, 655-659, 685-689
    public static string De(string telephone)
    {
        var p = telephone.Length >= 6 ? telephone.Substring(3, 3) : "";
        return p.StartsWith("67") || p is "650" or "651" or "652" or "653" or "654" or "680" or "681" or "682" or "683" or "684"
            ? Mtn
            : Orange;
    }
}
