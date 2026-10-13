import { Check } from "lucide-react";

type Etape = { titre: string; icon: React.ComponentType<{ className?: string }> };

// Pastilles d'étapes reliées par un trait : ✓ pour les étapes faites, anneau pour l'étape en cours
export default function IndicateurEtapes({ etapes, etape }: { etapes: Etape[]; etape: number }) {
  return (
    <ol className="flex items-center">
      {etapes.map((e, i) => {
        const Icone = e.icon;
        const faite = i < etape;
        const active = i === etape;
        return (
          <li key={e.titre} className={`flex items-center ${i < etapes.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`size-9 rounded-full flex items-center justify-center transition-colors ${
                  faite
                    ? "bg-blue-600 text-white"
                    : active
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600"
                      : "bg-gray-100 text-gray-400"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {faite ? <Check className="size-4" /> : <Icone className="size-4" />}
              </span>
              <span
                className={`hidden sm:block text-xs font-medium ${
                  active ? "text-blue-600" : faite ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {e.titre}
              </span>
            </div>
            {/* Trait entre deux étapes */}
            {i < etapes.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 sm:mb-5 rounded-full transition-colors ${faite ? "bg-blue-600" : "bg-gray-200"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
