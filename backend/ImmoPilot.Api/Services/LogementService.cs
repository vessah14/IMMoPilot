using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Toutes les requêtes sont limitées aux logements des immeubles du bailleur connecté
public class LogementService(ImmoPilotDbContext db, IUtilisateurCourant moi) : ILogementService
{
    private IQueryable<Logement> MesLogements => db.Logements.Where(l => l.Immeuble.ProprietaireId == moi.Id);

    public async Task<IReadOnlyList<LogementDto>> ListerAsync(int? immeubleId, StatutLogement? statut)
    {
        var requete = MesLogements.AsNoTracking();
        if (immeubleId is not null) requete = requete.Where(l => l.ImmeubleId == immeubleId);
        if (statut is not null) requete = requete.Where(l => l.Statut == statut);

        return await VersDto(requete.OrderBy(l => l.Immeuble.Nom).ThenBy(l => l.Reference)).ToListAsync();
    }

    public Task<LogementDto?> ObtenirAsync(int id) =>
        VersDto(MesLogements.AsNoTracking().Where(l => l.Id == id)).FirstOrDefaultAsync();

    public async Task<LogementDto> CreerAsync(LogementRequeteDto requete)
    {
        await VerifierAsync(requete, idActuel: null);

        var logement = new Logement { Reference = requete.Reference.Trim() };
        Appliquer(logement, requete);
        db.Logements.Add(logement);
        await db.SaveChangesAsync();
        return (await ObtenirAsync(logement.Id))!;
    }

    public async Task<LogementDto?> ModifierAsync(int id, LogementRequeteDto requete)
    {
        var logement = await MesLogements.FirstOrDefaultAsync(l => l.Id == id);
        if (logement is null) return null;

        await VerifierAsync(requete, idActuel: id);

        // Le statut "Occupé" est géré par l'attribution d'un locataire, pas à la main
        var occupe = await db.Locataires.AnyAsync(l => l.LogementId == id);
        if (occupe && requete.Statut is not null && requete.Statut != StatutLogement.Occupe)
            throw new RegleMetierException("Ce logement a un locataire : libérez-le avant de changer son statut.");
        if (!occupe && requete.Statut == StatutLogement.Occupe)
            throw new RegleMetierException("Attribuez un locataire au logement pour le passer en « Occupé ».");

        Appliquer(logement, requete);
        await db.SaveChangesAsync();
        return await ObtenirAsync(id);
    }

    public async Task<bool> SupprimerAsync(int id)
    {
        var logement = await MesLogements.FirstOrDefaultAsync(l => l.Id == id);
        if (logement is null) return false;

        if (await db.Locataires.AnyAsync(l => l.LogementId == id))
            throw new RegleMetierException("Ce logement est attribué à un locataire : libérez-le d'abord.");

        db.Logements.Remove(logement);
        await db.SaveChangesAsync();
        return true;
    }

    // L'immeuble doit m'appartenir et la référence ne doit pas déjà exister dans cet immeuble
    private async Task VerifierAsync(LogementRequeteDto r, int? idActuel)
    {
        if (!await db.Immeubles.AnyAsync(i => i.Id == r.ImmeubleId && i.ProprietaireId == moi.Id))
            throw new DonneesInvalidesException($"L'immeuble {r.ImmeubleId} n'existe pas.");

        if (idActuel is null && r.Statut == StatutLogement.Occupe)
            throw new RegleMetierException("Un nouveau logement est vacant : attribuez-lui ensuite un locataire.");

        var reference = r.Reference.Trim();
        var doublon = await db.Logements.AnyAsync(l =>
            l.ImmeubleId == r.ImmeubleId && l.Reference == reference && l.Id != idActuel);
        if (doublon)
            throw new RegleMetierException($"La référence « {reference} » existe déjà dans cet immeuble.");
    }

    private static void Appliquer(Logement logement, LogementRequeteDto r)
    {
        logement.ImmeubleId = r.ImmeubleId;
        logement.Reference = r.Reference.Trim();
        logement.Type = r.Type!.Value;
        logement.Etage = r.Etage;
        logement.Surface = r.Surface;
        logement.Loyer = r.Loyer;
        logement.Charges = r.Charges;
        if (r.Statut is not null) logement.Statut = r.Statut.Value;
        logement.BeneficiaireNom = Beneficiaires.NomOuNull(r.BeneficiaireNom);
        logement.BeneficiaireCompte = Beneficiaires.NumeroOuNull(r.BeneficiaireCompte);
    }

    private static IQueryable<LogementDto> VersDto(IQueryable<Logement> requete) =>
        requete.Select(l => new LogementDto(
            l.Id,
            l.Reference,
            l.ImmeubleId,
            l.Immeuble.Nom,
            l.Type,
            l.Etage,
            l.Surface,
            l.Loyer,
            l.Charges,
            l.Statut,
            l.Locataires.Select(lo => lo.NomComplet).FirstOrDefault(),
            l.BeneficiaireNom,
            l.BeneficiaireCompte));
}
