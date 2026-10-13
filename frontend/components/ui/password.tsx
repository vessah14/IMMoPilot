"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

// Accepte toutes les propriétés d'un <input> (required, minLength, autoComplete...),
// sauf type, value et onChange qui sont gérés par le composant.
type PasswordProps = Omit<ComponentProps<"input">, "type" | "value" | "onChange"> & {
  id: string;
  label: string;
  afficherForce?: boolean; // jauge de force (false sur la page de connexion)
};

// Donne une note de 0 à 4 selon les critères remplis
function calculerForce(motDePasse: string) {
  let force = 0;
  if (motDePasse.length >= 8) force++;
  if (/[A-Z]/.test(motDePasse) && /[a-z]/.test(motDePasse)) force++;
  if (/[0-9]/.test(motDePasse)) force++;
  if (/[^A-Za-z0-9]/.test(motDePasse)) force++;
  return force;
}

const niveaux = [
  { texte: "Très faible", couleur: "bg-red-500" },
  { texte: "Faible", couleur: "bg-orange-500" },
  { texte: "Moyen", couleur: "bg-yellow-500" },
  { texte: "Bon", couleur: "bg-teal-500" },
  { texte: "Fort", couleur: "bg-green-600" },
];

export default function Password({ id, label, afficherForce = true, ...props }: PasswordProps) {
  const [valeur, setValeur] = useState("");
  const [visible, setVisible] = useState(false);

  const force = calculerForce(valeur);

  return (
    <div className="w-full space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          name={id}
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="py-2.5 sm:py-3 pl-4 pr-11 rounded-lg block w-full bg-white border border-gray-300 sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:pointer-events-none"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-blue-600"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {/* Jauge de force : visible seulement quand on a commencé à taper */}
      {afficherForce && valeur && (
        <div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < force ? niveaux[force].couleur : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Force : {niveaux[force].texte}
          </p>
        </div>
      )}
    </div>
  );
}
