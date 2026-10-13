using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Threading.Channels;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Envoi par SMTP (Brevo, Gmail, Outlook, hébergeur…) des e-mails de la plateforme
// Configuration (user secrets) : Email:Hote, Email:Port (587), Email:Utilisateur, Email:MotDePasse,
// Email:Expediteur (adresse d'envoi), Email:NomExpediteur (facultatif), Email:Ssl (true par défaut)
public class EmailService(IConfiguration configuration, ILogger<EmailService> journal, IWebHostEnvironment env) : IEnvoiEmail
{
    private string? Hote => configuration["Email:Hote"];
    private string? Expediteur => configuration["Email:Expediteur"] ?? configuration["Email:Utilisateur"];

    public bool EstConfigure => !string.IsNullOrWhiteSpace(Hote) && !string.IsNullOrWhiteSpace(Expediteur);

    public async Task<bool> EnvoyerAsync(EmailAEnvoyer email, CancellationToken ct = default)
    {
        if (!EstConfigure)
        {
            // En développement, on affiche l'e-mail dans la console pour pouvoir tester sans serveur SMTP
            if (env.IsDevelopment())
                journal.LogWarning("E-mail non envoyé (Email:Hote non configuré) → {Destinataire} : {Sujet}\n{Texte}", email.Destinataire, email.Sujet, email.Texte);
            else
                journal.LogWarning("E-mail non envoyé (Email:Hote non configuré) → {Sujet}", email.Sujet);
            return false;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(Expediteur!, configuration["Email:NomExpediteur"] ?? "IMMO PILOT"),
                Subject = email.Sujet,
                Body = email.Texte,
                IsBodyHtml = false,
            };
            message.To.Add(email.Destinataire);
            if (email.RepondreA is not null) message.ReplyToList.Add(email.RepondreA);
            // Version HTML (mise en page) ; le texte reste pour les messageries qui n'affichent pas le HTML
            if (email.Html is not null)
                message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(email.Html, null, MediaTypeNames.Text.Html));

            using var client = new SmtpClient(Hote, int.TryParse(configuration["Email:Port"], out var port) ? port : 587)
            {
                EnableSsl = configuration["Email:Ssl"] != "false", // false seulement pour un serveur de test local
                Credentials = string.IsNullOrWhiteSpace(configuration["Email:Utilisateur"])
                    ? null
                    : new NetworkCredential(configuration["Email:Utilisateur"], configuration["Email:MotDePasse"]),
            };
            await client.SendMailAsync(message, ct);
            journal.LogInformation("E-mail envoyé : « {Sujet} »", email.Sujet);
            return true;
        }
        catch (Exception e) when (e is SmtpException or InvalidOperationException or FormatException)
        {
            journal.LogError(e, "Échec de l'envoi de l'e-mail « {Sujet} »", email.Sujet);
            return false;
        }
    }
}

// File d'attente en mémoire des e-mails automatiques
public class FileEmails : IFileEmails
{
    private readonly Channel<EmailAEnvoyer> file = Channel.CreateBounded<EmailAEnvoyer>(
        new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.DropOldest });

    public ChannelReader<EmailAEnvoyer> Lecteur => file.Reader;

    public void Ajouter(EmailAEnvoyer email)
    {
        if (!string.IsNullOrWhiteSpace(email.Destinataire)) file.Writer.TryWrite(email);
    }
}

// Tâche de fond : envoie les e-mails de la file, un par un (2 essais)
public class EnvoiEmailsEnFond(FileEmails file, IEnvoiEmail emails) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken arret)
    {
        await foreach (var email in file.Lecteur.ReadAllAsync(arret))
        {
            if (await emails.EnvoyerAsync(email, arret) || !emails.EstConfigure) continue;
            await Task.Delay(TimeSpan.FromSeconds(30), arret); // Brevo momentanément indisponible : nouvel essai
            await emails.EnvoyerAsync(email, arret);
        }
    }
}
