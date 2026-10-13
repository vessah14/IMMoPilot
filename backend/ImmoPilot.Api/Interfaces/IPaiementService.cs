using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Interfaces;

public interface IPaiementService
{
    // mois : n'importe quel jour du mois voulu (ex : 2026-09-15 → paiements de septembre 2026)
    Task<IReadOnlyList<PaiementDto>> ListerAsync(int? locataireId, MoyenPaiement? moyen, DateOnly? mois);
    Task<PaiementDto?> ObtenirAsync(int id);
    Task<PaiementDto> CreerAsync(PaiementRequeteDto requete);
    Task<PaiementDto?> ModifierAsync(int id, PaiementRequeteDto requete);
    Task<bool> SupprimerAsync(int id);
}
