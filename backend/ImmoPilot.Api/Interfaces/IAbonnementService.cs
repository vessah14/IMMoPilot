using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Interfaces;

public interface IAbonnementService
{
    // ---- Bailleur connecté ----
    Task<AbonnementDto> MonAbonnementAsync();
    Task<PaiementAbonnementDto> PayerAsync(PaiementAbonnementRequeteDto requete);
    Task<PaiementAbonnementDto?> VerifierAsync(int id); // interroge SasPay si le paiement est encore en attente

    // ---- Webhook SasPay : met à jour le paiement d'abonnement ayant cet identifiant SasPay (false si aucun) ----
    Task<bool> ActualiserParReferenceAsync(string reference);

    // ---- Super admin ----
    Task<IReadOnlyList<PaiementAbonnementAdminDto>> TousAsync();
    Task<bool> ProlongerAsync(int utilisateurId, ProlongationDto requete);

    // ---- Tâche de fond : paiements restés en attente, rappels avant échéance ----
    Task TacheDeFondAsync();

    // Le bailleur a-t-il le droit de modifier ses données ? (non si son abonnement est expiré)
    Task<EtatAbonnement> EtatAsync(int utilisateurId);
}
