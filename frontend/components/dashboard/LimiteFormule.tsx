"use client";

import { useRef } from "react";
import { Lock, Rocket, TriangleAlert, X, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { fcfa } from "@/lib/format";
import { lienPaiement, type InfosLimite } from "@/lib/limites";

const noms = { immeubles: "immeuble", locataires: "locataire" } as const;
const nouveau = { immeubles: "un nouvel immeuble", locataires: "un nouveau locataire" } as const;

const maximum = (n: number | null, ressource: InfosLimite["ressource"]) =>
  n === null ? `${ressource} illimités` : `jusqu'à ${n} ${ressource}`;

// Bandeau affiché sur la page quand la limite de la formule est atteinte
export function AlerteLimite({ infos }: { infos: InfosLimite }) {
  if (!infos.atteinte) return null;
  const s = infos.superieure;
  return (
    <div role="status" className="flex flex-col gap-4 rounded-xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-orange-600" />
        <div>
          <p className="font-semibold text-orange-900">
            Limite atteinte : {infos.utilise} / {infos.limite} {infos.ressource}
          </p>
          <p className="text-sm text-orange-800">
            Votre formule {infos.formule} ne permet pas d&apos;ajouter d&apos;autres {infos.ressource}.
            {s && ` Passez à la formule ${s.formule} pour gérer ${maximum(s.limite, infos.ressource)}.`}
          </p>
        </div>
      </div>
      {s ? (
        <Button href={lienPaiement(s.formule)} icon={Rocket} className="shrink-0">
          Passer à {s.formule}
        </Button>
      ) : (
        <Button href="/admin/parametres?onglet=support" variant="outline" className="shrink-0">
          Contacter le support
        </Button>
      )}
    </div>
  );
}

// Remplace le bouton « Ajouter » : si la limite est atteinte, il ouvre la proposition de formule supérieure
export function BoutonAjoutLimite({ infos, children }: { infos: InfosLimite; children: React.ReactNode }) {
  const modal = useRef<HTMLDialogElement>(null);
  if (!infos.atteinte) return <>{children}</>;

  const s = infos.superieure;
  const fermer = () => modal.current?.close();

  return (
    <>
      <Button icon={Lock} onClick={() => modal.current?.showModal()}>
        Ajouter un {noms[infos.ressource]}
      </Button>

      <dialog
        ref={modal}
        onClick={(e) => e.target === modal.current && fermer()}
        aria-labelledby="titre-limite"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm"
      >
        <div className="relative flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
          <button type="button" onClick={fermer} aria-label="Fermer" className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="size-5" />
          </button>
          <span className="flex size-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Lock className="size-7" />
          </span>
          <div>
            <h2 id="titre-limite" className="text-xl font-bold text-gray-900">
              Limite de votre formule atteinte
            </h2>
            <p className="mt-2 text-gray-600">
              La formule <strong>{infos.formule}</strong> permet {maximum(infos.limite, infos.ressource)}, et vous en avez
              déjà {infos.utilise}. Pour ajouter {nouveau[infos.ressource]}, passez à une formule supérieure.
            </p>
          </div>

          {s ? (
            <div className="w-full rounded-xl border-2 border-blue-600 bg-blue-50/50 p-4 text-left">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg font-bold text-gray-900">Formule {s.formule}</p>
                <p className="whitespace-nowrap text-sm text-gray-600">
                  <span className="text-lg font-bold text-blue-600">{fcfa(s.prix)}</span> / mois
                </p>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-green-600" /> {maximum(s.limite, infos.ressource)}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-green-600" /> Paiement par Orange Money ou MTN MoMo
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Contactez le support pour une offre sur mesure.</p>
          )}

          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={fermer}>
              Plus tard
            </Button>
            {s ? (
              <Button href={lienPaiement(s.formule)} icon={Rocket}>
                Passer à {s.formule}
              </Button>
            ) : (
              <Button href="/admin/parametres?onglet=support">Contacter le support</Button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
