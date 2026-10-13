"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { PanelLeft, LogOut, X } from "lucide-react";
import type { ConfigEspace } from "@/components/layout/navigation";

type SideBarreProps = {
  config: ConfigEspace; // menu et infos de l'espace
  isCollapsed: boolean; // réduite (icônes seules) sur ordinateur
  setIsCollapsed: (valeur: boolean) => void;
  mobileOpen: boolean; // ouverte sur mobile
  onCloseMobile: () => void;
};

export default function SideBarre({
  config,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  onCloseMobile,
}: SideBarreProps) {
  const pathname = usePathname();
  const { liens, racine, badge } = config;

  // La page d'accueil de l'espace n'est active que sur elle-même,
  // les autres liens restent actifs sur leurs sous-pages
  const estActif = (path: string) =>
    path === racine ? pathname === path : pathname.startsWith(path);

  // Sur mobile, la sidebar est toujours dépliée
  const reduite = isCollapsed && !mobileOpen;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-blue-950 text-white flex flex-col justify-between p-4 z-50 shadow-xl transition-all duration-300
        w-64 ${reduite ? "lg:w-20" : "lg:w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      {/* Bouton réduire/déplier — ordinateur */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block absolute -right-3 top-6 bg-blue-900 border border-blue-700 p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-blue-800 transition-colors shadow-md cursor-pointer"
        title={isCollapsed ? "Déplier" : "Réduire"}
        aria-label={isCollapsed ? "Déplier le menu" : "Réduire le menu"}
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      {/* Bouton fermer — mobile */}
      <button
        type="button"
        onClick={onCloseMobile}
        className="lg:hidden absolute right-3 top-5 p-1.5 text-blue-200 hover:text-white"
        aria-label="Fermer le menu"
      >
        <X className="w-5 h-5" />
      </button>

      {/* En-tête */}
      <Link
        href={racine}
        onClick={onCloseMobile}
        aria-label="IMMO PILOT - Vue d'ensemble"
        className={`flex flex-col gap-2 pb-6 border-b border-blue-800/60 overflow-hidden ${
          reduite ? "items-center" : ""
        }`}
      >
        <Logo sombre texte={!reduite} className="h-7" />
        {/* Étiquette facultative sous le logo */}
        {badge && !reduite && (
          <span className="self-start rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-300">
            {badge}
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 my-6 overflow-y-auto pr-1">
        <ul className="space-y-1.5">
          {liens.map((link) => {
            const Icone = link.icon;
            const actif = estActif(link.path);
            return (
              <li key={link.path}>
                <Link
                  href={link.path}
                  onClick={onCloseMobile}
                  title={reduite ? link.name : undefined}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    reduite ? "justify-center" : "gap-4"
                  } ${
                    actif
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-blue-200 hover:bg-blue-900/50 hover:text-white"
                  }`}
                >
                  <Icone className="w-5 h-5 min-w-5" />
                  {!reduite && <span className="truncate">{link.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Déconnexion */}
      {/* Formulaire POST : la route de déconnexion efface le cookie de session */}
      <form action={config.lienDeconnexion} method="post" className="pt-4 border-t border-blue-800/60">
        <button
          type="submit"
          title={reduite ? "Déconnexion" : undefined}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
            reduite ? "justify-center" : "gap-4"
          }`}
        >
          <LogOut className="w-5 h-5 min-w-5" />
          {!reduite && <span>Déconnexion</span>}
        </button>
      </form>
    </aside>
  );
}
