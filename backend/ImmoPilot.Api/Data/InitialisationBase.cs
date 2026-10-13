using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Data;

// Exécuté au démarrage de l'API
public static class InitialisationBase
{
    public static async Task ExecuterAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ImmoPilotDbContext>();
        var journal = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Initialisation");

        // Mise à jour automatique de la base : toujours en développement ;
        // en ligne si Base:MigrerAuDemarrage = true (sinon : dotnet ef database update)
        if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Base:MigrerAuDemarrage"))
            await db.Database.MigrateAsync();

        var parametres = await db.Parametres.FirstOrDefaultAsync();
        if (parametres is null)
        {
            parametres = new ParametresPlateforme();
            db.Parametres.Add(parametres);
        }

        // Lien de paiement pour les locataires créés avant cette fonctionnalité
        foreach (var locataire in await db.Locataires.Where(l => l.JetonPaiement == null).ToListAsync())
            locataire.JetonPaiement = PaiementLoyerService.NouveauJeton();

        await db.SaveChangesAsync();

        // Premier compte super administrateur, créé à partir de la configuration (user secrets / variables d'environnement)
        var email = app.Configuration["SuperAdmin:Email"];
        var motDePasse = app.Configuration["SuperAdmin:MotDePasse"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(motDePasse)) return;
        if (await db.Utilisateurs.AnyAsync(u => u.Role == RoleUtilisateur.SuperAdmin)) return;

        // En ligne, on refuse de créer le super administrateur avec un mot de passe faible
        if (!app.Environment.IsDevelopment() && motDePasse.Length < 12)
        {
            journal.LogError("Super administrateur NON créé : SuperAdmin:MotDePasse doit contenir au moins 12 caractères en production.");
            return;
        }

        var admin = new Utilisateur
        {
            NomComplet = app.Configuration["SuperAdmin:Nom"] ?? "Super administrateur",
            Email = AuthService.NormaliserEmail(email),
            Telephone = "",
            Role = RoleUtilisateur.SuperAdmin,
        };
        admin.MotDePasseHash = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Utilisateur>>()
            .HashPassword(admin, motDePasse);
        db.Utilisateurs.Add(admin);
        await db.SaveChangesAsync();
        journal.LogInformation("Compte super administrateur créé : {Email}", admin.Email);
    }
}
