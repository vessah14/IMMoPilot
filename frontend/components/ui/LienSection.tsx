"use client";

import type { ComponentProps } from "react";

type LienSectionProps = Omit<ComponentProps<"a">, "href"> & {
  section: string; // id de la section sur la page d'accueil, ex : "faq"
};

// Lien vers une section de la page d'accueil, avec défilement fluide.
// Le défilement est fait en JavaScript : il fonctionne même si le lien
// disparaît juste après le clic (menu mobile qui se ferme).
export default function LienSection({ section, onClick, children, ...props }: LienSectionProps) {
  const gererClic = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e); // ex : fermer le menu mobile

    const cible = document.getElementById(section);
    // Section absente (on est sur une autre page) : navigation normale vers /#section
    if (!cible) return;

    e.preventDefault();
    const reduire = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // On attend l'image suivante : le menu mobile a le temps de se fermer
    // et la hauteur de la navbarre est à jour avant de calculer la position
    requestAnimationFrame(() => {
      cible.scrollIntoView({ behavior: reduire ? "auto" : "smooth", block: "start" });
      window.history.replaceState(window.history.state, "", `#${section}`);
    });
  };

  return (
    <a href={`/#${section}`} onClick={gererClic} {...props}>
      {children}
    </a>
  );
}
