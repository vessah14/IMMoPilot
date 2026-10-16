"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { Fonctionnalite, Formule } from "@/lib/types";

// Fonctions comprises dans la formule du bailleur connecté (fournies par l'API dans /auth/moi).
// Sert seulement à l'affichage (cadenas, liens « Passer à Pro ») : l'API refuse elle-même ce qui n'est pas compris.
const ContexteFormule = createContext<Fonctionnalite[]>([]);

export function FournisseurFormule({ fonctionnalites, children }: { fonctionnalites: Fonctionnalite[]; children: React.ReactNode }) {
  return <ContexteFormule.Provider value={fonctionnalites}>{children}</ContexteFormule.Provider>;
}

export function useAcces(fonction: Fonctionnalite) {
  return useContext(ContexteFormule).includes(fonction);
}

// Formule minimale de chaque fonction (même règle que l'API)
export const formuleRequise = (fonction: Fonctionnalite): Formule => (fonction === "ProprietairesMultiples" ? "Enterprise" : "Pro");

export const lienFormule = (fonction: Fonctionnalite) => `/admin/parametres?onglet=abonnement&formule=${formuleRequise(fonction)}`;

// Encart affiché à la place d'une fonction non comprise dans la formule
export function FonctionReservee({ fonction, titre, texte }: { fonction: Fonctionnalite; titre: string; texte: string }) {
  const formule = formuleRequise(fonction);
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Lock className="size-6" />
      </span>
      <div>
        <p className="text-lg font-semibold text-gray-900">{titre}</p>
        <p className="mx-auto mt-1 max-w-md text-gray-600">{texte}</p>
      </div>
      <Link
        href={lienFormule(fonction)}
        className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Passer à la formule {formule}
      </Link>
    </div>
  );
}

// Petit bouton à cadenas, à la place d'une action réservée
export function BoutonReserve({ fonction, label }: { fonction: Fonctionnalite; label: string }) {
  return (
    <Link
      href={lienFormule(fonction)}
      title={`Réservé à la formule ${formuleRequise(fonction)}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-blue-600 whitespace-nowrap"
    >
      <Lock className="size-3.5" /> {label} · {formuleRequise(fonction)}
    </Link>
  );
}
