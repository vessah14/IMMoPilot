using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using System.Net;
using ImmoPilot.Api.Data;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---- Base de données (PostgreSQL) ----
// La chaîne de connexion complète (avec le mot de passe) est dans les "user secrets", pas dans le code (voir README).
var connexion = builder.Configuration.GetConnectionString("ImmoPilot")
    ?? throw new InvalidOperationException("Chaîne de connexion « ImmoPilot » manquante (voir README).");
builder.Services.AddDbContext<ImmoPilotDbContext>(options => options.UseNpgsql(connexion));

// ---- Services : une interface → une implémentation ----
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IPasswordHasher<Utilisateur>, PasswordHasher<Utilisateur>>();
builder.Services.AddSingleton<IJetonService, JetonService>();
builder.Services.AddScoped<IUtilisateurCourant, UtilisateurCourant>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IParametresService, ParametresService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IImmeubleService, ImmeubleService>();
builder.Services.AddScoped<ILogementService, LogementService>();
builder.Services.AddScoped<ILocataireService, LocataireService>();
builder.Services.AddScoped<IPaiementService, PaiementService>();
builder.Services.AddScoped<ILoyerService, LoyerService>();
builder.Services.AddScoped<ITableauDeBordService, TableauDeBordService>();
builder.Services.AddScoped<IRapportService, RapportService>();
builder.Services.AddScoped<ISupportService, SupportService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddHttpClient<IStockagePhotos, CloudinaryService>();
// Paiements : vrai CamPay, ou simulateur (sans argent réel) :
// - en développement si Campay:Simulation = true ;
// - en ligne si Demo:Actif = true (site de démonstration / portfolio : aucun argent réel ne circule).
// Les loyers payés par les locataires passent toujours par le simulateur (compte d'encaissement pas encore choisi).
builder.Services.AddSingleton<SimulateurCampay>();
builder.Services.AddScoped<IPaiementLoyerService, PaiementLoyerService>();
var modeDemo = builder.Configuration.GetValue<bool>("Demo:Actif");
if (modeDemo || (builder.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("Campay:Simulation")))
    builder.Services.AddSingleton<ICampayService>(sp => sp.GetRequiredService<SimulateurCampay>());
else
    builder.Services.AddHttpClient<ICampayService, CampayService>(c => c.Timeout = TimeSpan.FromSeconds(30));
builder.Services.AddScoped<IAbonnementService, AbonnementService>();
builder.Services.AddSingleton<IEnvoiEmail, EmailService>();
// E-mails automatiques (bienvenue, lien locataire, reçus, abonnement) : envoyés en arrière-plan
builder.Services.AddSingleton<ModelesEmail>();
builder.Services.AddSingleton<FileEmails>();
builder.Services.AddSingleton<IFileEmails>(sp => sp.GetRequiredService<FileEmails>());
builder.Services.AddHostedService<EnvoiEmailsEnFond>();
builder.Services.AddHostedService<TacheAbonnements>();

// ---- Authentification JWT ----
// Le jeton est lu dans l'en-tête "Authorization: Bearer …" ou, à défaut, dans le cookie httpOnly de l'espace :
// /api/admin/… → cookie du super admin, le reste → cookie du bailleur.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // garde les noms courts "sub", "role"…
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Emetteur"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JetonService.Cle(builder.Configuration))),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = JetonService.ClaimNom,
            RoleClaimType = JetonService.ClaimRole,
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = contexte =>
            {
                if (string.IsNullOrEmpty(contexte.Request.Headers.Authorization))
                {
                    var cookie = contexte.Request.Path.StartsWithSegments("/api/admin")
                        ? JetonService.CookieSuperAdmin
                        : JetonService.CookieBailleur;
                    contexte.Token = contexte.Request.Cookies[cookie];
                }
                return Task.CompletedTask;
            },
            // Un compte suspendu est refusé immédiatement, même avec un jeton encore valide
            OnTokenValidated = async contexte =>
            {
                var id = int.TryParse(contexte.Principal?.FindFirst(JetonService.ClaimId)?.Value, out var valeur) ? valeur : 0;
                var db = contexte.HttpContext.RequestServices.GetRequiredService<ImmoPilotDbContext>();
                var compte = await db.Utilisateurs.Where(u => u.Id == id)
                    .Select(u => new { u.Actif, u.MotDePasseModifieLe }).FirstOrDefaultAsync();
                if (compte is null || !compte.Actif)
                    contexte.Fail("Compte suspendu ou supprimé.");
                // Session ouverte avant un changement de mot de passe → refusée
                else if (compte.MotDePasseModifieLe > contexte.SecurityToken.ValidFrom.AddSeconds(1))
                    contexte.Fail("Mot de passe modifié depuis la connexion.");
            },
        };
    });
builder.Services.AddAuthorization();

// ---- Limitation des tentatives de connexion : 10 par minute et par adresse IP ----
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("authentification", contexte => RateLimitPartition.GetFixedWindowLimiter(
        contexte.Connection.RemoteIpAddress?.ToString() ?? "inconnue",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
    // Page publique de paiement du loyer : 60 requêtes par minute et par adresse IP (la page interroge le statut toutes les 4 s)
    options.AddPolicy("paiement-public", contexte => RateLimitPartition.GetFixedWindowLimiter(
        contexte.Connection.RemoteIpAddress?.ToString() ?? "inconnue",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1) }));
});

// Déclare les adresses de proxy autorisées à transmettre l'adresse client.
// En production, configure ForwardedHeaders:KnownProxies avec les IP des reverse proxies.
var proxyConnus = builder.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>() ?? [];
var optionsTransferees = new Microsoft.AspNetCore.Builder.ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
        | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto,
};
foreach (var proxy in proxyConnus)
    if (IPAddress.TryParse(proxy, out var adresse)) optionsTransferees.KnownProxies.Add(adresse);
// Hébergeurs (Render, Railway, Azure…) : leurs proxys changent d'adresse IP. Avec
// ForwardedHeaders:FaireConfianceAuxProxys = true, l'API lit le vrai protocole (https) et l'IP du visiteur
// dans X-Forwarded-Proto / X-Forwarded-For. Sans cela : redirection HTTPS en boucle et une seule
// limite de tentatives de connexion partagée par tous les visiteurs.
var faireConfianceAuxProxys = builder.Configuration.GetValue<bool>("ForwardedHeaders:FaireConfianceAuxProxys");
builder.Services.Configure<Microsoft.AspNetCore.Builder.ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = optionsTransferees.ForwardedHeaders;
    foreach (var proxy in optionsTransferees.KnownProxies) options.KnownProxies.Add(proxy);
    if (faireConfianceAuxProxys)
    {
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
        options.ForwardLimit = null; // chaîne complète (site Next → proxy de l'hébergeur → API) : IP d'origine du visiteur
    }
});

// ---- Contrôleurs + JSON : les enums sont envoyés en texte ("Occupe" plutôt que 1) ----
builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// ---- Erreurs : réponses au format ProblemDetails (400, 401, 404, 409…) ----
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GestionnaireExceptions>();

// ---- CORS : autorise les frontends Next.js (site + super admin) avec leurs cookies ----
var originesAutorisees = builder.Configuration.GetSection("Cors:Origines").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(p =>
    p.WithOrigins(originesAutorisees).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// ---- Documentation OpenAPI (en développement : /openapi/v1.json) ----
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages(); // 401 / 404 sans corps → ProblemDetails

if (app.Environment.IsDevelopment())
    app.MapOpenApi();
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// ---- Mode maintenance : seuls le super admin et la page d'offre restent accessibles ----
app.Use(async (contexte, suite) =>
{
    var chemin = contexte.Request.Path;
    if (chemin.StartsWithSegments("/api") && !chemin.StartsWithSegments("/api/admin") && !chemin.StartsWithSegments("/api/offre")
        && !chemin.StartsWithSegments("/api/campay"))
    {
        var parametres = await contexte.RequestServices.GetRequiredService<IParametresService>().ObtenirAsync();
        if (parametres.ModeMaintenance)
        {
            contexte.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await contexte.Response.WriteAsJsonAsync(new
            {
                status = 503,
                title = "Maintenance en cours",
                detail = $"{parametres.NomPlateforme} est en maintenance. Merci de réessayer un peu plus tard.",
            });
            return;
        }
    }
    await suite();
});

// ---- Abonnement expiré : le bailleur peut consulter ses données, mais plus les modifier ----
// (il peut toujours payer son abonnement, gérer son compte, lire ses notifications et contacter le support)
app.Use(async (contexte, suite) =>
{
    var chemin = contexte.Request.Path;
    var modification = !HttpMethods.IsGet(contexte.Request.Method) && !HttpMethods.IsHead(contexte.Request.Method);
    var autorise = chemin.StartsWithSegments("/api/auth") || chemin.StartsWithSegments("/api/abonnement")
                   || chemin.StartsWithSegments("/api/support") || chemin.StartsWithSegments("/api/notifications");

    if (modification && !autorise && contexte.User.IsInRole(nameof(RoleUtilisateur.Bailleur))
        && int.TryParse(contexte.User.FindFirst(JetonService.ClaimId)?.Value, out var id))
    {
        var etat = await contexte.RequestServices.GetRequiredService<IAbonnementService>().EtatAsync(id);
        if (etat == EtatAbonnement.Expire)
        {
            contexte.Response.StatusCode = StatusCodes.Status402PaymentRequired;
            await contexte.Response.WriteAsJsonAsync(new
            {
                status = 402,
                title = "Abonnement expiré",
                detail = "Votre abonnement a expiré : vos données restent consultables. Renouvelez-le dans Paramètres → Abonnement pour continuer à les modifier.",
            });
            return;
        }
    }
    await suite();
});

app.MapControllers();

await InitialisationBase.ExecuterAsync(app);
app.Run();
