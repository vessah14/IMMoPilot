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
