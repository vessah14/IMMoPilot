using System.Net;
using System.Net.Mail;
using System.Net.Http.Json;
using System.Net.Mime;
using System.Threading.Channels;
using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Envoi des e-mails de la plateforme, de deux façons :
// 1. API web de Brevo (HTTPS, port 443) si Email:BrevoApiKey est renseignée : à utiliser chez les hébergeurs
//    qui bloquent les ports SMTP (Render gratuit, Railway…) ;
// 2. sinon SMTP (Brevo, Gmail, Outlook…) : Email:Hote, Email:Port (587), Email:Utilisateur, Email:MotDePasse, Email:Ssl.
// Dans les deux cas : Email:Expediteur (adresse validée chez Brevo) et Email:NomExpediteur (facultatif).
public class EmailService(IConfiguration configuration, ILogger<EmailService> journal, IWebHostEnvironment env, IHttpClientFactory clients) : IEnvoiEmail
{
    // Un envoi qui ne répond pas (port bloqué) est abandonné au bout de 20 secondes au lieu de bloquer la file
    private static readonly TimeSpan DelaiMax = TimeSpan.FromSeconds(20);

    private string? Hote => configuration["Email:Hote"];
    private string? CleApiBrevo => configuration["Email:BrevoApiKey"];
    private string? Expediteur => configuration["Email:Expediteur"] ?? configuration["Email:Utilisateur"];
    private string NomExpediteur => configuration["Email:NomExpediteur"] ?? "IMMO PILOT";

    public bool ParApiBrevo => !string.IsNullOrWhiteSpace(CleApiBrevo);

    public bool EstConfigure => !string.IsNullOrWhiteSpace(Expediteur) && (ParApiBrevo || !string.IsNullOrWhiteSpace(Hote));

    public async Task<bool> EnvoyerAsync(EmailAEnvoyer email, CancellationToken ct = default)
    {
        if (!EstConfigure)
        {
            // En développement, on affiche l'e-mail dans la console pour pouvoir tester sans serveur d'envoi
            if (env.IsDevelopment())
                journal.LogWarning("E-mail non envoyé (envoi non configuré) → {Destinataire} : {Sujet}\n{Texte}", email.Destinataire, email.Sujet, email.Texte);
            else
                journal.LogWarning("E-mail non envoyé (envoi non configuré) → {Sujet}", email.Sujet);
            return false;
        }

        using var delai = CancellationTokenSource.CreateLinkedTokenSource(ct);
        delai.CancelAfter(DelaiMax);
        try
        {
            if (ParApiBrevo) await EnvoyerParApiBrevoAsync(email, delai.Token);
            else await EnvoyerParSmtpAsync(email, delai.Token);
            journal.LogInformation("E-mail envoyé ({Moyen}) : « {Sujet} »", ParApiBrevo ? "API Brevo" : "SMTP", email.Sujet);
            return true;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            journal.LogError("Échec de l'envoi de l'e-mail « {Sujet} » : aucune réponse en {Secondes} s ({Moyen}). {Conseil}",
                email.Sujet, DelaiMax.TotalSeconds, ParApiBrevo ? "API Brevo" : $"SMTP {Hote}",
                ParApiBrevo ? "" : "L'hébergeur bloque probablement les ports SMTP : renseignez Email__BrevoApiKey pour passer par l'API de Brevo.");
            return false;
        }
        catch (Exception e) when (e is SmtpException or InvalidOperationException or FormatException or HttpRequestException)
        {
            journal.LogError(e, "Échec de l'envoi de l'e-mail « {Sujet} » ({Moyen}). {Conseil}", email.Sujet, ParApiBrevo ? "API Brevo" : "SMTP",
                ParApiBrevo ? "" : "Si l'hébergeur bloque les ports SMTP, renseignez Email__BrevoApiKey pour passer par l'API de Brevo.");
            return false;
        }
    }

    // https://developers.brevo.com/reference/sendtransacemail
    private async Task EnvoyerParApiBrevoAsync(EmailAEnvoyer email, CancellationToken ct)
    {
        using var requete = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = JsonContent.Create(new
            {
                sender = new { name = NomExpediteur, email = Expediteur },
                to = new[] { new { email = email.Destinataire } },
                replyTo = email.RepondreA is null ? null : new { email = email.RepondreA },
                subject = email.Sujet,
                textContent = email.Texte,
                htmlContent = email.Html,
            }, options: new System.Text.Json.JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull }),
        };
        requete.Headers.Add("api-key", CleApiBrevo);
        requete.Headers.Accept.ParseAdd("application/json");

        using var reponse = await clients.CreateClient("brevo").SendAsync(requete, ct);
        if (!reponse.IsSuccessStatusCode)
        {
            // Message de Brevo (ex : « unauthorized IP », « sender not valid ») : utile et sans secret
            var detail = await reponse.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"Brevo a répondu {(int)reponse.StatusCode} : {detail[..Math.Min(detail.Length, 300)]}");
        }
    }

    private async Task EnvoyerParSmtpAsync(EmailAEnvoyer email, CancellationToken ct)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(Expediteur!, NomExpediteur),
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
            Timeout = (int)DelaiMax.TotalMilliseconds,
            Credentials = string.IsNullOrWhiteSpace(configuration["Email:Utilisateur"])
                ? null
                : new NetworkCredential(configuration["Email:Utilisateur"], configuration["Email:MotDePasse"]),
        };
        await client.SendMailAsync(message, ct);
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
