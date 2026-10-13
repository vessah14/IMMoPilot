using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Bilan des 12 derniers mois (paiements confirmés)
public class RapportService(ImmoPilotDbContext db, IUtilisateurCourant moi, TimeProvider horloge) : IRapportService
{
    public async Task<RapportDto> ObtenirAsync()
    {
        var moisCourant = Dates.PremierDuMois(Dates.Aujourdhui(horloge));
        var debut = moisCourant.AddMonths(-11);
        var fin = Dates.DernierDuMois(moisCourant);

        var paiements = db.Paiements.AsNoTracking()
            .Where(p => p.Locataire.ProprietaireId == moi.Id && p.Statut == StatutPaiement.Confirme
                        && p.DatePaiement >= debut && p.DatePaiement <= fin);

        var parMois = await paiements
            .GroupBy(p => new { p.DatePaiement.Year, p.DatePaiement.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Montant) })
            .ToListAsync();
        var revenusParMois = Enumerable.Range(0, 12)
            .Select(i => debut.AddMonths(i))
            .Select(m => new MontantMensuelDto(m,
                parMois.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month)?.Total ?? 0))
            .ToList();

        // Par immeuble : via le logement actuel du locataire (les locataires partis sont comptés à part)
        var parLogement = await paiements
            .GroupBy(p => p.Locataire.Logement == null ? (int?)null : p.Locataire.Logement.ImmeubleId)
            .Select(g => new { ImmeubleId = g.Key, Total = g.Sum(p => p.Montant) })
            .ToListAsync();
        var immeubles = await db.Immeubles.AsNoTracking()
            .Where(i => i.ProprietaireId == moi.Id)
            .Select(i => new { i.Id, i.Nom, Logements = i.Logements.Count })
            .ToListAsync();
        var parImmeuble = immeubles
            .Select(i => new RevenuImmeubleDto(i.Id, i.Nom, i.Logements,
                parLogement.FirstOrDefault(x => x.ImmeubleId == i.Id)?.Total ?? 0))
            .OrderByDescending(i => i.Montant)
            .ToList();
        var anciens = parLogement.FirstOrDefault(x => x.ImmeubleId is null)?.Total ?? 0;
        if (anciens > 0) parImmeuble.Add(new RevenuImmeubleDto(0, "Anciens locataires", 0, anciens));

        var parMoyen = await paiements
            .GroupBy(p => p.Moyen)
            .Select(g => new RevenuMoyenDto(g.Key, g.Sum(p => p.Montant)))
            .ToListAsync();

        var logements = db.Logements.Where(l => l.Immeuble.ProprietaireId == moi.Id);
        var total = await logements.CountAsync();
        var occupes = await logements.CountAsync(l => l.Statut == StatutLogement.Occupe);
        var attendus = await db.Locataires
            .Where(l => l.ProprietaireId == moi.Id && l.LogementId != null)
            .SumAsync(l => (decimal?)l.Loyer) ?? 0;

        return new RapportDto(
            debut,
            fin,
            revenusParMois.Sum(r => r.Montant),
            await paiements.CountAsync(),
            total == 0 ? 0 : Math.Round(occupes * 100m / total, 1),
            attendus,
            revenusParMois,
            parImmeuble,
            parMoyen.OrderByDescending(m => m.Montant).ToList());
    }
}
