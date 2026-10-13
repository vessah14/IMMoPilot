using ImmoPilot.Api.Data;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Calculs partagés sur les loyers payés
public static class Soldes
{
    // Montant confirmé payé par (locataire, mois) pour les locataires d'un bailleur, entre deux mois inclus
    public static async Task<Dictionary<(int LocataireId, DateOnly Periode), decimal>> PayesAsync(
        ImmoPilotDbContext db, int proprietaireId, DateOnly premierMois, DateOnly dernierMois)
    {
        var lignes = await db.Paiements.AsNoTracking()
            .Where(p => p.Locataire.ProprietaireId == proprietaireId
                        && p.Statut == StatutPaiement.Confirme
                        && p.Periode >= premierMois && p.Periode <= dernierMois)
            .GroupBy(p => new { p.LocataireId, p.Periode })
            .Select(g => new { g.Key.LocataireId, g.Key.Periode, Total = g.Sum(p => p.Montant) })
            .ToListAsync();

        return lignes.ToDictionary(l => (l.LocataireId, l.Periode), l => l.Total);
    }

    // Le bail du locataire couvre-t-il ce mois ?
    public static bool BailCouvre(DateOnly debutBail, DateOnly finBail, DateOnly mois) =>
        debutBail <= Dates.DernierDuMois(mois) && finBail >= Dates.PremierDuMois(mois);

    public static StatutEcheance Statut(decimal du, decimal paye, DateOnly mois, DateOnly moisCourant)
    {
        if (paye >= du) return StatutEcheance.Paye;
        if (paye > 0) return StatutEcheance.Partiel;
        return mois < moisCourant ? StatutEcheance.Impaye : StatutEcheance.EnAttente;
    }
}
