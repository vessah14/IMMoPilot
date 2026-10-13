"use client";

import CoqueDashboard from "@/components/layout/CoqueDashboard";
import { configSuperAdmin } from "@/components/layout/navigation";

type Props = { nom: string; ticketsUrgents: number; children: React.ReactNode };

// Structure de l'application : sidebar + barre du haut + contenu, complétée avec le compte connecté.
// Composant client : les icônes du menu ne peuvent pas être passées depuis un layout serveur.
export default function CoqueSuperAdmin({ nom, ticketsUrgents, children }: Props) {
  const config = {
    ...configSuperAdmin,
    alertesNonLues: ticketsUrgents, // la cloche mène au support : on y affiche les tickets urgents
    utilisateur: { ...configSuperAdmin.utilisateur, nom, initiale: nom.trim().charAt(0).toUpperCase() || "S" },
  };
  return <CoqueDashboard config={config}>{children}</CoqueDashboard>;
}
