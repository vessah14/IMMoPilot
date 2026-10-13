using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

public record PaiementRequeteDto(
    [Range(1, int.MaxValue, ErrorMessage = "Le locataire est obligatoire.")] int LocataireId,
    [Range(1, 1000000000)] decimal Montant,
    [Required] DateOnly? DatePaiement,
    [Required] DateOnly? Periode, // n'importe quel jour du mois payé : il est ramené au 1er
    [Required] MoyenPaiement? Moyen,
    [StringLength(100)] string? Reference,
    StatutPaiement? Statut);

public record PaiementDto(
    int Id,
    int LocataireId,
    string Locataire,
    string? Logement,
    decimal Montant,
    DateOnly DatePaiement,
    DateOnly Periode,
    MoyenPaiement Moyen,
    string? Reference,
    StatutPaiement Statut);
