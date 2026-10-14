using System.Net;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Contenu des e-mails automatiques (texte + mise en page HTML aux couleurs d'IMMO PILOT)
public class ModelesEmail(IConfiguration configuration)
{
    // Adresse du site, pour les liens des e-mails (en production : Frontend:Url = https://votre-domaine)
    public string Site => AdressesSites.Site(configuration);

    public string LienPaiement(string jeton) => $"{Site}/payer/{jeton}";

    // ---- Bailleur ----

    public EmailAEnvoyer Bienvenue(string email, string nom, bool essai, int joursEssai) => Creer(email,
        "Bienvenue sur IMMO PILOT",
        $"Bienvenue {nom} !",
        [
            "Votre compte IMMO PILOT est prêt.",
            essai ? $"Vous profitez de {joursEssai} jours d'essai gratuit, sans engagement." : "Votre formule Starter est gratuite, sans limite de durée.",
            "Pour bien démarrer : ajoutez votre premier immeuble, puis ses logements et vos locataires. Chaque locataire recevra automatiquement son lien pour payer son loyer par Orange Money ou MTN MoMo.",
        ],
        ("Accéder à mon espace", $"{Site}/admin"));

    public EmailAEnvoyer LoyerRecuBailleur(string email, string locataire, string logement, decimal montant, DateOnly mois, string compte) => Creer(email,
        $"Loyer reçu — {locataire}",
        "Loyer payé en ligne",
        [
            $"{locataire} ({logement}) vient de payer son loyer {Dates.DuMois(mois)} : {Dates.Fcfa(montant)}.",
            $"Le montant est versé sur le compte {compte}.",
            "Le paiement est déjà enregistré dans IMMO PILOT : rien à faire de votre côté.",
        ],
        ("Voir mes paiements", $"{Site}/admin/paiements"));

    public EmailAEnvoyer AbonnementPaye(string email, string nom, string formule, int mois, decimal montant, DateOnly finAbonnement, string facture) => Creer(email,
        $"Paiement de votre abonnement reçu — facture {facture}",
        "Merci pour votre paiement",
        [
            $"Bonjour {nom}, nous avons bien reçu {Dates.Fcfa(montant)} pour la formule {formule} ({mois} mois).",
            $"Votre abonnement est actif jusqu'au {Dates.Jour(finAbonnement)}.",
            $"Numéro de facture : {facture}.",
        ],
        ("Voir mon abonnement", $"{Site}/admin/parametres?onglet=abonnement"));

    // ---- Locataire (réponses adressées au bailleur) ----

    public EmailAEnvoyer LienLocataire(string email, string locataire, string logement, decimal loyer, string bailleur, string emailBailleur, string jeton) => Creer(email,
        $"Votre lien pour payer votre loyer — {logement}",
        $"Bonjour {locataire},",
        [
            $"{bailleur} vous permet désormais de payer votre loyer en ligne, par Orange Money ou MTN MoMo.",
            $"Logement : {logement} · loyer mensuel : {Dates.Fcfa(loyer)}.",
            "Ce lien est personnel : gardez-le pour vos prochains paiements et ne le partagez pas.",
        ],
        ("Payer mon loyer", LienPaiement(jeton)),
        repondreA: emailBailleur,
        signature: bailleur);

    public EmailAEnvoyer RecuLoyer(string email, string locataire, string logement, decimal montant, DateOnly mois, DateOnly date, string moyen, string? reference, string bailleur, string emailBailleur, string? jeton) => Creer(email,
        $"Reçu de paiement — loyer {Dates.DuMois(mois)}",
        $"Bonjour {locataire},",
        [
            $"Votre paiement de {Dates.Fcfa(montant)} pour le loyer {Dates.DuMois(mois)} ({logement}) a bien été reçu le {Dates.Jour(date)}.",
            $"Moyen de paiement : {moyen}{(reference is null ? "" : $" · référence {reference}")}.",
            "Merci ! Conservez cet e-mail comme justificatif.",
        ],
        jeton is null ? null : ("Voir mes paiements", LienPaiement(jeton)),
        repondreA: emailBailleur,
        signature: bailleur);

    // ---- Mise en page ----

    private static EmailAEnvoyer Creer(string destinataire, string sujet, string titre, string[] paragraphes,
        (string Texte, string Url)? bouton, string? repondreA = null, string signature = "L'équipe IMMO PILOT")
    {
        var texte = string.Join("\n\n", [titre, .. paragraphes, .. bouton is { } b ? new[] { $"{b.Texte} : {b.Url}" } : [], signature]);

        static string E(string s) => WebUtility.HtmlEncode(s);
        var html = $"""
            <!doctype html>
            <html lang="fr"><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
                    <tr><td style="background:#0f2a43;padding:20px 28px;font-size:20px;font-weight:bold;color:#ffffff">IMMO <span style="color:#60a5fa">PILOT</span></td></tr>
                    <tr><td style="padding:28px">
                      <h1 style="margin:0 0 16px;font-size:20px">{E(titre)}</h1>
                      {string.Concat(paragraphes.Select(p => $"<p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151\">{E(p)}</p>"))}
                      {(bouton is { } bt ? $"<p style=\"margin:24px 0\"><a href=\"{E(bt.Url)}\" style=\"display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px\">{E(bt.Texte)}</a></p>" : "")}
                      <p style="margin:24px 0 0;font-size:14px;color:#6b7280">{E(signature)}</p>
                    </td></tr>
                    <tr><td style="padding:16px 28px;background:#f9fafb;font-size:12px;color:#9ca3af">E-mail automatique envoyé par IMMO PILOT, la gestion locative simplifiée.</td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """;
        return new EmailAEnvoyer(destinataire, sujet, texte, html, repondreA);
    }
}
