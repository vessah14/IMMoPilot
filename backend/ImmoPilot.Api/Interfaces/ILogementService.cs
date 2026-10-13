using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Interfaces;

public interface ILogementService
{
    Task<IReadOnlyList<LogementDto>> ListerAsync(int? immeubleId, StatutLogement? statut);
    Task<LogementDto?> ObtenirAsync(int id);
    Task<LogementDto> CreerAsync(LogementRequeteDto requete);
    Task<LogementDto?> ModifierAsync(int id, LogementRequeteDto requete);
    Task<bool> SupprimerAsync(int id);
}
