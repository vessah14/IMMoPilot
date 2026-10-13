using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

public class SupportService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    INotificationService notifications,
    TimeProvider horloge) : ISupportService
{
    public async Task<IReadOnlyList<TicketDto>> MesTicketsAsync() =>
        await VersDto(db.Tickets.AsNoTracking().Where(t => t.UtilisateurId == moi.Id)).ToListAsync();

    public async Task<TicketDto> CreerAsync(TicketRequeteDto r)
    {
        var ticket = new Ticket
        {
            Sujet = r.Sujet.Trim(),
            Message = r.Message.Trim(),
            // Le client ne peut pas s'attribuer une priorité urgente.
            Priorite = PrioriteTicket.Moyenne,
            UtilisateurId = moi.Id,
            DateCreation = horloge.GetUtcNow().UtcDateTime,
        };
        db.Tickets.Add(ticket);
        await db.SaveChangesAsync();
        return await VersDto(db.Tickets.Where(t => t.Id == ticket.Id)).FirstAsync();
    }

    public async Task<IReadOnlyList<TicketDto>> TousAsync(StatutTicket? statut)
    {
        var requete = db.Tickets.AsNoTracking();
        if (statut is not null) requete = requete.Where(t => t.Statut == statut);
        return await VersDto(requete).ToListAsync();
    }

    public async Task<TicketDto?> TraiterAsync(int id, TraitementTicketDto r)
    {
        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null) return null;

        if (!string.IsNullOrWhiteSpace(r.Reponse))
        {
            ticket.Reponse = r.Reponse.Trim();
            ticket.DateReponse = horloge.GetUtcNow().UtcDateTime;
            if (ticket.Statut == StatutTicket.Ouvert) ticket.Statut = StatutTicket.EnCours;
            notifications.Ajouter(ticket.UtilisateurId, TypeNotification.Systeme,
                $"Réponse du support — {ticket.Sujet}", ticket.Reponse);
        }
        if (r.Statut is not null) ticket.Statut = r.Statut.Value;

        await db.SaveChangesAsync();
        return await VersDto(db.Tickets.Where(t => t.Id == id)).FirstAsync();
    }

    // Les plus urgents d'abord : non résolus, priorité haute, plus récents
    private static IQueryable<TicketDto> VersDto(IQueryable<Ticket> requete) =>
        requete
            .OrderBy(t => t.Statut == StatutTicket.Resolu)
            .ThenByDescending(t => t.Priorite == PrioriteTicket.Haute)
            .ThenByDescending(t => t.DateCreation)
            .Select(t => new TicketDto(
                t.Id,
                t.Sujet,
                t.Message,
                t.Priorite,
                t.Statut,
                t.DateCreation,
                t.Reponse,
                t.DateReponse,
                t.UtilisateurId,
                t.Utilisateur.NomStructure ?? t.Utilisateur.NomComplet));
}
