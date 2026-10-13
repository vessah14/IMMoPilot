"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, DoorOpen, Hammer, House, Trash2 } from "lucide-react";
import { Recherche, Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { styleChamp } from "@/components/ui/Input";
import { BoutonModifier, ModifierLogement } from "@/components/dashboard/Modifier";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa, libellesTypeLogement } from "@/lib/format";
import type { Logement, StatutLogement } from "@/lib/types";

// Libellé + icône + couleurs de chaque statut (jamais la couleur seule)
const statuts: Record<StatutLogement, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  Occupe: { label: "Occupé", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  Vacant: { label: "Vacant", icon: DoorOpen, style: "bg-blue-100 text-blue-700" },
  Travaux: { label: "En travaux", icon: Hammer, style: "bg-orange-100 text-orange-700" },
};

const etageTexte = (e: number) => (e === 0 ? "RDC" : `${e}${e === 1 ? "er" : "e"} étage`);

export default function ListeLogements({ logements }: { logements: Logement[] }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [immeuble, setImmeuble] = useState("tous");
  const [statut, setStatut] = useState<StatutLogement | "tous">("tous");
  const [occupe, setOccupe] = useState<number | null>(null);
  const [edition, setEdition] = useState<Logement | null>(null); // logement en cours de modification

  // Liste des immeubles pour le filtre (sans doublons)
  const immeubles = useMemo(() => [...new Set(logements.map((l) => l.immeuble))], [logements]);

  const resultats = logements.filter((l) => {
    const texte = `${l.reference} ${libellesTypeLogement[l.type]} ${l.locataire ?? ""}`.toLowerCase();
    return (
      texte.includes(recherche.trim().toLowerCase()) &&
      (immeuble === "tous" || l.immeuble === immeuble) &&
      (statut === "tous" || l.statut === statut)
    );
  });

  const compte = (s: StatutLogement | "tous") =>
    s === "tous" ? logements.length : logements.filter((l) => l.statut === s).length;

  const supprimer = async (l: Logement) => {
    if (!confirm(`Supprimer le logement ${l.reference} (${l.immeuble}) ?`)) return;
    setOccupe(l.id);
    try {
      await apiClient(`/logements/${l.id}`, { methode: "DELETE" });
      router.refresh();
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setOccupe(null);
    }
  };

  const boutonSupprimer = (l: Logement) => (
    <span className="inline-flex items-center gap-1">
    <BoutonModifier onClick={() => setEdition(l)} libelle={`Modifier le logement ${l.reference}`} />
    <button
      type="button"
      onClick={() => supprimer(l)}
      disabled={occupe === l.id}
      aria-label={`Supprimer le logement ${l.reference}`}
      title="Supprimer"
      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
    >
      <Trash2 className="size-4" />
    </button>
    </span>
  );

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      {edition && <ModifierLogement key={edition.id} element={edition} onFermer={() => setEdition(null)} />}
      {/* Filtres */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <Recherche
            valeur={recherche}
            onChange={setRecherche}
            placeholder="Rechercher une référence, un type, un locataire…"
            label="Rechercher un logement"
          />
          <select
            value={immeuble}
            onChange={(e) => setImmeuble(e.target.value)}
            aria-label="Filtrer par immeuble"
            className={`${styleChamp} sm:w-60`}
          >
            <option value="tous">Tous les immeubles</option>
            {immeubles.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </div>
        <Pastilles
          label="Filtrer par statut"
          valeur={statut}
          onChange={setStatut}
          options={[
            { valeur: "tous", label: `Tous (${compte("tous")})` },
            { valeur: "Occupe", label: `Occupés (${compte("Occupe")})` },
            { valeur: "Vacant", label: `Vacants (${compte("Vacant")})` },
            { valeur: "Travaux", label: `En travaux (${compte("Travaux")})` },
          ]}
        />
      </div>

      {resultats.length === 0 ? (
        <EtatVide
          icon={House}
          titre={logements.length === 0 ? "Aucun logement pour l'instant" : "Aucun logement trouvé"}
          texte={
            logements.length === 0
              ? "Ajoutez les logements de vos immeubles avec le bouton « Ajouter un logement »."
              : "Essayez une autre recherche ou retirez des filtres."
          }
        />
      ) : (
        <>
          {/* Tableau — tablette et ordinateur */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Logement</th>
                  <th className="px-5 py-3 font-medium">Immeuble</th>
                  <th className="px-5 py-3 font-medium">Surface</th>
                  <th className="px-5 py-3 font-medium">Locataire</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Loyer</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultats.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{l.reference}</p>
                      <p className="text-xs text-gray-500">
                        {libellesTypeLogement[l.type]} · {etageTexte(l.etage)}
                      </p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{l.immeuble}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{l.surface} m²</td>
                    <td className="px-5 py-3 whitespace-nowrap">{l.locataire ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-5 py-3">
                      <Badge {...statuts[l.statut]} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right font-medium">{fcfa(l.loyer)}</td>
                    <td className="px-3 py-3 text-right">{boutonSupprimer(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes — mobile */}
          <ul className="md:hidden divide-y divide-gray-100">
            {resultats.map((l) => (
              <li key={l.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {l.reference} <span className="font-normal text-gray-500">· {libellesTypeLogement[l.type]}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {l.immeuble} · {etageTexte(l.etage)} · {l.surface} m²
                    </p>
                  </div>
                  <Badge {...statuts[l.statut]} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-600">{l.locataire ?? "Aucun locataire"}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold whitespace-nowrap">{fcfa(l.loyer)}</span>
                    {boutonSupprimer(l)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
        {resultats.length} logement{resultats.length > 1 ? "s" : ""} affiché{resultats.length > 1 ? "s" : ""} sur{" "}
        {logements.length}
      </p>
    </div>
  );
}
