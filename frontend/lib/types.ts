// Types des données renvoyées par l'API ASP.NET (mêmes noms que les DTO du backend)

export type TypeImmeuble = "Residentiel" | "Commercial" | "Mixte";
export type TypeLogement = "Studio" | "T1" | "T2" | "T3" | "T4Plus" | "Commerce";
export type StatutLogement = "Vacant" | "Occupe" | "Travaux";
export type MoyenPaiement = "OrangeMoney" | "MtnMomo" | "Especes" | "Virement";
export type StatutPaiement = "Confirme" | "EnAttente" | "Echoue";
export type SituationPaiement = "AJour" | "Retard" | "Impaye";
export type StatutEcheance = "Paye" | "Partiel" | "EnAttente" | "Impaye";
export type Formule = "Starter" | "Pro" | "Enterprise";

// Fonctions réservées : relances, rapports et exports, support (Pro et Enterprise), plusieurs propriétaires (Enterprise)
export type Fonctionnalite = "Relances" | "Rapports" | "ProprietairesMultiples" | "Support";
export type ProfilGestion = "Proprietaire" | "Agence" | "Sci";
export type TypeNotification = "Paiement" | "Retard" | "Bail" | "Maintenance" | "Systeme";
export type PrioriteTicket = "Basse" | "Moyenne" | "Haute";
export type StatutTicket = "Ouvert" | "EnCours" | "Resolu";
export type EtatAbonnement = "Gratuit" | "Essai" | "Actif" | "Grace" | "Expire";
export type StatutPaiementAbonnement = "EnAttente" | "Reussi" | "Echoue";

export type Utilisateur = {
  id: number;
  nomComplet: string;
  email: string;
  telephone: string;
  role: "Bailleur" | "SuperAdmin";
  profil: ProfilGestion | null;
  nomStructure: string | null;
  ville: string | null;
  adresse: string | null;
  formule: Formule;
  prixFormule: number;
  jourEcheance: number;
  dateInscription: string;
  finAbonnement: string | null; // null : formule gratuite
  etatAbonnement: EtatAbonnement;
  notificationsNonLues: number;
  utilisation: { immeubles: number; limiteImmeubles: number | null; locataires: number; limiteLocataires: number | null };
  compteEncaissement: string | null; // numéro Mobile Money qui reçoit les loyers payés en ligne (2376XXXXXXXX)
  fonctionnalites: Fonctionnalite[]; // fonctions comprises dans la formule (le reste est refusé par l'API)
};

export type Immeuble = {
  id: number;
  nom: string;
  type: TypeImmeuble;
  description: string | null;
  adresse: string;
  ville: string;
  quartier: string;
  nombreEtages: number | null;
  anneeConstruction: number | null;
  dateCreation: string;
  photoUrl: string | null;
  nombreLogements: number;
  logementsOccupes: number;
  beneficiaireNom: string | null; // propriétaire du bien qui reçoit les loyers en ligne
  beneficiaireCompte: string | null;
};

export type Logement = {
  id: number;
  reference: string;
  immeubleId: number;
  immeuble: string;
  type: TypeLogement;
  etage: number;
  surface: number;
  loyer: number;
  charges: number;
  statut: StatutLogement;
  locataire: string | null;
  beneficiaireNom: string | null;
  beneficiaireCompte: string | null;
};

export type Locataire = {
  id: number;
  nomComplet: string;
  email: string;
  telephone: string;
  logementId: number | null;
  logement: string | null;
  debutBail: string;
  finBail: string;
  loyer: number;
  caution: number;
  situation: SituationPaiement;
  jetonPaiement: string | null; // lien personnel de paiement : /payer/{jeton}
  beneficiaireNom: string | null; // qui reçoit ses loyers payés en ligne (logement → immeuble → bailleur)
  beneficiaireCompte: string | null;
};

export type Paiement = {
  id: number;
  locataireId: number;
  locataire: string;
  logement: string | null;
  montant: number;
  datePaiement: string;
  periode: string;
  moyen: MoyenPaiement;
  reference: string | null;
  statut: StatutPaiement;
  reversement: StatutReversement | null; // loyer payé en ligne : reversement au propriétaire
  montantReverse: number | null; // reçu par le propriétaire, frais déduits
  dateReversement: string | null; // dernier essai de reversement, puis date de réception
  erreurReversement: string | null; // raison de l'attente ou de l'échec du reversement
};

export type StatutReversement = "AFaire" | "EnCours" | "Reverse" | "Echoue";

export type Echeance = {
  locataireId: number;
  locataire: string;
  logement: string;
  du: number;
  paye: number;
  statut: StatutEcheance;
  derniereRelance: string | null;
  telephone: string;
  email: string;
  jetonPaiement: string | null;
};

export type MontantMensuel = { mois: string; montant: number };

export type TableauDeBord = {
  immeubles: number;
  logements: number;
  logementsOccupes: number;
  encaisseCeMois: number;
  revenus12Mois: MontantMensuel[];
  impayes: { locataireId: number; locataire: string; logement: string; mois: string; montant: number }[];
  retards: { locataireId: number; locataire: string; logement: string; echeance: string; joursRetard: number; montant: number }[];
};

export type Rapport = {
  debut: string;
  fin: string;
  totalEncaisse: number;
  nombrePaiements: number;
  tauxOccupation: number;
  loyersAttendusParMois: number;
  revenusParMois: MontantMensuel[];
  revenusParImmeuble: { immeubleId: number; immeuble: string; logements: number; montant: number }[];
  revenusParMoyen: { moyen: MoyenPaiement; montant: number }[];
};

export type Notification = {
  id: number;
  type: TypeNotification;
  titre: string;
  message: string;
  date: string;
  lue: boolean;
};

export type Ticket = {
  id: number;
  sujet: string;
  message: string;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  dateCreation: string;
  reponse: string | null;
  dateReponse: string | null;
  utilisateurId: number;
  client: string;
};

export type Offre = {
  inscriptionsOuvertes: boolean;
  dureeEssaiJours: number;
  formules: { formule: Formule; prix: number; limiteImmeubles: number | null; limiteLocataires: number | null }[];
};

export type PaiementAbonnement = {
  id: number;
  formule: Formule;
  dureeMois: number;
  montant: number;
  telephone: string;
  statut: StatutPaiementAbonnement;
  operateur: string | null;
  codeUssd: string | null;
  urlPaiement: string | null; // page de paiement SasPay vers laquelle rediriger (à la création uniquement)
  numeroFacture: string | null;
  manuel: boolean;
  dateCreation: string;
  dateConfirmation: string | null;
};

export type Abonnement = {
  formule: Formule;
  etat: EtatAbonnement;
  finAbonnement: string | null;
  joursRestants: number | null;
  paiementEnLigneDisponible: boolean;
  modeSimulation: boolean; // simulateur de paiement (développement) : aucun argent réel
  offres: { formule: Formule; prixMensuel: number; tarifs: { dureeMois: number; montant: number; moisOfferts: number }[] }[];
  historique: PaiementAbonnement[];
};

// ---- Page publique de paiement du loyer (/payer/{jeton}) ----

export type MoisDu = { mois: string; du: number; paye: number; reste: number; statut: StatutEcheance };

export type PaiementLoyer = {
  id: number;
  mois: string;
  montant: number;
  statut: StatutPaiement;
  date: string;
  operateur: string | null;
  codeUssd: string | null;
  urlPaiement: string | null; // page de paiement SasPay vers laquelle rediriger (à la création uniquement)
  reference: string | null;
};

export type PageLoyer = {
  locataire: string;
  logement: string | null;
  bailleur: string;
  telephoneBailleur: string;
  loyerMensuel: number;
  simulation: boolean;
  verseA: string | null; // compte du bailleur qui reçoit le paiement ; null = paiement en ligne pas encore activé
  moisDus: MoisDu[];
  derniers: PaiementLoyer[];
};
