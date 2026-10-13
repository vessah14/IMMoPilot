namespace ImmoPilot.Api.Interfaces;

// Un e-mail prêt à partir. Html facultatif (le texte sert de version de secours) ; RepondreA : le bailleur, pour un locataire.
public record EmailAEnvoyer(string Destinataire, string Sujet, string Texte, string? Html = null, string? RepondreA = null);

// E-mails envoyés par la plateforme (via Brevo, en SMTP).
// Les relances de loyer, elles, partent de la messagerie du propriétaire.
public interface IEnvoiEmail
{
    bool EstConfigure { get; }

    // Envoi immédiat. Renvoie false si l'e-mail n'a pas pu partir (serveur non configuré ou en panne).
    Task<bool> EnvoyerAsync(EmailAEnvoyer email, CancellationToken ct = default);
}

// File d'attente : les e-mails automatiques partent en arrière-plan, sans ralentir ni bloquer
// l'inscription, l'enregistrement d'un locataire ou un paiement si Brevo est lent ou indisponible.
public interface IFileEmails
{
    void Ajouter(EmailAEnvoyer email);
}
