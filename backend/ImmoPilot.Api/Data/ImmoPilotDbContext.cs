using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Data;

public class ImmoPilotDbContext(DbContextOptions<ImmoPilotDbContext> options) : DbContext(options)
{
    public DbSet<Immeuble> Immeubles => Set<Immeuble>();
    public DbSet<Logement> Logements => Set<Logement>();
    public DbSet<Locataire> Locataires => Set<Locataire>();
    public DbSet<Paiement> Paiements => Set<Paiement>();
    public DbSet<Utilisateur> Utilisateurs => Set<Utilisateur>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Relance> Relances => Set<Relance>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<ParametresPlateforme> Parametres => Set<ParametresPlateforme>();
    public DbSet<PaiementAbonnement> PaiementsAbonnement => Set<PaiementAbonnement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Immeuble>(e =>
        {
            e.Property(i => i.Nom).HasMaxLength(150);
            e.Property(i => i.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Description).HasMaxLength(2000);
            e.Property(i => i.Adresse).HasMaxLength(250);
            e.Property(i => i.Ville).HasMaxLength(100);
            e.Property(i => i.Quartier).HasMaxLength(100);
            e.Property(i => i.PhotoUrl).HasMaxLength(500);
            e.Property(i => i.PhotoId).HasMaxLength(200);
            e.Property(i => i.DateCreation).HasDefaultValueSql("now()");

            e.HasOne(i => i.Proprietaire)
                .WithMany(u => u.Immeubles)
                .HasForeignKey(i => i.ProprietaireId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Logement>(e =>
        {
            e.Property(l => l.Reference).HasMaxLength(30);
            e.Property(l => l.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(l => l.Statut).HasConversion<string>().HasMaxLength(20);
            e.Property(l => l.Surface).HasPrecision(8, 2);
            e.Property(l => l.Loyer).HasPrecision(14, 2);
            e.Property(l => l.Charges).HasPrecision(14, 2);

            // Une même référence ne peut pas exister deux fois dans le même immeuble
            e.HasIndex(l => new { l.ImmeubleId, l.Reference }).IsUnique();

            // On ne supprime pas un immeuble qui a encore des logements (vérifié aussi dans le service)
            e.HasOne(l => l.Immeuble)
                .WithMany(i => i.Logements)
                .HasForeignKey(l => l.ImmeubleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Propriétaire du bien qui reçoit les loyers payés en ligne
        modelBuilder.Entity<Immeuble>(e =>
        {
            e.Property(i => i.BeneficiaireNom).HasMaxLength(150);
            e.Property(i => i.BeneficiaireCompte).HasMaxLength(20);
        });
        modelBuilder.Entity<Logement>(e =>
        {
            e.Property(l => l.BeneficiaireNom).HasMaxLength(150);
            e.Property(l => l.BeneficiaireCompte).HasMaxLength(20);
        });

        modelBuilder.Entity<Locataire>(e =>
        {
            e.Property(l => l.NomComplet).HasMaxLength(150);
            e.Property(l => l.Email).HasMaxLength(200);
            e.Property(l => l.Telephone).HasMaxLength(30);
            e.Property(l => l.JetonPaiement).HasMaxLength(64);
            e.HasIndex(l => l.JetonPaiement).IsUnique();
            e.Property(l => l.Loyer).HasPrecision(14, 2);
            e.Property(l => l.Caution).HasPrecision(14, 2);

            e.HasOne(l => l.Logement)
                .WithMany(lg => lg.Locataires)
                .HasForeignKey(l => l.LogementId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(l => l.Proprietaire)
                .WithMany()
                .HasForeignKey(l => l.ProprietaireId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Paiement>(e =>
        {
            e.Property(p => p.Montant).HasPrecision(14, 2);
            e.Property(p => p.Moyen).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Statut).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Reference).HasMaxLength(100);
            e.HasIndex(p => p.Periode);
            e.HasIndex(p => p.Reference); // webhook SasPay : retrouver le loyer par l'identifiant du paiement
            e.Property(p => p.StatutReversement).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(p => p.StatutReversement);
            e.Property(p => p.MontantNet).HasPrecision(14, 2);
            e.Property(p => p.MontantReverse).HasPrecision(14, 2);
            e.Property(p => p.ReferenceReversement).HasMaxLength(100);
            e.HasIndex(p => p.ReferenceReversement);
            e.Property(p => p.CleReversement).HasMaxLength(100);
            e.Property(p => p.ErreurReversement).HasMaxLength(300);

            // L'historique des paiements est conservé : on ne supprime pas un locataire qui a payé
            e.HasOne(p => p.Locataire)
                .WithMany(l => l.Paiements)
                .HasForeignKey(p => p.LocataireId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Utilisateur>(e =>
        {
            e.Property(u => u.NomComplet).HasMaxLength(150);
            e.Property(u => u.Email).HasMaxLength(200);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.CompteEncaissement).HasMaxLength(20);
            e.Property(u => u.Telephone).HasMaxLength(30);
            e.Property(u => u.MotDePasseHash).HasMaxLength(500);
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.Profil).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.Formule).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.NomStructure).HasMaxLength(150);
            e.Property(u => u.Ville).HasMaxLength(100);
            e.Property(u => u.Adresse).HasMaxLength(250);
            e.Property(u => u.DateInscription).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.Property(n => n.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(n => n.Titre).HasMaxLength(200);
            e.Property(n => n.Message).HasMaxLength(1000);
            e.HasIndex(n => new { n.UtilisateurId, n.Lue });
            e.HasOne(n => n.Utilisateur).WithMany().HasForeignKey(n => n.UtilisateurId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Relance>(e =>
        {
            e.HasIndex(r => new { r.LocataireId, r.Periode });
            e.HasOne(r => r.Locataire).WithMany(l => l.Relances).HasForeignKey(r => r.LocataireId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Ticket>(e =>
        {
            e.Property(t => t.Sujet).HasMaxLength(200);
            e.Property(t => t.Message).HasMaxLength(4000);
            e.Property(t => t.Reponse).HasMaxLength(4000);
            e.Property(t => t.Priorite).HasConversion<string>().HasMaxLength(20);
            e.Property(t => t.Statut).HasConversion<string>().HasMaxLength(20);
            e.HasOne(t => t.Utilisateur).WithMany().HasForeignKey(t => t.UtilisateurId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaiementAbonnement>(e =>
        {
            e.Property(p => p.Formule).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Statut).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Montant).HasPrecision(14, 2);
            e.Property(p => p.Telephone).HasMaxLength(20);
            e.Property(p => p.ReferenceExterne).HasMaxLength(64);
            e.HasIndex(p => p.ReferenceExterne).IsUnique();
            e.Property(p => p.ReferencePaiement).HasMaxLength(100);
            e.HasIndex(p => p.ReferencePaiement);
            e.Property(p => p.Operateur).HasMaxLength(30);
            e.Property(p => p.ReferenceOperateur).HasMaxLength(100);
            e.Property(p => p.NumeroFacture).HasMaxLength(30);
            e.HasIndex(p => p.NumeroFacture).IsUnique();
            e.HasIndex(p => new { p.Statut, p.DateCreation });
            e.HasOne(p => p.Utilisateur).WithMany().HasForeignKey(p => p.UtilisateurId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ParametresPlateforme>(e =>
        {
            e.Property(p => p.NomPlateforme).HasMaxLength(100);
            e.Property(p => p.EmailSupport).HasMaxLength(200);
            e.Property(p => p.TelephoneSupport).HasMaxLength(30);
            e.Property(p => p.PrixStarter).HasPrecision(14, 2);
            e.Property(p => p.PrixPro).HasPrecision(14, 2);
            e.Property(p => p.PrixEnterprise).HasPrecision(14, 2);
            e.Property(p => p.Id).ValueGeneratedNever();
            e.HasData(new ParametresPlateforme()); // la ligne unique est créée par la migration
        });
    }
}
