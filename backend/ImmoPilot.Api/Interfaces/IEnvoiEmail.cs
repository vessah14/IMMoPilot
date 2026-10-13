namespace ImmoPilot.Api.Interfaces;

// E-mails envoyés par la plateforme (mot de passe oublié).
// Les relances des locataires partent de la messagerie du propriétaire, pas d'ici.
public interface IEnvoiEmail
{
    bool EstConfigure { get; }

    // Renvoie false si l'e-mail n'a pas pu partir (serveur non configuré ou en panne) : l'appelant décide quoi faire
    Task<bool> EnvoyerAsync(string destinataire, string sujet, string texte, CancellationToken ct = default);
}
