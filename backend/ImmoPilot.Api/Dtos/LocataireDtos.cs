using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

public record LocataireRequeteDto(
    [Required, StringLength(150)] string NomComplet,
    [Required, EmailAddress, StringLength(200)] string Email,
    [Required, StringLength(30)] string Telephone,
    int? LogementId,
    [Required] DateOnly? DebutBail,
    [Required] DateOnly? FinBail,
    [Range(0, 1000000000)] decimal Loyer,
    [Range(0, 1000000000)] decimal Caution);

public record LocataireDto(
    int Id,
    string NomComplet,
    string Email,
    string Telephone,
    int? LogementId,
    string? Logement, // ex : "A-02 — Résidence Les Palmiers"
    DateOnly DebutBail,
    DateOnly FinBail,
    decimal Loyer,
    decimal Caution,
    SituationPaiement Situation);
