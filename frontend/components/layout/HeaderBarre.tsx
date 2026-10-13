"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, BellRing, House } from "lucide-react";
import type { ConfigEspace } from "@/components/layout/navigation";
import Logo from "@/components/ui/Logo";

type HeaderBarreProps = {
  config: ConfigEspace;
  onOpenMobile: () => void; // ouvre la sidebar sur mobile
};

export default function HeaderBarre({ config, onOpenMobile }: HeaderBarreProps) {
  const pathname = usePathname();
  const { liens, racine, utilisateur, lienAlertes, alertesNonLues = 0 } = config;

  // Titre = nom du lien de la sidebar qui correspond à la page en cours
  // (on teste les chemins les plus longs d'abord pour que /admin/immeubles
  // ne soit pas pris pour /admin)
  const pageActive = [...liens]
    .sort((a, b) => b.path.length - a.path.length)
    .find((link) => pathname === link.path || pathname.startsWith(link.path + "/"));
  const titre = pageActive?.name ?? "Tableau de bord";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3">
      {/* Gauche : bouton menu (mobile) + titre de la page */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-blue-600"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-6" />
        </button>
        {/* Logo : sur mobile seulement (sur ordinateur, il est déjà dans la sidebar) */}
        <Link href={racine} className="lg:hidden shrink-0" aria-label="IMMO PILOT - Vue d'ensemble">
          <Logo texte={false} className="h-8" />
        </Link>
        <h1 className="text-lg sm:text-xl font-semibold truncate">{titre}</h1>
      </div>

      {/* Droite : recherche, notifications, profil */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-blue-600"
          aria-label="Retourner à la page d’accueil du site"
        >
          <House className="size-5" />
          <span className="hidden sm:inline">Accueil du site</span>
        </Link>
        <Link
          href={lienAlertes}
          className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
          aria-label={alertesNonLues > 0 ? `Notifications (${alertesNonLues} non lues)` : "Notifications"}
        >
          <BellRing className="size-5" />
          {/* Pastille : nombre de notifications non lues */}
          {alertesNonLues > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
              {alertesNonLues > 9 ? "9+" : alertesNonLues}
            </span>
          )}
        </Link>

        <Link
          href={`${racine}/parametres`}
          className="flex items-center gap-3 rounded-full p-1 pr-1 sm:pr-3 hover:bg-gray-100 transition"
        >
          <div className="size-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {utilisateur.initiale}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium">{utilisateur.nom}</p>
            <p className="text-xs text-gray-500">{utilisateur.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
