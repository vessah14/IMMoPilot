using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Toutes les requêtes sont limitées aux paiements des locataires du bailleur connecté
public class PaiementService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    INotificationService notifications,
    IFileEmails fileEmails,
    ModelesEmail modeles) : IPaiementService
{
    private IQueryable<Paiement> MesPaiements => db.Paiements.Where(p => p.Locataire.ProprietaireId == moi.Id);

    public async Task<IReadOnlyList<PaiementDto>> ListerAsync(int? locataireId, MoyenPaiement? moyen, DateOnly? mois)
    {
        var requete = MesPaiements.AsNoTracking();
        if (locataireId is not null) requete = requete.Where(p => p.LocataireId == locataireId);
        if (moyen is not null) requete = requete.Where(p => p.Moyen == moyen);
        if (mois is not null)
        {
            var periode = Dates.PremierDuMois(mois.Value);
            requete = requete.Where(p => p.Periode == periode);
        }

        return await VersDto(requete.OrderByDescending(p => p.DatePaiement).ThenByDescending(p => p.Id)).ToListAsync();
    }

    public Task<PaiementDto?> ObtenirAsync(int id) =>
        VersDto(MesPaiements.AsNoTracking().Where(p => p.Id == id)).FirstOrDefaultAsync();

    public async Task<PaiementDto> CreerAsync(PaiementRequeteDto requete)
    {
        var nom = await NomLocataireAsync(requete.LocataireId);

        var paiement = new Paiement();
        Appliquer(paiement, requete);
        db.Paiements.Add(paiement);

        if (paiement.Statut == StatutPaiement.Confirme)
            notifications.Ajouter(moi.Id, TypeNotification.Paiement, $"Loyer reçu — {nom}",
                $"{Dates.Fcfa(paiement.Montant)} encaissés pour {Dates.NomMois(paiement.Periode)}.");

        await db.SaveChangesAsync();
        if (paiement.Statut == StatutPaiement.Confirme) await EnvoyerRecuAsync(paiement);
        return (await ObtenirAsync(paiement.Id))!;
    }

    // Reçu par e-mail au locataire (les réponses arrivent chez le bailleur)
    private async Task EnvoyerRecuAsync(Paiement p)
    {
        var l = await db.Locataires.AsNoTracking().Where(x => x.Id == p.LocataireId)
            .Select(x => new
            {
                x.Email,
                x.NomComplet,
                Logement = x.Logement == null ? "votre logement" : x.Logement.Reference + " · " + x.Logement.Immeuble.Nom,
                x.JetonPaiement,
                Bailleur = x.Proprietaire.NomStructure ?? x.Proprietaire.NomComplet,
                EmailBailleur = x.Proprietaire.Email,
            })
            .FirstAsync();
        var moyen = p.Moyen switch
        {
            MoyenPaiement.OrangeMoney => "Orange Money",
            MoyenPaiement.MtnMomo => "MTN MoMo",
            MoyenPaiement.Especes => "Espèces",
            _ => "Virement",
        };
        fileEmails.Ajouter(modeles.RecuLoyer(l.Email, l.NomComplet, l.Logement, p.Montant, p.Periode, p.DatePaiement, moyen,
            p.Reference, l.Bailleur, l.EmailBailleur, l.JetonPaiement));
    }

    public async Task<PaiementDto?> ModifierAsync(int id, PaiementRequeteDto requete)
    {
        var paiement = await MesPaiements.FirstOrDefaultAsync(p => p.Id == id);
        if (paiement is null) return null;

        await NomLocataireAsync(requete.LocataireId);
        Appliquer(paiement, requete);
        await db.SaveChangesAsync();
        return await ObtenirAsync(id);
    }

    public async Task<bool> SupprimerAsync(int id) =>
        await MesPaiements.Where(p => p.Id == id).ExecuteDeleteAsync() > 0;

    // Le locataire doit appartenir au bailleur connecté
    private async Task<string> NomLocataireAsync(int locataireId) =>
        await db.Locataires
            .Where(l => l.Id == locataireId && l.ProprietaireId == moi.Id)
            .Select(l => l.NomComplet)
            .FirstOrDefaultAsync()
        ?? throw new DonneesInvalidesException($"Le locataire {locataireId} n'existe pas.");

    private static void Appliquer(Paiement paiement, PaiementRequeteDto r)
    {
        paiement.LocataireId = r.LocataireId;
        paiement.Montant = r.Montant;
        paiement.DatePaiement = r.DatePaiement!.Value;
        paiement.Periode = Dates.PremierDuMois(r.Periode!.Value);
        paiement.Moyen = r.Moyen!.Value;
        paiement.Reference = string.IsNullOrWhiteSpace(r.Reference) ? null : r.Reference.Trim();
        paiement.Statut = r.Statut ?? StatutPaiement.Confirme;
    }

    private static IQueryable<PaiementDto> VersDto(IQueryable<Paiement> requete) =>
        requete.Select(p => new PaiementDto(
            p.Id,
            p.LocataireId,
            p.Locataire.NomComplet,
            p.Locataire.Logement == null ? null : p.Locataire.Logement.Reference,
            p.Montant,
            p.DatePaiement,
            p.Periode,
            p.Moyen,
            p.Reference,
            p.Statut));
}
