using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Interfaces;

public interface IAbonnementService
{
    // ---- Bailleur connecté ----
    Task<AbonnementDto> MonAbonnementAsync();
    Task<PaiementAbonnementDto> PayerAsync(PaiementAbonnementRequeteDto requete);
    Task<PaiementAbonnementDto?> VerifierAsync(int id); // interroge CamPay si le paiement est encore en attente

    // ---- Webhook CamPay ---- (false si la signature est invalide)
    Task<bool> TraiterNotificationAsync(string? reference, string? referenceExterne, string? signature);

    // ---- Super admin ----
    Task<IReadOnlyList<PaiementAbonnementAdminDto>> TousAsync();
    Task<bool> ProlongerAsync(int utilisateurId, ProlongationDto requete);

    // ---- Tâche de fond : paiements restés en attente, rappels avant échéance ----
    Task TacheDeFondAsync();

    // Le bailleur a-t-il le droit de modifier ses données ? (non si son abonnement est expiré)
    Task<EtatAbonnement> EtatAsync(int utilisateurId);
}
