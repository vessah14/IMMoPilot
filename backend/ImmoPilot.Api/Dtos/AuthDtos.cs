using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

public record InscriptionDto(
    [Required(ErrorMessage = "Le nom est obligatoire."), StringLength(150)] string NomComplet,
    [Required(ErrorMessage = "L'e-mail est obligatoire."), EmailAddress(ErrorMessage = "L'e-mail n'est pas valide."), StringLength(200)] string Email,
    [Required(ErrorMessage = "Le téléphone est obligatoire."), StringLength(30)] string Telephone,
    [Required(ErrorMessage = "Le mot de passe est obligatoire."), StringLength(128, MinimumLength = 8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères.")] string MotDePasse,
    [Required(ErrorMessage = "Le profil est obligatoire.")] ProfilGestion? Profil,
    [StringLength(150)] string? NomStructure,
    [Required(ErrorMessage = "La ville est obligatoire."), StringLength(100)] string Ville,
    [Required(ErrorMessage = "La formule est obligatoire.")] Formule? Formule,
    // Numéro Orange Money / MTN MoMo qui reçoit les loyers payés en ligne
    [Required(ErrorMessage = "Le numéro Mobile Money de réception des loyers est obligatoire."), StringLength(30)] string CompteEncaissement);

public record ConnexionDto(
    [Required(ErrorMessage = "L'e-mail est obligatoire."), EmailAddress(ErrorMessage = "L'e-mail n'est pas valide.")] string Email,
    [Required(ErrorMessage = "Le mot de passe est obligatoire.")] string MotDePasse);

public record ProfilDto(
    [Required(ErrorMessage = "Le nom est obligatoire."), StringLength(150)] string NomComplet,
    [Required(ErrorMessage = "Le téléphone est obligatoire."), StringLength(30)] string Telephone,
    [StringLength(150)] string? NomStructure,
    [StringLength(100)] string? Ville,
    [StringLength(250)] string? Adresse,
    [Range(1, 28, ErrorMessage = "Le jour d'échéance doit être entre 1 et 28.")] int JourEcheance,
    [StringLength(30)] string? CompteEncaissement = null); // null : inchangé

public record ChangementMotDePasseDto(
    [Required(ErrorMessage = "Le mot de passe actuel est obligatoire.")] string MotDePasseActuel,
    [Required, StringLength(128, MinimumLength = 8, ErrorMessage = "Le nouveau mot de passe doit contenir au moins 8 caractères.")] string NouveauMotDePasse);

public record MotDePasseOublieDto(
    [Required(ErrorMessage = "L'e-mail est obligatoire."), EmailAddress(ErrorMessage = "L'e-mail n'est pas valide."), StringLength(200)] string Email);

public record ReinitialisationMotDePasseDto(
    [Required(ErrorMessage = "Le lien est incomplet.")] string Jeton,
    [Required, StringLength(128, MinimumLength = 8, ErrorMessage = "Le nouveau mot de passe doit contenir au moins 8 caractères.")] string NouveauMotDePasse);

public record UtilisationDto(int Immeubles, int? LimiteImmeubles, int Locataires, int? LimiteLocataires);

// Informations du compte connecté (jamais le mot de passe)
public record UtilisateurDto(
    int Id,
    string NomComplet,
    string Email,
    string Telephone,
    RoleUtilisateur Role,
    ProfilGestion? Profil,
    string? NomStructure,
    string? Ville,
    string? Adresse,
    Formule Formule,
    decimal PrixFormule,
    int JourEcheance,
    DateTime DateInscription,
    DateTime? FinAbonnement, // null : formule gratuite, sans échéance
    EtatAbonnement EtatAbonnement,
    int NotificationsNonLues,
    UtilisationDto Utilisation,
    string? CompteEncaissement); // numéro Mobile Money de réception des loyers
