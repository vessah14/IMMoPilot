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

        // En développement, la base est mise à jour automatiquement (en production : dotnet ef database update)
        if (app.Environment.IsDevelopment())
            await db.Database.MigrateAsync();

        var parametres = await db.Parametres.FirstOrDefaultAsync();
        if (parametres is null)
        {
            parametres = new ParametresPlateforme();
            db.Parametres.Add(parametres);
        }

        await db.SaveChangesAsync();

        // Premier compte super administrateur, créé à partir de la configuration (user secrets / variables d'environnement)
        var email = app.Configuration["SuperAdmin:Email"];
        var motDePasse = app.Configuration["SuperAdmin:MotDePasse"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(motDePasse)) return;
        if (await db.Utilisateurs.AnyAsync(u => u.Role == RoleUtilisateur.SuperAdmin)) return;

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
