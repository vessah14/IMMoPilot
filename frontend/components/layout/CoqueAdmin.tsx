"use client";

import CoqueDashboard from "@/components/layout/CoqueDashboard";
import { configAdmin } from "@/components/layout/navigation";

type Props = {
  utilisateur: { nom: string; structure: string | null };
  alertesNonLues: number;
  children: React.ReactNode;
};

// Structure de l'espace bailleur (/admin), complétée avec le compte connecté
export default function CoqueAdmin({ utilisateur, alertesNonLues, children }: Props) {
  const config = {
    ...configAdmin,
    alertesNonLues,
    utilisateur: {
      nom: utilisateur.nom,
      role: utilisateur.structure ?? "Bailleur",
      initiale: utilisateur.nom.trim().charAt(0).toUpperCase() || "?",
    },
  };
  return <CoqueDashboard config={config}>{children}</CoqueDashboard>;
}
