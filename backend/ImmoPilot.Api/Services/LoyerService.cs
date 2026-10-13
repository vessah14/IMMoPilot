using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

public class LoyerService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    INotificationService notifications,
    TimeProvider horloge) : ILoyerService
{
    public async Task<IReadOnlyList<EcheanceDto>> EcheancierAsync(DateOnly mois)
    {
        var periode = Dates.PremierDuMois(mois);
        var fin = Dates.DernierDuMois(periode);
        var moisCourant = Dates.PremierDuMois(Dates.Aujourdhui(horloge));

        // Locataires qui occupent un logement et dont le bail couvre ce mois
        var baux = await db.Locataires.AsNoTracking()
            .Where(l => l.ProprietaireId == moi.Id && l.LogementId != null
                        && l.DebutBail <= fin && l.FinBail >= periode)
            .OrderBy(l => l.NomComplet)
            .Select(l => new
            {
                l.Id,
                l.NomComplet,
                l.Telephone,
                l.Email,
                l.JetonPaiement,
                Logement = l.Logement!.Reference + " · " + l.Logement.Immeuble.Nom,
                l.Loyer,
                DerniereRelance = l.Relances.Where(r => r.Periode == periode).Max(r => (DateTime?)r.Date),
            })
            .ToListAsync();

        var payes = await Soldes.PayesAsync(db, moi.Id, periode, periode);

        return baux.Select(b =>
        {
            var paye = payes.GetValueOrDefault((b.Id, periode));
            return new EcheanceDto(b.Id, b.NomComplet, b.Logement, b.Loyer, paye,
                Soldes.Statut(b.Loyer, paye, periode, moisCourant), b.DerniereRelance, b.Telephone, b.Email, b.JetonPaiement);
        }).ToList();
    }

    public async Task<EcheanceDto?> RelancerAsync(RelanceRequeteDto requete)
    {
        var periode = Dates.PremierDuMois(requete.Mois!.Value);
        var locataire = await db.Locataires
            .FirstOrDefaultAsync(l => l.Id == requete.LocataireId && l.ProprietaireId == moi.Id);
        if (locataire is null) return null;

        var echeance = (await EcheancierAsync(periode)).FirstOrDefault(e => e.LocataireId == locataire.Id)
                       ?? throw new RegleMetierException("Ce locataire n'a pas de loyer à payer pour ce mois.");
        if (echeance.Statut == StatutEcheance.Paye)
            throw new RegleMetierException("Ce loyer est déjà payé.");

        // Le message part depuis la messagerie ou le WhatsApp du propriétaire : on garde seulement la trace de la relance
        var canal = requete.Canal switch
        {
            CanalRelance.Email => " par e-mail",
            CanalRelance.WhatsApp => " par WhatsApp",
            _ => "",
        };
        db.Relances.Add(new Relance { LocataireId = locataire.Id, Periode = periode, Date = horloge.GetUtcNow().UtcDateTime });
        notifications.Ajouter(moi.Id, TypeNotification.Retard, $"Relance envoyée{canal} — {locataire.NomComplet}",
            $"Relance pour le loyer de {Dates.NomMois(periode)} : reste {Dates.Fcfa(echeance.Du - echeance.Paye)} à payer.");
        await db.SaveChangesAsync();

        return (await EcheancierAsync(periode)).First(e => e.LocataireId == locataire.Id);
    }
}
