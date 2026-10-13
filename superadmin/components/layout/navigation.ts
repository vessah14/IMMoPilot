// Menu de l'application super administrateur
import { LayoutDashboard, Briefcase, BadgeDollarSign, UserCog, LifeBuoy, Settings } from "lucide-react";

export type Lien = {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
};

// Tout ce qu'affichent la sidebar et la barre du haut
export type ConfigEspace = {
  racine: string; // page d'accueil de l'application
  liens: Lien[];
  utilisateur: { nom: string; role: string; initiale: string };
  badge?: string; // étiquette affichée sous le logo
  lienAlertes: string; // page ouverte par la cloche de la barre du haut
  lienDeconnexion: string; // route qui efface le cookie de session (formulaire POST)
  alertesNonLues?: number; // nombre affiché sur la cloche
};

export const configSuperAdmin: ConfigEspace = {
  racine: "/",
  lienAlertes: "/support",
  lienDeconnexion: "/deconnexion",
  utilisateur: { nom: "Super administrateur", role: "Équipe IMMO PILOT", initiale: "S" },
  badge: "Super admin",
  liens: [
    { path: "/", icon: LayoutDashboard, name: "Vue d'ensemble" },
    { path: "/clients", icon: Briefcase, name: "Clients" },
    { path: "/abonnements", icon: BadgeDollarSign, name: "Abonnements" },
    { path: "/utilisateurs", icon: UserCog, name: "Utilisateurs" },
    { path: "/support", icon: LifeBuoy, name: "Support" },
    { path: "/parametres", icon: Settings, name: "Paramètres" },
  ],
};
