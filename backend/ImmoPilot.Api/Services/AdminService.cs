using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ImmoPilot.Api.Services;

// Réservé au super administrateur : vue sur toute la plateforme
public class AdminService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    IParametresService parametres,
    TimeProvider horloge,
    IMemoryCache cache) : IAdminService
{
    public async Task<StatistiquesPlateformeDto> StatistiquesAsync()
    {
        var p = await parametres.ObtenirAsync();
        var clients = await ClientsAsync(null);
        var maintenant = horloge.GetUtcNow().UtcDateTime;

        // Revenu mensuel récurrent : prix mensuel des formules des clients qui ont payé (actifs ou en délai de grâce)
        var mrr = clients
            .Where(c => c.Statut is StatutClient.Actif or StatutClient.Grace)
            .Sum(c => p.Prix(c.Formule));

        // Montants réellement encaissés chaque mois (paiements d'abonnement réussis, 12 derniers mois)
        var moisCourant = Dates.PremierDuMois(DateOnly.FromDateTime(maintenant));
        var debut = moisCourant.AddMonths(-11).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var encaissements = await db.PaiementsAbonnement.AsNoTracking()
            .Where(x => x.Statut == StatutPaiementAbonnement.Reussi && x.DateConfirmation >= debut)
            .GroupBy(x => new { x.DateConfirmation!.Value.Year, x.DateConfirmation!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(x => x.Montant) })
            .ToListAsync();
        var historique = Enumerable.Range(0, 12)
            .Select(i => moisCourant.AddMonths(i - 11))
            .Select(m => new MontantMensuelDto(m, encaissements.FirstOrDefault(e => e.Year == m.Year && e.Month == m.Month)?.Total ?? 0))
            .ToList();

        var formules = Enum.GetValues<Formule>().Select(f =>
        {
            var actifs = clients.Count(c => c.Formule == f && c.Statut is StatutClient.Actif or StatutClient.Grace);
            return new FormuleStatDto(f, p.Prix(f), actifs,
                clients.Count(c => c.Formule == f && c.Statut == StatutClient.Essai), actifs * p.Prix(f));
        }).ToList();

        return new StatistiquesPlateformeDto(
            clients.Count,
            clients.Count(c => c.Statut == StatutClient.Actif),
            clients.Count(c => c.Statut == StatutClient.Essai),
            clients.Count(c => c.Statut == StatutClient.Suspendu),
            mrr,
            historique[^1].Montant,
            clients.Count(c => c.Statut is StatutClient.Expire),
            clients.Sum(c => c.Immeubles),
            clients.Sum(c => c.Locataires),
            await db.Tickets.CountAsync(t => t.Priorite == PrioriteTicket.Haute && t.Statut != StatutTicket.Resolu),
            historique,
            formules,
            clients.OrderByDescending(c => c.DateInscription).Take(5).ToList());
    }

    public async Task<IReadOnlyList<ClientDto>> ClientsAsync(string? recherche)
    {
        var maintenant = horloge.GetUtcNow().UtcDateTime;

        var requete = db.Utilisateurs.AsNoTracking().Where(u => u.Role == RoleUtilisateur.Bailleur);
        if (!string.IsNullOrWhiteSpace(recherche))
        {
            var motif = $"%{recherche.Trim()}%";
            requete = requete.Where(u => EF.Functions.ILike(u.NomComplet, motif)
                                         || EF.Functions.ILike(u.Email, motif)
                                         || (u.NomStructure != null && EF.Functions.ILike(u.NomStructure, motif))
                                         || (u.Ville != null && EF.Functions.ILike(u.Ville, motif)));
        }

        var lignes = await requete
            .OrderByDescending(u => u.DateInscription)
            .Select(u => new
            {
                u.Id,
                Nom = u.NomStructure ?? u.NomComplet,
                u.NomComplet,
                u.Email,
                u.Telephone,
                u.Ville,
                u.Formule,
                u.Actif,
                u.DateInscription,
                u.FinAbonnement,
                ADejaPaye = db.PaiementsAbonnement.Any(x => x.UtilisateurId == u.Id && x.Statut == StatutPaiementAbonnement.Reussi),
                Immeubles = u.Immeubles.Count,
                Locataires = db.Locataires.Count(l => l.ProprietaireId == u.Id && l.LogementId != null),
            })
            .ToListAsync();

        return lignes.Select(u => new ClientDto(
            u.Id, u.Nom, u.NomComplet, u.Email, u.Telephone, u.Ville, u.Formule,
            !u.Actif ? StatutClient.Suspendu : Abonnements.Etat(u.Formule, u.FinAbonnement, u.ADejaPaye, maintenant) switch
            {
                EtatAbonnement.Gratuit => StatutClient.Gratuit,
                EtatAbonnement.Essai => StatutClient.Essai,
                EtatAbonnement.Grace => StatutClient.Grace,
                EtatAbonnement.Expire => StatutClient.Expire,
                _ => StatutClient.Actif,
            },
            u.Immeubles, u.Locataires, u.DateInscription, u.FinAbonnement)).ToList();
    }

    public async Task<IReadOnlyList<UtilisateurAdminDto>> UtilisateursAsync(string? recherche)
    {
        var requete = db.Utilisateurs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(recherche))
        {
            var motif = $"%{recherche.Trim()}%";
            requete = requete.Where(u => EF.Functions.ILike(u.NomComplet, motif) || EF.Functions.ILike(u.Email, motif));
        }

        return await requete
            .OrderBy(u => u.Role).ThenBy(u => u.NomComplet)
            .Select(u => new UtilisateurAdminDto(u.Id, u.NomComplet, u.Email, u.NomStructure, u.Role, u.Actif,
                u.DerniereConnexion, u.DateInscription))
            .ToListAsync();
    }

    // Suspendre / réactiver un compte (effet immédiat : le jeton est vérifié à chaque requête)
    public async Task<bool> ChangerActivationAsync(int utilisateurId, bool actif)
    {
        if (utilisateurId == moi.Id && !actif)
            throw new RegleMetierException("Vous ne pouvez pas bloquer votre propre compte.");

        var utilisateur = await db.Utilisateurs.FindAsync(utilisateurId);
        if (utilisateur is null) return false;

        utilisateur.Actif = actif;
        await db.SaveChangesAsync();
        cache.Remove(EtatCompte.Cle(utilisateurId));
        return true;
    }
}
