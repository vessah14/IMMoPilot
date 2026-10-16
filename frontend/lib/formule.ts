import type { Fonctionnalite, Utilisateur } from "@/lib/types";

const toutes: Fonctionnalite[] = ["Relances", "Rapports", "ProprietairesMultiples", "Support"];

// Fonctions comprises dans la formule. Si l'API ne les indique pas (ancienne version), aucun cadenas n'est affiché :
// c'est de toute façon l'API qui accepte ou refuse chaque action.
export const fonctionsDe = (moi: Pick<Utilisateur, "fonctionnalites">): Fonctionnalite[] => moi.fonctionnalites ?? toutes;

export const aAcces = (moi: Pick<Utilisateur, "fonctionnalites">, fonction: Fonctionnalite) => fonctionsDe(moi).includes(fonction);
