using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

// ---- Notifications ----

public record NotificationDto(int Id, TypeNotification Type, string Titre, string Message, DateTime Date, bool Lue);

// ---- Loyers ----

// Loyer d'un locataire pour un mois donné
public record EcheanceDto(
    int LocataireId,
    string Locataire,
    string Logement,
    decimal Du,
    decimal Paye,
    StatutEcheance Statut,
    DateTime? DerniereRelance,
    // Coordonnées du locataire : la relance part depuis la messagerie ou le WhatsApp du propriétaire
    string Telephone,
    string Email);

public record RelanceRequeteDto(
    [Range(1, int.MaxValue, ErrorMessage = "Le locataire est obligatoire.")] int LocataireId,
    [Required(ErrorMessage = "Le mois est obligatoire.")] DateOnly? Mois,
    CanalRelance? Canal);

// ---- Tableau de bord ----

public record MontantMensuelDto(DateOnly Mois, decimal Montant);

public record LoyerImpayeDto(int LocataireId, string Locataire, string Logement, DateOnly Mois, decimal Montant);

public record LoyerEnRetardDto(int LocataireId, string Locataire, string Logement, DateOnly Echeance, int JoursRetard, decimal Montant);

public record TableauDeBordDto(
    int Immeubles,
    int Logements,
    int LogementsOccupes,
    decimal EncaisseCeMois,
    IReadOnlyList<MontantMensuelDto> Revenus12Mois,
    IReadOnlyList<LoyerImpayeDto> Impayes,
    IReadOnlyList<LoyerEnRetardDto> Retards);

// ---- Rapports ----

public record RevenuImmeubleDto(int ImmeubleId, string Immeuble, int Logements, decimal Montant);

public record RevenuMoyenDto(MoyenPaiement Moyen, decimal Montant);

public record RapportDto(
    DateOnly Debut,
    DateOnly Fin,
    decimal TotalEncaisse,
    int NombrePaiements,
    decimal TauxOccupation, // en %
    decimal LoyersAttendusParMois,
    IReadOnlyList<MontantMensuelDto> RevenusParMois,
    IReadOnlyList<RevenuImmeubleDto> RevenusParImmeuble,
    IReadOnlyList<RevenuMoyenDto> RevenusParMoyen);

// ---- Support ----

public record TicketRequeteDto(
    [Required(ErrorMessage = "Le sujet est obligatoire."), StringLength(200)] string Sujet,
    [Required(ErrorMessage = "Le message est obligatoire."), StringLength(4000)] string Message,
    PrioriteTicket? Priorite);

// Réponse et/ou changement de statut par le super admin
public record TraitementTicketDto(
    [StringLength(4000)] string? Reponse,
    StatutTicket? Statut);

public record TicketDto(
    int Id,
    string Sujet,
    string Message,
    PrioriteTicket Priorite,
    StatutTicket Statut,
    DateTime DateCreation,
    string? Reponse,
    DateTime? DateReponse,
    int UtilisateurId,
    string Client); // nom de la structure ou du bailleur
