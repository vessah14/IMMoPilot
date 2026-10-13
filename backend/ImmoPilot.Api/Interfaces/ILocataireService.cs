using ImmoPilot.Api.Dtos;

namespace ImmoPilot.Api.Interfaces;

public interface ILocataireService
{
    Task<IReadOnlyList<LocataireDto>> ListerAsync(string? recherche);
    Task<LocataireDto?> ObtenirAsync(int id);
    Task<LocataireDto> CreerAsync(LocataireRequeteDto requete);
    Task<LocataireDto?> ModifierAsync(int id, LocataireRequeteDto requete);
    Task<bool> SupprimerAsync(int id);
}
