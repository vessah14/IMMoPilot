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

        var parametres = await db.Parametres.OrderBy(x => x.Id).FirstOrDefaultAsync();
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

        // En ligne, on refuse un mot de passe faible pour le super administrateur
        if (!app.Environment.IsDevelopment() && motDePasse.Length < 12)
        {
            journal.LogError("Super administrateur NON créé / NON modifié : SuperAdmin:MotDePasse doit contenir au moins 12 caractères en production.");
            return;
        }

        var hacheur = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Utilisateur>>();
        var existant = await db.Utilisateurs.FirstOrDefaultAsync(u => u.Role == RoleUtilisateur.SuperAdmin);
        if (existant is not null)
        {
            // SuperAdmin:Reinitialiser = true : remplace l'e-mail et le mot de passe du super admin existant par ceux
            // de la configuration (mot de passe perdu, compte créé avec d'autres valeurs). À retirer ensuite.
            if (!app.Configuration.GetValue<bool>("SuperAdmin:Reinitialiser")) return;

            var nouvelEmail = AuthService.NormaliserEmail(email);
            if (await db.Utilisateurs.AnyAsync(u => u.Email == nouvelEmail && u.Id != existant.Id))
            {
                journal.LogError("Super administrateur NON modifié : l'e-mail {Email} est déjà utilisé par un autre compte.", nouvelEmail);
                return;
            }
            existant.Email = nouvelEmail;
            existant.MotDePasseHash = hacheur.HashPassword(existant, motDePasse);
            existant.Actif = true;
            existant.MotDePasseModifieLe = DateTime.UtcNow; // ferme les anciennes sessions
            existant.JetonReinitialisationHash = null;
            await db.SaveChangesAsync();
            journal.LogWarning("Super administrateur mis à jour ({Email}). Retirez maintenant la variable SuperAdmin__Reinitialiser.", existant.Email);
            return;
        }

        var admin = new Utilisateur
        {
            NomComplet = app.Configuration["SuperAdmin:Nom"] ?? "Super administrateur",
            Email = AuthService.NormaliserEmail(email),
            Telephone = "",
            Role = RoleUtilisateur.SuperAdmin,
        };
        admin.MotDePasseHash = hacheur.HashPassword(admin, motDePasse);
        db.Utilisateurs.Add(admin);
        await db.SaveChangesAsync();
        journal.LogInformation("Compte super administrateur créé : {Email}", admin.Email);
    }
}
