using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Interfaces;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> ListerAsync();
    Task<bool> MarquerLueAsync(int id);
    Task ToutMarquerLuAsync();
    Task<bool> SupprimerAsync(int id);

    // Prépare une notification (enregistrée au prochain SaveChanges du service appelant)
    void Ajouter(int utilisateurId, TypeNotification type, string titre, string message);
}

public interface ILoyerService
{
    // Échéancier du mois : ce que chaque locataire doit et a payé
    Task<IReadOnlyList<EcheanceDto>> EcheancierAsync(DateOnly mois);
    Task<EcheanceDto?> RelancerAsync(RelanceRequeteDto requete);
}

public interface ITableauDeBordService
{
    Task<TableauDeBordDto> ObtenirAsync();
}

public interface IRapportService
{
    Task<RapportDto> ObtenirAsync(); // 12 derniers mois
}

public interface ISupportService
{
    // Côté bailleur
    Task<IReadOnlyList<TicketDto>> MesTicketsAsync();
    Task<TicketDto> CreerAsync(TicketRequeteDto requete);

    // Côté super admin
    Task<IReadOnlyList<TicketDto>> TousAsync(StatutTicket? statut);
    Task<TicketDto?> TraiterAsync(int id, TraitementTicketDto requete);
}

public interface IAdminService
{
    Task<StatistiquesPlateformeDto> StatistiquesAsync();
    Task<IReadOnlyList<ClientDto>> ClientsAsync(string? recherche);
    Task<IReadOnlyList<UtilisateurAdminDto>> UtilisateursAsync(string? recherche);
    Task<bool> ChangerActivationAsync(int utilisateurId, bool actif);
}

public interface IParametresService
{
    Task<ParametresPlateforme> ObtenirAsync(); // mis en cache quelques secondes
    Task<ParametresPlateformeDto> ObtenirDtoAsync();
    Task<ParametresPlateformeDto> ModifierAsync(ParametresPlateformeDto requete);
    Task<OffrePubliqueDto> OffreAsync();
}
