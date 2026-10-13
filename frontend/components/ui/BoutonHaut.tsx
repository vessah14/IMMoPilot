"use client";

import { ArrowUp } from "lucide-react";

export default function BoutonHaut() {
  // Défilement fluide, sauf si l'utilisateur a demandé moins d'animations
  const remonter = () => {
    const reduire = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduire ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={remonter}
      className="inline-block rounded-full bg-blue-500 p-2 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:p-3 lg:p-4 cursor-pointer"
      aria-label="Remonter en haut de la page"
      title="Remonter en haut"
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
