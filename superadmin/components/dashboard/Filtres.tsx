// Petits composants réutilisés par les listes du dashboard
import { Search } from "lucide-react";
import { styleChamp } from "@/components/ui/Input";

type Icone = React.ComponentType<{ className?: string }>;

// Champ de recherche avec loupe
export function Recherche({
  valeur,
  onChange,
  placeholder,
  label,
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${styleChamp} pl-9`}
      />
    </div>
  );
}

// Rangée de boutons-pastilles pour filtrer (un seul actif à la fois)
export function Pastilles<T extends string>({
  options,
  valeur,
  onChange,
  label,
}: {
  options: { valeur: T; label: string }[];
  valeur: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          aria-pressed={valeur === o.valeur}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            valeur === o.valeur ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Badge de statut : icône + texte + couleur (jamais la couleur seule)
export function Badge({ label, icon: Icone, style }: { label: string; icon?: Icone; style: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style}`}>
      {Icone && <Icone className="size-3.5" />}
      {label}
    </span>
  );
}

// Message affiché quand une liste est vide
export function EtatVide({ icon: Icone, titre, texte }: { icon: Icone; titre: string; texte: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
      <Icone className="size-10 text-gray-300" />
      <p className="font-medium text-gray-900">{titre}</p>
      <p className="text-sm text-gray-500">{texte}</p>
    </div>
  );
}

// En-tête commun des pages : titre, sous-titre et boutons d'action
export function EnTetePage({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500">{titre}</h1>
        <p className="mt-2 text-gray-500">{sousTitre}</p>
      </div>
      {children && <div className="flex flex-wrap gap-3 shrink-0">{children}</div>}
    </div>
  );
}

export const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
