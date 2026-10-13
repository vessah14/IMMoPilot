"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check, CircleAlert } from "lucide-react";
import { ErreurApi } from "@/lib/api-client";
import Button from "@/components/ui/Button";
import { styleChamp } from "@/components/ui/Input";

type FormulaireModalProps = {
  // Texte du bouton qui ouvre la modale. Sans bouton (mode « modification »),
  // la modale s'ouvre dès son affichage et onFermer est appelé à la fermeture.
  boutonLabel?: string;
  onFermer?: () => void;
  boutonIcon?: React.ComponentType<{ className?: string }>;
  titre: string;
  labelEnvoi: string; // texte du bouton d'enregistrement
  children: React.ReactNode; // les champs du formulaire
  // Enregistrement (appel à l'API). En cas d'erreur, le message s'affiche dans la modale.
  onEnvoyer: (donnees: FormData) => Promise<void>;
};

// Bouton + fenêtre modale contenant un formulaire sur 2 colonnes.
// Se ferme avec ✕, Annuler, Échap ou un clic sur le fond (et vide les champs).
export default function FormulaireModal({
  boutonLabel,
  boutonIcon,
  titre,
  labelEnvoi,
  children,
  onEnvoyer,
  onFermer,
}: FormulaireModalProps) {
  const modal = useRef<HTMLDialogElement>(null);
  const formulaire = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const fermer = () => {
    modal.current?.close();
    formulaire.current?.reset();
    setErreur("");
    onFermer?.();
  };

  // Mode « modification » : ouverture immédiate
  useEffect(() => {
    if (!boutonLabel) modal.current?.showModal();
  }, [boutonLabel]);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await onEnvoyer(new FormData(e.currentTarget));
      fermer();
      router.refresh(); // recharge les données de la page
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      {boutonLabel && (
        <Button icon={boutonIcon} onClick={() => modal.current?.showModal()}>
          {boutonLabel}
        </Button>
      )}

      <dialog
        ref={modal}
        onClick={(e) => e.target === modal.current && fermer()}
        onCancel={(e) => {
          e.preventDefault();
          fermer();
        }}
        aria-label={titre}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm"
      >
        <form ref={formulaire} onSubmit={envoyer} className="flex flex-col max-h-[90vh]">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{titre}</h2>
              <p className="mt-1 text-sm text-gray-500">
                Les champs marqués d&apos;un <span className="text-red-500">*</span> sont obligatoires.
              </p>
            </div>
            <button
              type="button"
              onClick={fermer}
              className="p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Champs (défilent si besoin) */}
          <div className="flex-1 overflow-y-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>

          {erreur && (
            <p role="alert" className="mx-6 mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
            </p>
          )}

          {/* Boutons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <Button variant="outline" onClick={fermer}>
              Annuler
            </Button>
            <Button type="submit" icon={Check} disabled={envoi}>
              {envoi ? "Enregistrement…" : labelEnvoi}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

// Un <select> avec son label, au style des autres champs
export function ChampSelect({
  id,
  name = id,
  label,
  options,
  required = true,
  defaut = "",
}: {
  id: string;
  name?: string; // par défaut = id
  label: string;
  options: { valeur: string; texte: string }[];
  required?: boolean;
  defaut?: string; // valeur sélectionnée à l'ouverture
}) {
  return (
    <div className="w-full space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select id={id} name={name} required={required} defaultValue={defaut} className={styleChamp}>
        <option value="" disabled>
          Choisir…
        </option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.texte}
          </option>
        ))}
      </select>
    </div>
  );
}
