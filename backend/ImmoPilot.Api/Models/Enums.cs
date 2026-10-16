namespace ImmoPilot.Api.Models;

// Listes de valeurs possibles. Elles sont enregistrées en texte dans la base
// (ex : "Occupe") et envoyées en texte dans le JSON de l'API.

public enum TypeImmeuble
{
    Residentiel,
    Commercial,
    Mixte,
}

public enum TypeLogement
{
    Studio,
    T1,
    T2,
    T3,
    T4Plus,
    Commerce,
}

public enum StatutLogement
{
    Vacant,
    Occupe,
    Travaux,
}

public enum MoyenPaiement
{
    OrangeMoney,
    MtnMomo,
    Especes,
    Virement,
}

public enum StatutPaiement
{
    Confirme,
    EnAttente,
    Echoue,
}

// Reversement au propriétaire d'un loyer payé en ligne (encaissé d'abord sur le wallet SasPay d'IMMO PILOT)
public enum StatutReversement
{
    AFaire,   // à envoyer (ou à renvoyer après un essai sans suite)
    EnCours,  // envoyé, en attente de la confirmation de l'opérateur
    Reverse,  // le propriétaire a reçu l'argent
    Echoue,   // abandonné après plusieurs échecs : à régler à la main depuis le tableau de bord SasPay
}

public enum RoleUtilisateur
{
    Bailleur,
    SuperAdmin,
}

// Type de gestionnaire choisi à l'inscription
public enum ProfilGestion
{
    Proprietaire,
    Agence,
    Sci,
}

public enum Formule
{
    Starter,
    Pro,
    Enterprise,
}

public enum TypeNotification
{
    Paiement,
    Retard,
    Bail,
    Maintenance,
    Systeme,
}

public enum PrioriteTicket
{
    Basse,
    Moyenne,
    Haute,
}

public enum StatutTicket
{
    Ouvert,
    EnCours,
    Resolu,
}

// Situation d'un locataire vis-à-vis de ses loyers
public enum SituationPaiement
{
    AJour,
    Retard, // loyer du mois en cours non réglé après le jour d'échéance
    Impaye, // loyer du mois précédent toujours pas réglé
}

// État d'un loyer pour un mois donné
public enum StatutEcheance
{
    Paye,
    Partiel,
    EnAttente,
    Impaye,
}

public enum StatutPaiementAbonnement
{
    EnAttente, // demande envoyée au téléphone du client
    Reussi,
    Echoue,
}

// Où en est l'abonnement d'un bailleur (calculé, non enregistré)
public enum EtatAbonnement
{
    Gratuit, // formule Starter : pas d'échéance
    Essai, // période d'essai d'une formule payante
    Actif, // payé
    Grace, // échu depuis moins de quelques jours : tout fonctionne encore
    Expire, // échu : compte en lecture seule jusqu'au paiement
}

// Outil utilisé par le propriétaire pour relancer un locataire (depuis son téléphone ou sa messagerie)
public enum CanalRelance
{
    Email,
    WhatsApp,
}
