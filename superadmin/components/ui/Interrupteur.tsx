"use client";

import { useState } from "react";

// Interrupteur on/off accessible (bouton avec role="switch").
// Avec "nom", sa valeur ("true" / "false") est envoyée avec le formulaire qui le contient.
export default function Interrupteur({
  label,
  description,
  defaut = false,
  nom,
}: {
  label: string;
  description: string;
  defaut?: boolean;
  nom?: string;
}) {
  const [actif, setActif] = useState(defaut);
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {nom && <input type="hidden" name={nom} value={String(actif)} />}
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={label}
        onClick={() => setActif(!actif)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
          actif ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            actif ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
