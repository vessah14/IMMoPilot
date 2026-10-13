// Menu de l'espace bailleur (/admin) et type commun aux espaces du dashboard.
import {
  LayoutDashboard,
  Building2,
  House,
  Users,
  CreditCard,
  HandCoins,
  FileText,
  BellRing,
  Settings,
} from "lucide-react";

export type Lien = {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
};

// Tout ce qui change d'un espace à l'autre dans la sidebar et la barre du haut
export type ConfigEspace = {
  racine: string; // page d'accueil de l'espace
  liens: Lien[];
  utilisateur: { nom: string; role: string; initiale: string };
  badge?: string; // étiquette affichée sous le logo
  lienAlertes: string; // page ouverte par la cloche de la barre du haut
  lienDeconnexion: string; // route qui efface le cookie de session (formulaire POST)
  alertesNonLues?: number; // nombre affiché sur la cloche
};

export const configAdmin: ConfigEspace = {
  racine: "/admin",
  lienAlertes: "/admin/notifications",
  lienDeconnexion: "/deconnexion",
  utilisateur: { nom: "Administrateur", role: "IMMOPILOT", initiale: "A" },
  liens: [
    { path: "/admin", icon: LayoutDashboard, name: "Vue d'ensemble" },
    { path: "/admin/immeubles", icon: Building2, name: "Immeubles" },
    { path: "/admin/logements", icon: House, name: "Logements" },
    { path: "/admin/locataires", icon: Users, name: "Locataires" },
    { path: "/admin/paiements", icon: CreditCard, name: "Paiements" },
    { path: "/admin/loyers", icon: HandCoins, name: "Loyers" },
    { path: "/admin/rapports", icon: FileText, name: "Rapports" },
    { path: "/admin/notifications", icon: BellRing, name: "Notifications" },
    { path: "/admin/parametres", icon: Settings, name: "Paramètres" },
  ],
};
