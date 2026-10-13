using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

public class TableauDeBordService(ImmoPilotDbContext db, IUtilisateurCourant moi, TimeProvider horloge) : ITableauDeBordService
{
    public async Task<TableauDeBordDto> ObtenirAsync()
    {
        var aujourdhui = Dates.Aujourdhui(horloge);
        var moisCourant = Dates.PremierDuMois(aujourdhui);
        var debut12Mois = moisCourant.AddMonths(-11);
        var jourEcheance = await db.Utilisateurs.Where(u => u.Id == moi.Id).Select(u => u.JourEcheance).FirstAsync();

        var immeubles = await db.Immeubles.CountAsync(i => i.ProprietaireId == moi.Id);
        var logements = db.Logements.Where(l => l.Immeuble.ProprietaireId == moi.Id);
        var nbLogements = await logements.CountAsync();
        var occupes = await logements.CountAsync(l => l.Statut == StatutLogement.Occupe);

        // Revenus encaissés par mois (paiements confirmés, rangés par date de paiement)
        var parMois = await db.Paiements.AsNoTracking()
            .Where(p => p.Locataire.ProprietaireId == moi.Id && p.Statut == StatutPaiement.Confirme
                        && p.DatePaiement >= debut12Mois)
            .GroupBy(p => new { p.DatePaiement.Year, p.DatePaiement.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Montant) })
            .ToListAsync();
        var revenus = Enumerable.Range(0, 12)
            .Select(i => debut12Mois.AddMonths(i))
            .Select(m => new MontantMensuelDto(m,
                parMois.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month)?.Total ?? 0))
            .ToList();

        // Impayés (3 derniers mois terminés) et retards (mois en cours, échéance dépassée)
        var locataires = await db.Locataires.AsNoTracking()
            .Where(l => l.ProprietaireId == moi.Id && l.LogementId != null && l.Loyer > 0)
            .Select(l => new
            {
                l.Id,
                l.NomComplet,
                Logement = l.Logement!.Reference + " · " + l.Logement.Immeuble.Nom,
                l.Loyer,
                l.DebutBail,
                l.FinBail,
            })
            .ToListAsync();
        var payes = await Soldes.PayesAsync(db, moi.Id, moisCourant.AddMonths(-3), moisCourant);

        var impayes = new List<LoyerImpayeDto>();
        var retards = new List<LoyerEnRetardDto>();
        var echeance = Dates.Echeance(moisCourant, jourEcheance);
        foreach (var l in locataires)
        {
            for (var m = moisCourant.AddMonths(-3); m < moisCourant; m = m.AddMonths(1))
            {
                var reste = l.Loyer - payes.GetValueOrDefault((l.Id, m));
                if (Soldes.BailCouvre(l.DebutBail, l.FinBail, m) && reste > 0)
                    impayes.Add(new LoyerImpayeDto(l.Id, l.NomComplet, l.Logement, m, reste));
            }

            var resteCourant = l.Loyer - payes.GetValueOrDefault((l.Id, moisCourant));
            if (Soldes.BailCouvre(l.DebutBail, l.FinBail, moisCourant) && aujourdhui > echeance && resteCourant > 0)
                retards.Add(new LoyerEnRetardDto(l.Id, l.NomComplet, l.Logement, echeance,
                    aujourdhui.DayNumber - echeance.DayNumber, resteCourant));
        }

        return new TableauDeBordDto(
            immeubles,
            nbLogements,
            occupes,
            revenus[^1].Montant,
            revenus,
            impayes.OrderBy(i => i.Mois).ThenBy(i => i.Locataire).ToList(),
            retards.OrderByDescending(r => r.JoursRetard).ToList());
    }
}
