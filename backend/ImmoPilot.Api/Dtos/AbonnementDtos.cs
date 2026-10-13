using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

// Demande de paiement d'un abonnement par le bailleur
public record PaiementAbonnementRequeteDto(
    [Required(ErrorMessage = "La formule est obligatoire.")] Formule? Formule,
    [Range(1, 12, ErrorMessage = "Durée invalide.")] int DureeMois,
    [Required(ErrorMessage = "Le numéro de téléphone est obligatoire."), StringLength(30)] string Telephone);

public record PaiementAbonnementDto(
    int Id,
    Formule Formule,
    int DureeMois,
    decimal Montant,
    string Telephone,
    StatutPaiementAbonnement Statut,
    string? Operateur,
    string? CodeUssd, // code à composer si la demande n'apparaît pas (renvoyé à la création uniquement)
    string? NumeroFacture,
    bool Manuel,
    DateTime DateCreation,
    DateTime? DateConfirmation);

public record TarifDto(int DureeMois, decimal Montant, int MoisOfferts);

public record OffreFormuleDto(Formule Formule, decimal PrixMensuel, IReadOnlyList<TarifDto> Tarifs);

// Abonnement du bailleur connecté
public record AbonnementDto(
    Formule Formule,
    EtatAbonnement Etat,
    DateTime? FinAbonnement,
    int? JoursRestants, // négatif si échu
    bool PaiementEnLigneDisponible,
    bool ModeSimulation, // simulateur de paiement : aucun argent réel
    IReadOnlyList<OffreFormuleDto> Offres,
    IReadOnlyList<PaiementAbonnementDto> Historique);

// ---- Super admin ----

public record PaiementAbonnementAdminDto(
    int Id,
    int UtilisateurId,
    string Client,
    Formule Formule,
    int DureeMois,
    decimal Montant,
    StatutPaiementAbonnement Statut,
    string? Operateur,
    string? NumeroFacture,
    bool Manuel,
    DateTime DateCreation,
    DateTime? DateConfirmation);

// Prolongation manuelle (paiement reçu en espèces, geste commercial…)
public record ProlongationDto(
    [Required(ErrorMessage = "La formule est obligatoire.")] Formule? Formule,
    [Range(1, 24, ErrorMessage = "Durée invalide.")] int DureeMois);
