namespace ImmoPilot.Api.Models;

// Opération déjà reçue avec une clé Idempotency-Key : sa réponse est rejouée si la même demande revient
// (double clic, nouvel envoi après une coupure réseau…), au lieu de créer un second paiement. Gardée 24 h.
public class RequeteIdempotente
{
    public int Id { get; set; }
    public required string Portee { get; set; } // à qui appartient la clé : « u:12 » (compte), « l:<lien> » (locataire), « ip:… »
    public required string Cle { get; set; } // valeur de l'en-tête Idempotency-Key
    public required string Empreinte { get; set; } // SHA-256 de « méthode chemin corps » : même clé + autre demande = refus
    public bool Terminee { get; set; } // false : première demande encore en cours de traitement
    public int? StatutHttp { get; set; }
    public string? Reponse { get; set; } // corps JSON de la réponse d'origine
    public DateTime DateCreation { get; set; }
}
