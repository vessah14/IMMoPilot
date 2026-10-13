using System.Net;
using System.Net.Mail;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Envoi par SMTP (Gmail, Outlook, Brevo, hébergeur…) des e-mails de la plateforme (mot de passe oublié)
// Configuration (user secrets) : Email:Hote, Email:Port (587), Email:Utilisateur, Email:MotDePasse,
// Email:Expediteur (adresse d'envoi), Email:NomExpediteur (facultatif), Email:Ssl (true par défaut)
public class EmailService(IConfiguration configuration, ILogger<EmailService> journal, IWebHostEnvironment env) : IEnvoiEmail
{
    private string? Hote => configuration["Email:Hote"];
    private string? Expediteur => configuration["Email:Expediteur"] ?? configuration["Email:Utilisateur"];

    public bool EstConfigure => !string.IsNullOrWhiteSpace(Hote) && !string.IsNullOrWhiteSpace(Expediteur);

    public async Task<bool> EnvoyerAsync(string destinataire, string sujet, string texte, CancellationToken ct = default)
    {
        if (!EstConfigure)
        {
            // Ne jamais journaliser le corps : les liens de réinitialisation contiennent un jeton utilisable.
            if (env.IsDevelopment())
                journal.LogWarning("E-mail non envoyé (Email:Hote non configuré) : {Sujet}", sujet);
            else
                journal.LogWarning("E-mail non envoyé (Email:Hote non configuré) → {Sujet}", sujet);
            return false;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(Expediteur!, configuration["Email:NomExpediteur"] ?? "IMMO PILOT"),
                Subject = sujet,
                Body = texte,
                IsBodyHtml = false,
            };
            message.To.Add(destinataire);

            using var client = new SmtpClient(Hote, int.TryParse(configuration["Email:Port"], out var port) ? port : 587)
            {
                EnableSsl = configuration["Email:Ssl"] != "false", // false seulement pour un serveur de test local
                Credentials = string.IsNullOrWhiteSpace(configuration["Email:Utilisateur"])
                    ? null
                    : new NetworkCredential(configuration["Email:Utilisateur"], configuration["Email:MotDePasse"]),
            };
            await client.SendMailAsync(message, ct);
            return true;
        }
        catch (Exception e) when (e is SmtpException or InvalidOperationException or FormatException)
        {
            journal.LogError(e, "Échec de l'envoi de l'e-mail « {Sujet} »", sujet);
            return false;
        }
    }
}
