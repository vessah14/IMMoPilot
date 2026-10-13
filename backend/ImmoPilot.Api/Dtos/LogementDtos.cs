using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

public record LogementRequeteDto(
    [Range(1, int.MaxValue, ErrorMessage = "L'immeuble est obligatoire.")] int ImmeubleId,
    [Required, StringLength(30)] string Reference,
    [Required] TypeLogement? Type,
    [Range(0, 200)] int Etage,
    [Range(1, 100000)] decimal Surface,
    [Range(0, 1000000000)] decimal Loyer,
    [Range(0, 1000000000)] decimal Charges,
    StatutLogement? Statut);

public record LogementDto(
    int Id,
    string Reference,
    int ImmeubleId,
    string Immeuble,
    TypeLogement Type,
    int Etage,
    decimal Surface,
    decimal Loyer,
    decimal Charges,
    StatutLogement Statut,
    string? Locataire); // nom du locataire actuel, s'il y en a un
