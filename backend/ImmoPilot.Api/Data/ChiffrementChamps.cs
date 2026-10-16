using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace ImmoPilot.Api.Data;

// Chiffrement des numéros Mobile Money dans la base (AES-256-GCM : confidentialité + intégrité).
// Une copie volée de la base ne permet pas de lire (ni de modifier en douce) les comptes qui reçoivent l'argent.
//
// Clé : Chiffrement:Cle = 32 octets en base64 (variable Chiffrement__Cle chez l'hébergeur), jamais dans le code.
//   Générer : openssl rand -base64 32
// ⚠ Conservez cette clé précieusement : sans elle, les numéros chiffrés sont illisibles.
//
// Stockage : « enc:v1:<base64(nonce 12 o | texte chiffré | tag 16 o)> ». Un ancien numéro en clair est relu tel quel,
// puis chiffré au démarrage suivant (voir InitialisationBase).
public static class ChiffrementChamps
{
    public const string Prefixe = "enc:v1:";
    private const int TailleNonce = 12;
    private const int TailleTag = 16;

    private static byte[]? cle;

    public static bool Actif => cle is not null;

    // Appelé une fois au démarrage ; sans clé valide, les numéros restent en clair (développement)
    public static void Configurer(string? cleBase64)
    {
        if (string.IsNullOrWhiteSpace(cleBase64)) return;
        var octets = Convert.FromBase64String(cleBase64.Trim());
        if (octets.Length != 32) throw new InvalidOperationException("Chiffrement:Cle doit faire 32 octets (openssl rand -base64 32).");
        cle = octets;
    }

    public static string Chiffrer(string valeur)
    {
        if (cle is null || valeur.StartsWith(Prefixe, StringComparison.Ordinal)) return valeur;

        var clair = Encoding.UTF8.GetBytes(valeur);
        var resultat = new byte[TailleNonce + clair.Length + TailleTag];
        var nonce = resultat.AsSpan(0, TailleNonce);
        RandomNumberGenerator.Fill(nonce); // nonce aléatoire : deux mêmes numéros donnent deux textes différents
        using var aes = new AesGcm(cle, TailleTag);
        aes.Encrypt(nonce, clair, resultat.AsSpan(TailleNonce, clair.Length), resultat.AsSpan(TailleNonce + clair.Length));
        return Prefixe + Convert.ToBase64String(resultat);
    }

    public static string Dechiffrer(string valeur)
    {
        if (!valeur.StartsWith(Prefixe, StringComparison.Ordinal)) return valeur; // ancien numéro encore en clair
        if (cle is null)
            throw new InvalidOperationException("Numéro chiffré en base mais Chiffrement:Cle est absente : renseignez la clé d'origine.");

        var octets = Convert.FromBase64String(valeur[Prefixe.Length..]);
        var taille = octets.Length - TailleNonce - TailleTag;
        var clair = new byte[taille];
        using var aes = new AesGcm(cle, TailleTag);
        // Lève une exception si le texte a été modifié (tag d'authentification invalide)
        aes.Decrypt(octets.AsSpan(0, TailleNonce), octets.AsSpan(TailleNonce, taille), octets.AsSpan(TailleNonce + taille), clair);
        return Encoding.UTF8.GetString(clair);
    }

    // Conversion automatique à l'écriture et à la lecture par EF Core (null reste null)
    public static readonly ValueConverter<string, string> Convertisseur = new(v => Chiffrer(v), v => Dechiffrer(v));

    // Chiffre les numéros encore en clair (bases créées avant le chiffrement, ou clé ajoutée après coup)
    public static async Task ChiffrerAnciensAsync(ImmoPilotDbContext db, ILogger journal)
    {
        if (!Actif) return;

        // Lignes dont le numéro est encore en clair ; marqué « modifié », il repasse par le convertisseur qui le chiffre
        var utilisateurs = await db.Utilisateurs.FromSqlRaw(
            $"SELECT * FROM \"Utilisateurs\" WHERE \"CompteEncaissement\" IS NOT NULL AND \"CompteEncaissement\" NOT LIKE '{Prefixe}%'").ToListAsync();
        var immeubles = await db.Immeubles.FromSqlRaw(
            $"SELECT * FROM \"Immeubles\" WHERE \"BeneficiaireCompte\" IS NOT NULL AND \"BeneficiaireCompte\" NOT LIKE '{Prefixe}%'").ToListAsync();
        var logements = await db.Logements.FromSqlRaw(
            $"SELECT * FROM \"Logements\" WHERE \"BeneficiaireCompte\" IS NOT NULL AND \"BeneficiaireCompte\" NOT LIKE '{Prefixe}%'").ToListAsync();
        var paiements = await db.Paiements.FromSqlRaw(
            $"SELECT * FROM \"Paiements\" WHERE \"CompteVersement\" IS NOT NULL AND \"CompteVersement\" NOT LIKE '{Prefixe}%'").ToListAsync();

        foreach (var u in utilisateurs) db.Entry(u).Property(x => x.CompteEncaissement).IsModified = true;
        foreach (var i in immeubles) db.Entry(i).Property(x => x.BeneficiaireCompte).IsModified = true;
        foreach (var l in logements) db.Entry(l).Property(x => x.BeneficiaireCompte).IsModified = true;
        foreach (var p in paiements) db.Entry(p).Property(x => x.CompteVersement).IsModified = true;
        var total = utilisateurs.Count + immeubles.Count + logements.Count + paiements.Count;
        if (total == 0) return;

        await db.SaveChangesAsync();
        journal.LogWarning("Chiffrement : {Total} numéro(s) Mobile Money chiffré(s) en base", total);
    }
}
