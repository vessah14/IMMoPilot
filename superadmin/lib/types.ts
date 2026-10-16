// Types des données renvoyées par l'API ASP.NET (espace /api/admin)

export type Formule = "Starter" | "Pro" | "Enterprise";
export type StatutClient = "Gratuit" | "Essai" | "Actif" | "Grace" | "Expire" | "Suspendu";
export type PrioriteTicket = "Basse" | "Moyenne" | "Haute";
export type StatutTicket = "Ouvert" | "EnCours" | "Resolu";

export type MoiAdmin = { id: number; nomComplet: string; email: string };

export type Client = {
  id: number;
  nom: string;
  contact: string;
  email: string;
  telephone: string;
  ville: string | null;
  formule: Formule;
  statut: StatutClient;
  immeubles: number;
  locataires: number;
  dateInscription: string;
  finAbonnement: string | null;
};

export type UtilisateurAdmin = {
  id: number;
  nomComplet: string;
  email: string;
  structure: string | null;
  role: "Bailleur" | "SuperAdmin";
  actif: boolean;
  derniereConnexion: string | null;
  dateInscription: string;
};

export type Statistiques = {
  clients: number;
  clientsActifs: number;
  essais: number;
  suspendus: number;
  revenuMensuelRecurrent: number;
  encaisseCeMois: number;
  expires: number;
  immeubles: number;
  locataires: number;
  ticketsUrgents: number;
  encaissements12Mois: { mois: string; montant: number }[];
  formules: { formule: Formule; prix: number; actifs: number; essais: number; revenu: number }[];
  dernieresInscriptions: Client[];
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

export type Parametres = {
  nomPlateforme: string;
  emailSupport: string;
  telephoneSupport: string | null;
  dureeEssaiJours: number;
  prixStarter: number;
  prixPro: number;
  prixEnterprise: number;
  inscriptionsOuvertes: boolean;
  modeMaintenance: boolean;
};

export type PaiementAbonnement = {
  id: number;
  utilisateurId: number;
  client: string;
  formule: Formule;
  dureeMois: number;
  montant: number;
  statut: "EnAttente" | "Reussi" | "Echoue";
  operateur: string | null;
  numeroFacture: string | null;
  manuel: boolean;
  dateCreation: string;
  dateConfirmation: string | null;
};

// ---- Supervision en temps réel ----
export type StatutReversement = "AFaire" | "EnCours" | "Reverse" | "Echoue";

export type EntreeJournal = {
  id: number;
  date: string;
  niveau: "Trace" | "Debug" | "Information" | "Warning" | "Error" | "Critical";
  source: string;
  message: string;
  exception: string | null;
};

export type ReversementSupervision = {
  paiementId: number;
  locataire: string;
  bailleur: string;
  periode: string;
  montant: number;
  montantNet: number | null;
  compte: string;
  statut: StatutReversement;
  erreur: string | null;
  dernierEssai: string | null;
  echecs: number;
};

export type Supervision = {
  maintenant: string;
  api: { demarreLe: string; version: string | null; environnement: string; ipSortante: string | null; memoireMo: number };
  base: { ok: boolean; latenceMs: number | null; erreur: string | null };
  paiements: { mode: string; simulation: boolean; webhookConfigure: boolean };
  emails: { configures: boolean; mode: string; enFile: number };
  taches: { nom: string; dernierPassage: string | null; dureeMs: number | null; erreur: string | null }[];
  compteurs: {
    loyersEnAttente: number;
    abonnementsEnAttente: number;
    reversementsAFaire: number;
    reversementsEnCours: number;
    reversementsEchoues: number;
    reversesAujourdhui: number;
  };
  reversements: ReversementSupervision[];
  journal: EntreeJournal[];
};
