using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Toutes les requêtes sont limitées aux locataires du bailleur connecté
public class LocataireService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    INotificationService notifications,
    TimeProvider horloge) : ILocataireService
{
    private IQueryable<Locataire> MesLocataires => db.Locataires.Where(l => l.ProprietaireId == moi.Id);

    public async Task<IReadOnlyList<LocataireDto>> ListerAsync(string? recherche)
    {
        var requete = MesLocataires.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(recherche))
        {
            var motif = $"%{recherche.Trim()}%";
            requete = requete.Where(l =>
                EF.Functions.ILike(l.NomComplet, motif) ||
                EF.Functions.ILike(l.Email, motif) ||
                EF.Functions.ILike(l.Telephone, motif));
        }

        return await AvecSituationAsync(requete.OrderBy(l => l.NomComplet));
    }

    public async Task<LocataireDto?> ObtenirAsync(int id) =>
        (await AvecSituationAsync(MesLocataires.AsNoTracking().Where(l => l.Id == id))).FirstOrDefault();

    public async Task<LocataireDto> CreerAsync(LocataireRequeteDto requete)
    {
        VerifierDates(requete);
        await VerifierLimiteAsync(requete.LogementId);

        var locataire = new Locataire
        {
            NomComplet = requete.NomComplet.Trim(),
            Email = requete.Email.Trim(),
            Telephone = requete.Telephone.Trim(),
            ProprietaireId = moi.Id,
        };
        Appliquer(locataire, requete);
        await ChangerLogementAsync(locataire, ancienLogementId: null, nouveauLogementId: requete.LogementId);

        db.Locataires.Add(locataire);
        notifications.Ajouter(moi.Id, TypeNotification.Bail, $"Nouveau locataire — {locataire.NomComplet}",
            $"Bail du {Dates.Jour(locataire.DebutBail)} au {Dates.Jour(locataire.FinBail)}, loyer de {Dates.Fcfa(locataire.Loyer)}.");
        await db.SaveChangesAsync(); // locataire, statut du logement et notification enregistrés ensemble
        return (await ObtenirAsync(locataire.Id))!;
    }

    public async Task<LocataireDto?> ModifierAsync(int id, LocataireRequeteDto requete)
    {
        var locataire = await MesLocataires.FirstOrDefaultAsync(l => l.Id == id);
        if (locataire is null) return null;

        VerifierDates(requete);
        if (locataire.LogementId is null && requete.LogementId is not null)
            await VerifierLimiteAsync(requete.LogementId);

        var ancienLogementId = locataire.LogementId;
        Appliquer(locataire, requete);
        await ChangerLogementAsync(locataire, ancienLogementId, requete.LogementId);

        await db.SaveChangesAsync();
        return await ObtenirAsync(id);
    }

    public async Task<bool> SupprimerAsync(int id)
    {
        var locataire = await MesLocataires.FirstOrDefaultAsync(l => l.Id == id);
        if (locataire is null) return false;

        if (await db.Paiements.AnyAsync(p => p.LocataireId == id))
            throw new RegleMetierException(
                "Ce locataire a des paiements enregistrés : pour garder l'historique, libérez plutôt son logement.");

        await ChangerLogementAsync(locataire, locataire.LogementId, nouveauLogementId: null);
        db.Locataires.Remove(locataire);
        await db.SaveChangesAsync();
        return true;
    }

    private static void VerifierDates(LocataireRequeteDto r)
    {
        if (r.FinBail <= r.DebutBail)
            throw new DonneesInvalidesException("La fin du bail doit être après son début.");
    }

    // La formule limite le nombre de locataires qui occupent un logement
    private async Task VerifierLimiteAsync(int? logementId)
    {
        if (logementId is null) return;
        var formule = await db.Utilisateurs.Where(u => u.Id == moi.Id).Select(u => u.Formule).FirstAsync();
        var limite = LimitesFormule.Locataires(formule);
        if (limite is not null && await MesLocataires.CountAsync(l => l.LogementId != null) >= limite)
            throw new RegleMetierException(
                $"Votre formule {formule} permet {limite} locataires au maximum. Passez à une formule supérieure.");
    }

    // Attribue un logement au locataire : l'ancien redevient vacant, le nouveau devient occupé
    private async Task ChangerLogementAsync(Locataire locataire, int? ancienLogementId, int? nouveauLogementId)
    {
        if (ancienLogementId == nouveauLogementId) return;

        if (nouveauLogementId is not null)
        {
            var nouveau = await db.Logements.FirstOrDefaultAsync(l =>
                              l.Id == nouveauLogementId && l.Immeuble.ProprietaireId == moi.Id)
                          ?? throw new DonneesInvalidesException($"Le logement {nouveauLogementId} n'existe pas.");
            if (nouveau.Statut != StatutLogement.Vacant)
                throw new RegleMetierException($"Le logement {nouveau.Reference} n'est pas disponible.");
            nouveau.Statut = StatutLogement.Occupe;
        }

        if (ancienLogementId is not null)
        {
            var ancien = await db.Logements.FindAsync(ancienLogementId.Value);
            if (ancien is not null) ancien.Statut = StatutLogement.Vacant;
        }

        locataire.LogementId = nouveauLogementId;
    }

    private static void Appliquer(Locataire locataire, LocataireRequeteDto r)
    {
        locataire.NomComplet = r.NomComplet.Trim();
        locataire.Email = r.Email.Trim();
        locataire.Telephone = r.Telephone.Trim();
        locataire.DebutBail = r.DebutBail!.Value;
        locataire.FinBail = r.FinBail!.Value;
        locataire.Loyer = r.Loyer;
        locataire.Caution = r.Caution;
    }

    // Charge les locataires puis calcule leur situation de paiement (à jour, en retard, impayé)
    private async Task<IReadOnlyList<LocataireDto>> AvecSituationAsync(IQueryable<Locataire> requete)
    {
        var lignes = await requete.Select(l => new
        {
            l.Id,
            l.NomComplet,
            l.Email,
            l.Telephone,
            l.LogementId,
            Logement = l.Logement == null ? null : l.Logement.Reference + " — " + l.Logement.Immeuble.Nom,
            l.DebutBail,
            l.FinBail,
            l.Loyer,
            l.Caution,
        }).ToListAsync();

        var aujourdhui = Dates.Aujourdhui(horloge);
        var moisCourant = Dates.PremierDuMois(aujourdhui);
        var moisPrecedent = moisCourant.AddMonths(-1);
        var jourEcheance = await db.Utilisateurs.Where(u => u.Id == moi.Id).Select(u => u.JourEcheance).FirstAsync();
        var payes = await Soldes.PayesAsync(db, moi.Id, moisPrecedent, moisCourant);

        SituationPaiement Situation(int id, DateOnly debut, DateOnly fin, decimal loyer, int? logementId)
        {
            if (logementId is null || loyer <= 0) return SituationPaiement.AJour;
            if (Soldes.BailCouvre(debut, fin, moisPrecedent) && payes.GetValueOrDefault((id, moisPrecedent)) < loyer)
                return SituationPaiement.Impaye;
            if (Soldes.BailCouvre(debut, fin, moisCourant)
                && aujourdhui > Dates.Echeance(moisCourant, jourEcheance)
                && payes.GetValueOrDefault((id, moisCourant)) < loyer)
                return SituationPaiement.Retard;
            return SituationPaiement.AJour;
        }

        return lignes.Select(l => new LocataireDto(
            l.Id, l.NomComplet, l.Email, l.Telephone, l.LogementId, l.Logement,
            l.DebutBail, l.FinBail, l.Loyer, l.Caution,
            Situation(l.Id, l.DebutBail, l.FinBail, l.Loyer, l.LogementId))).ToList();
    }
}
