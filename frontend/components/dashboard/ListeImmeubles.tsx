"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Trash2, ImagePlus, Pencil } from "lucide-react";
import { ModifierImmeuble } from "@/components/dashboard/Modifier";
import { EtatVide } from "@/components/dashboard/Filtres";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { libellesTypeImmeuble } from "@/lib/format";
import type { Immeuble } from "@/lib/types";

export default function ListeImmeubles({ immeubles }: { immeubles: Immeuble[] }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState<number | null>(null); // immeuble en cours de traitement
  const [edition, setEdition] = useState<Immeuble | null>(null); // immeuble en cours de modification

  const action = async (id: number, operation: () => Promise<unknown>) => {
    setOccupe(id);
    try {
      await operation();
      router.refresh();
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setOccupe(null);
    }
  };

  const supprimer = (i: Immeuble) => {
    if (!confirm(`Supprimer l'immeuble « ${i.nom} » ? Cette action est définitive.`)) return;
    action(i.id, () => apiClient(`/immeubles/${i.id}`, { methode: "DELETE" }));
  };

  const changerPhoto = (i: Immeuble, fichier: File | undefined) => {
    if (!fichier) return;
    const formulaire = new FormData();
    formulaire.append("photo", fichier);
    action(i.id, () => apiClient(`/immeubles/${i.id}/photo`, { methode: "POST", formulaire }));
  };

  if (immeubles.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <EtatVide
          icon={Building2}
          titre="Aucun immeuble pour l'instant"
          texte="Cliquez sur « Ajouter un immeuble » pour enregistrer votre premier bien."
        />
      </div>
    );
  }

  return (
    <>
    {edition && <ModifierImmeuble key={edition.id} element={edition} onFermer={() => setEdition(null)} />}
    <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {immeubles.map((i) => {
        const taux = i.nombreLogements ? Math.round((i.logementsOccupes / i.nombreLogements) * 100) : 0;
        return (
          <li
            key={i.id}
            className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition ${
              occupe === i.id ? "opacity-60" : ""
            }`}
          >
            {/* Photo (ou emplacement vide) */}
            <div className="relative h-40 bg-blue-50">
              {i.photoUrl ? (
                <Image src={i.photoUrl} alt={`Photo de ${i.nom}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-blue-300">
                  <Building2 className="size-12" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700">
                {libellesTypeImmeuble[i.type]}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h3 className="font-semibold text-gray-900">{i.nom}</h3>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-500">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  {i.adresse}, {i.quartier} — {i.ville}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {i.logementsOccupes} / {i.nombreLogements} logements occupés
                  </span>
                  <span className="font-medium text-gray-900">{taux} %</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${taux}%` }} />
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600">
                  <ImagePlus className="size-4" />
                  {i.photoUrl ? "Changer la photo" : "Ajouter une photo"}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="sr-only"
                    disabled={occupe === i.id}
                    onChange={(e) => changerPhoto(i, e.target.files?.[0])}
                  />
                </label>
                <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEdition(i)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="size-4" /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => supprimer(i)}
                  disabled={occupe === i.id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" /> Supprimer
                </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
    </>
  );
}
