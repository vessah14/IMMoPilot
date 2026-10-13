namespace ImmoPilot.Api.Models;

// Compte qui se connecte : un bailleur (propriétaire, agence, SCI) ou un super administrateur
public class Utilisateur
{
    public int Id { get; set; }
    public required string NomComplet { get; set; }
    public required string Email { get; set; } // toujours enregistré en minuscules
    public required string Telephone { get; set; }
    public string MotDePasseHash { get; set; } = "";
    public RoleUtilisateur Role { get; set; } = RoleUtilisateur.Bailleur;
    public bool Actif { get; set; } = true; // false = compte suspendu / bloqué

    // Activité de gestion (bailleurs)
    public ProfilGestion? Profil { get; set; }
    public string? NomStructure { get; set; } // nom de l'agence ou de la société
    public string? Ville { get; set; }
    public string? Adresse { get; set; }
    public Formule Formule { get; set; } = Formule.Starter;
    public int JourEcheance { get; set; } = 5; // jour du mois où le loyer doit être payé

    // Numéro Mobile Money (2376XXXXXXXX) sur lequel le bailleur reçoit les loyers payés en ligne par ses locataires
    public string? CompteEncaissement { get; set; }

    // Abonnement : null = formule gratuite (Starter), sinon date jusqu'à laquelle la formule payante est active
    // (fin de l'essai gratuit, puis prolongée à chaque paiement)
    public DateTime? FinAbonnement { get; set; }
    public DateTime? DernierRappelAbonnement { get; set; } // évite d'envoyer deux fois le même rappel

    // Mot de passe oublié : empreinte (SHA-256) du lien envoyé par e-mail, valable 1 heure, utilisable une fois
    public string? JetonReinitialisationHash { get; set; }
    public DateTime? ExpirationReinitialisation { get; set; }
    // Les sessions ouvertes avant cette date sont refusées (après un changement de mot de passe)
    public DateTime? MotDePasseModifieLe { get; set; }

    public DateTime DateInscription { get; set; }
    public DateTime? DerniereConnexion { get; set; }

    public ICollection<Immeuble> Immeubles { get; set; } = [];
}
