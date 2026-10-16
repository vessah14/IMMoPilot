using System.ComponentModel.DataAnnotations;
using ImmoPilot.Api.Models;

namespace ImmoPilot.Api.Dtos;

// ---- Page publique de paiement du loyer (lien personnel du locataire, sans compte) ----

// Ce que voit le locataire en ouvrant son lien (jamais l'e-mail ni le téléphone de quelqu'un d'autre)
public record PageLoyerDto(
    string Locataire,
    string? Logement,
    string Bailleur,
    string TelephoneBailleur,
    decimal LoyerMensuel,
    bool Simulation, // aucun argent réel n'est débité
    string? VerseA, // ex : « Agence Kamga Immo · MTN MoMo •••• 34 56 » ; null = le bailleur n'a pas encore de compte de réception
    IReadOnlyList<MoisDuDto> MoisDus,
    IReadOnlyList<PaiementLoyerDto> Derniers);

// Un mois de loyer pas encore entièrement réglé
public record MoisDuDto(DateOnly Mois, decimal Du, decimal Paye, decimal Reste, StatutEcheance Statut);

public record PaiementLoyerDto(
    int Id,
    DateOnly Mois,
    decimal Montant,
    StatutPaiement Statut,
    DateOnly Date,
    string? Operateur,
    string? CodeUssd, // code à composer si la demande n'apparaît pas sur le téléphone
    string? UrlPaiement, // page de paiement SasPay vers laquelle rediriger (renvoyée à la création uniquement)
    string? Reference);

public record PaiementLoyerRequeteDto(
    [Required(ErrorMessage = "Choisissez le mois à payer.")] DateOnly? Mois,
    [Required(ErrorMessage = "Le numéro Mobile Money est obligatoire."), StringLength(30)] string Telephone);
