using ImmoPilot.Api.Dtos;

namespace ImmoPilot.Api.Interfaces;

// Supervision en temps réel (super admin) et contrôle de santé public
public interface ISupervisionService
{
    Task<SupervisionDto> EtatAsync();

    Task<BaseEtatDto> BaseAsync();
}
