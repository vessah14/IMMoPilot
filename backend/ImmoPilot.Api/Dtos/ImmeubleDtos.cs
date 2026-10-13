using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

// Données envoyées pour créer ou modifier un immeuble
public record ImmeubleRequeteDto(
    [Required, StringLength(150)] string Nom,
    [Required] TypeImmeuble? Type,
    [StringLength(2000)] string? Description,
    [Required, StringLength(250)] string Adresse,
    [Required, StringLength(100)] string Ville,
    [Required, StringLength(100)] string Quartier,
    [Range(0, 200)] int? NombreEtages,
    [Range(1900, 2100)] int? AnneeConstruction);

// Données renvoyées par l'API
public record ImmeubleDto(
    int Id,
    string Nom,
    TypeImmeuble Type,
    string? Description,
    string Adresse,
    string Ville,
    string Quartier,
    int? NombreEtages,
    int? AnneeConstruction,
    DateTime DateCreation,
    string? PhotoUrl,
    int NombreLogements,
    int LogementsOccupes);
