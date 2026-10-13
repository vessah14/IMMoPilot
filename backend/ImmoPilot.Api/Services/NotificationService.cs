using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

public class NotificationService(ImmoPilotDbContext db, IUtilisateurCourant moi, TimeProvider horloge) : INotificationService
{
    public async Task<IReadOnlyList<NotificationDto>> ListerAsync() =>
        await db.Notifications.AsNoTracking()
            .Where(n => n.UtilisateurId == moi.Id)
            .OrderByDescending(n => n.Date)
            .Take(200)
            .Select(n => new NotificationDto(n.Id, n.Type, n.Titre, n.Message, n.Date, n.Lue))
            .ToListAsync();

    public async Task<bool> MarquerLueAsync(int id) =>
        await db.Notifications
            .Where(n => n.Id == id && n.UtilisateurId == moi.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Lue, true)) > 0;

    public Task ToutMarquerLuAsync() =>
        db.Notifications
            .Where(n => n.UtilisateurId == moi.Id && !n.Lue)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Lue, true));

    public async Task<bool> SupprimerAsync(int id) =>
        await db.Notifications.Where(n => n.Id == id && n.UtilisateurId == moi.Id).ExecuteDeleteAsync() > 0;

    public void Ajouter(int utilisateurId, TypeNotification type, string titre, string message) =>
        db.Notifications.Add(new Notification
        {
            UtilisateurId = utilisateurId,
            Type = type,
            Titre = titre,
            Message = message,
            Date = horloge.GetUtcNow().UtcDateTime,
        });
}
