using ImmoPilot.Api.Dtos;

namespace ImmoPilot.Api.Interfaces;

public interface IImmeubleService
{
    Task<IReadOnlyList<ImmeubleDto>> ListerAsync(string? ville);
    Task<ImmeubleDto?> ObtenirAsync(int id); // null si l'immeuble n'existe pas
    Task<ImmeubleDto> CreerAsync(ImmeubleRequeteDto requete);
    Task<ImmeubleDto?> ModifierAsync(int id, ImmeubleRequeteDto requete);
    Task<bool> SupprimerAsync(int id); // false si l'immeuble n'existe pas
    Task<ImmeubleDto?> ChangerPhotoAsync(int id, IFormFile photo);
    Task<ImmeubleDto?> SupprimerPhotoAsync(int id);
}
