using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

public enum StatutClient
{
    Gratuit, // formule Starter
    Essai,
    Actif, // abonnement payé en cours
    Grace, // échu depuis moins de quelques jours
    Expire, // échu : compte en lecture seule
    Suspendu, // bloqué par le super admin
}

public record ClientDto(
    int Id,
    string Nom, // structure ou nom du bailleur
    string Contact,
    string Email,
    string Telephone,
    string? Ville,
    Formule Formule,
    StatutClient Statut,
    int Immeubles,
    int Locataires,
    DateTime DateInscription,
    DateTime? FinAbonnement);

public record UtilisateurAdminDto(
    int Id,
    string NomComplet,
    string Email,
    string? Structure,
    RoleUtilisateur Role,
    bool Actif,
    DateTime? DerniereConnexion,
    DateTime DateInscription);

public record ActivationDto(bool Actif);

public record FormuleStatDto(Formule Formule, decimal Prix, int Actifs, int Essais, decimal Revenu);

public record StatistiquesPlateformeDto(
    int Clients,
    int ClientsActifs,
    int Essais,
    int Suspendus,
    decimal RevenuMensuelRecurrent,
    decimal EncaisseCeMois, // abonnements réellement payés ce mois-ci
    int Expires,
    int Immeubles,
    int Locataires,
    int TicketsUrgents,
    IReadOnlyList<MontantMensuelDto> Encaissements12Mois, // abonnements réellement encaissés chaque mois
    IReadOnlyList<FormuleStatDto> Formules,
    IReadOnlyList<ClientDto> DernieresInscriptions);

public record ParametresPlateformeDto(
    [Required, StringLength(100)] string NomPlateforme,
    [Required, EmailAddress, StringLength(200)] string EmailSupport,
    [StringLength(30)] string? TelephoneSupport,
    [Range(0, 90)] int DureeEssaiJours,
    [Range(0, 10000000)] decimal PrixStarter,
    [Range(0, 10000000)] decimal PrixPro,
    [Range(0, 10000000)] decimal PrixEnterprise,
    bool InscriptionsOuvertes,
    bool ModeMaintenance);

// Informations publiques affichées sur la page d'inscription
public record FormulePubliqueDto(Formule Formule, decimal Prix, int? LimiteImmeubles, int? LimiteLocataires);

public record OffrePubliqueDto(bool InscriptionsOuvertes, int DureeEssaiJours, IReadOnlyList<FormulePubliqueDto> Formules);
