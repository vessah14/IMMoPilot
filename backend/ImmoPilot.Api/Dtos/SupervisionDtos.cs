using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;

namespace ImmoPilot.Api.Dtos;

// Page Supervision du super admin : état de l'API en temps réel
public record SupervisionDto(
    DateTime Maintenant,
    ApiEtatDto Api,
    BaseEtatDto Base,
    PaiementsEtatDto Paiements,
    EmailsEtatDto Emails,
    IReadOnlyList<TacheEtatDto> Taches,
    CompteursSupervisionDto Compteurs,
    IReadOnlyList<ReversementSupervisionDto> Reversements,
    IReadOnlyList<EntreeJournal> Journal);

public record ApiEtatDto(DateTime DemarreLe, string? Version, string Environnement, string? IpSortante, int MemoireMo);

public record BaseEtatDto(bool Ok, int? LatenceMs, string? Erreur);

public record PaiementsEtatDto(string Mode, bool Simulation, bool WebhookConfigure);

public record EmailsEtatDto(bool Configures, string Mode, int EnFile);

public record TacheEtatDto(string Nom, DateTime? DernierPassage, long? DureeMs, string? Erreur);

public record CompteursSupervisionDto(
    int LoyersEnAttente, // demandes de paiement de loyer pas encore validées
    int AbonnementsEnAttente,
    int ReversementsAFaire,
    int ReversementsEnCours,
    int ReversementsEchoues, // à régulariser
    int ReversesAujourdhui);

// Reversement pas encore reçu par le propriétaire
public record ReversementSupervisionDto(
    int PaiementId,
    string Locataire,
    string Bailleur,
    DateOnly Periode,
    decimal Montant, // payé par le locataire
    decimal? MontantNet, // à reverser (frais d'encaissement déduits)
    string Compte, // numéro de réception masqué
    StatutReversement Statut,
    string? Erreur,
    DateTime? DernierEssai,
    int Echecs);
