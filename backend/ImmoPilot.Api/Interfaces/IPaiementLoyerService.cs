using ImmoPilot.Api.Dtos;

namespace ImmoPilot.Api.Interfaces;

// Paiement du loyer par le locataire lui-même, depuis son lien personnel (sans compte)
public interface IPaiementLoyerService
{
    // null si le lien n'existe pas (ou a été remplacé par le bailleur)
    Task<PageLoyerDto?> PageAsync(string jeton);

    // Envoie la demande de paiement Mobile Money pour le reste du mois choisi
    Task<PaiementLoyerDto?> PayerAsync(string jeton, PaiementLoyerRequeteDto requete);

    // Où en est le paiement ? (interroge l'opérateur tant qu'il est en attente)
    Task<PaiementLoyerDto?> VerifierAsync(string jeton, int paiementId);
}
