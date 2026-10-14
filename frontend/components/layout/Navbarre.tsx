"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import LienSection from "@/components/ui/LienSection";
import { Menu, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Utilisateur } from "@/lib/types";

// id = l'id de la section sur la page d'accueil
const liens = [
  { label: "Accueil", id: "accueil" },
  { label: "Fonctionnalités", id: "fonctionnalites" },
  { label: "Tarifs", id: "tarifs" },
  { label: "FAQ", id: "faq" },
];

export default function Navbarre() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [sectionSurvolee, setSectionActive] = useState("accueil");
  // Boutons « Se connecter / Commencer » affichés tout de suite ; remplacés par « Mon compte » si une session existe
  const [connecte, setConnecte] = useState(false);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  // Hors de la page d'accueil (pages légales…), aucun lien n'est allumé
  const sectionActive = usePathname() === "/" ? sectionSurvolee : "";
  const fermerMenu = () => setMenuOuvert(false);

  useEffect(() => {
    let actif = true;
    // 1. Présence du cookie : réponse immédiate du site, sans attendre l'API (qui peut être en veille)
    fetch("/session")
      .then((r) => r.json() as Promise<{ connecte: boolean }>)
      .then(({ connecte }) => {
        if (!actif || !connecte) return;
        setConnecte(true);
        // 2. Nom de la personne connectée, demandé à l'API ; session expirée → retour aux boutons
        return apiClient<Utilisateur>("/auth/moi")
          .then((moi) => {
            if (actif) setUtilisateur(moi);
          })
          .catch(() => {
            if (actif) setConnecte(false);
          });
      })
      .catch(() => {
        // Vérification impossible : on garde les boutons de connexion
      });
    return () => {
      actif = false;
    };
  }, []);

  const nom = utilisateur?.nomComplet.trim() ?? "";
  const initiale = nom.charAt(0).toUpperCase() || "?";

  // Surveille quelle section est au milieu de l'écran pour allumer le bon lien
  useEffect(() => {
    const sections = liens
      .map((lien) => document.getElementById(lien.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((entree) => {
          if (entree.isIntersecting) setSectionActive(entree.target.id);
        });
      },
      // Zone de détection : une bande autour du milieu de l'écran
      { rootMargin: "-45% 0px -50% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const styleLien = (id: string) =>
    sectionActive === id ? "text-blue-600" : "hover:text-blue-600";

  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" aria-label="IMMO PILOT - Accueil">
            <Logo />
          </Link>

          {/* Liens — ordinateur */}
          <ul className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            {liens.map((lien) => (
              <li key={lien.label}>
                <LienSection
                  section={lien.id}
                  aria-current={sectionActive === lien.id ? "true" : undefined}
                  className={`transition ${styleLien(lien.id)}`}
                >
                  {lien.label}
                </LienSection>
              </li>
            ))}
          </ul>

          {/* Boutons — ordinateur */}
          <div className="hidden md:flex gap-3">
            {connecte ? (
              <Link
                href="/admin"
                aria-label={nom ? `Ouvrir le tableau de bord de ${nom}` : "Ouvrir le tableau de bord"}
                className="inline-flex max-w-64 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-gray-100"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {initiale}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="max-w-44 truncate text-sm font-medium text-gray-900">{nom || "Mon espace"}</span>
                  <span className="text-xs text-gray-500">Mon compte</span>
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="border border-blue-600 text-blue-600 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-50 transition"
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>

          {/* Bouton burger — mobile */}
          <button
            type="button"
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden p-2 -mr-2 text-gray-700 hover:text-blue-600 transition"
            aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
          >
            {menuOuvert ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu déroulant — mobile */}
        {menuOuvert && (
          <div id="menu-mobile" className="md:hidden mt-4 pb-2 border-t border-gray-100">
            <ul className="flex flex-col py-2 text-base font-medium text-gray-700">
              {liens.map((lien) => (
                <li key={lien.label}>
                  <LienSection
                    section={lien.id}
                    aria-current={sectionActive === lien.id ? "true" : undefined}
                    onClick={() => {
                      fermerMenu();
                      setSectionActive(lien.id);
                    }}
                    className={`block py-3 transition ${styleLien(lien.id)}`}
                  >
                    {lien.label}
                  </LienSection>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-2">
              {connecte ? (
                <Link
                  href="/admin"
                  onClick={fermerMenu}
                  className="inline-flex items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gray-100"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {initiale}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-gray-900">{nom || "Mon espace"}</span>
                    <span className="text-xs text-gray-500">Mon compte</span>
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    onClick={fermerMenu}
                    className="text-center border border-blue-600 text-blue-600 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-50 transition"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={fermerMenu}
                    className="text-center bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Commencer
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
