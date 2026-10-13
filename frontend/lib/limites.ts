import type { Formule, Offre, Utilisateur } from "@/lib/types";

export type InfosLimite = {
  ressource: "immeubles" | "locataires";
  formule: Formule;
  utilise: number;
  limite: number | null; // null = illimité
  atteinte: boolean;
  // Formule conseillée pour aller plus loin (null si déjà la plus haute)
  superieure: { formule: Formule; prix: number; limite: number | null } | null;
};

const ordre: Formule[] = ["Starter", "Pro", "Enterprise"];

// Où en est le bailleur par rapport aux limites de sa formule
export function infosLimite(moi: Utilisateur, offre: Offre | null, ressource: InfosLimite["ressource"]): InfosLimite {
  const u = moi.utilisation;
  const utilise = ressource === "immeubles" ? u.immeubles : u.locataires;
  const limite = ressource === "immeubles" ? u.limiteImmeubles : u.limiteLocataires;

  // Première formule plus haute qui permet d'en avoir davantage
  const suivante = offre?.formules
    .filter((f) => ordre.indexOf(f.formule) > ordre.indexOf(moi.formule))
    .sort((a, b) => ordre.indexOf(a.formule) - ordre.indexOf(b.formule))
    .map((f) => ({ formule: f.formule, prix: f.prix, limite: ressource === "immeubles" ? f.limiteImmeubles : f.limiteLocataires }))
    .find((f) => limite === null || f.limite === null || f.limite > limite);

  return {
    ressource,
    formule: moi.formule,
    utilise,
    limite,
    atteinte: limite !== null && utilise >= limite,
    superieure: suivante ?? null,
  };
}

// Page de paiement avec la formule déjà choisie
export const lienPaiement = (formule: Formule) => `/admin/parametres?onglet=abonnement&formule=${formule}`;
