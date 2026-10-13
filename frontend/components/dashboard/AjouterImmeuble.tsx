"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Layers,
  ImagePlus,
  CircleAlert,
} from "lucide-react";
import Input, { styleChamp } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IndicateurEtapes from "@/components/ui/IndicateurEtapes";
import { apiClient, ErreurApi } from "@/lib/api-client";
import type { Immeuble } from "@/lib/types";

const etapes = [
  { titre: "Informations", icon: Building2 },
  { titre: "Localisation", icon: MapPin },
  { titre: "Caractéristiques", icon: Layers },
  { titre: "Photo", icon: ImagePlus },
];

export default function AjouterImmeuble() {
  const modal = useRef<HTMLDialogElement>(null);
  const formulaire = useRef<HTMLFormElement>(null);
  const [etape, setEtape] = useState(0);
  const [nomPhoto, setNomPhoto] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const router = useRouter();

  const derniereEtape = etape === etapes.length - 1;

  const ouvrir = () => modal.current?.showModal();

  const fermer = () => {
    modal.current?.close();
    formulaire.current?.reset(); // vide les champs
    setNomPhoto("");
    setErreur("");
    setEtape(0);
  };

  // Vérifie les champs de l'étape en cours (required, min, max...)
  // et affiche le message du navigateur sur le premier champ invalide
  const etapeValide = () => {
    const bloc = formulaire.current?.querySelector(`[data-etape="${etape}"]`);
    if (!bloc) return true;
    const champs = bloc.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    );
    return Array.from(champs).every((champ) => champ.reportValidity());
  };

  const suivant = () => {
    if (etapeValide()) setEtape((e) => Math.min(e + 1, etapes.length - 1));
  };

  const precedent = () => setEtape((e) => Math.max(e - 1, 0));

  // La touche Entrée envoie le formulaire : avant la dernière étape,
  // on passe plutôt à l'étape suivante
  const gererEnvoi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!derniereEtape) return suivant();

    const d = new FormData(e.currentTarget);
    const nombre = (cle: string) => (d.get(cle) ? Number(d.get(cle)) : null);
    setErreur("");
    setEnvoi(true);
    try {
      // 1. Création de l'immeuble
      const immeuble = await apiClient<Immeuble>("/immeubles", {
        methode: "POST",
        corps: {
          nom: d.get("nom"),
          type: d.get("type"),
          description: d.get("description") || null,
          adresse: d.get("adresse"),
          ville: d.get("ville"),
          quartier: d.get("quartier"),
          nombreEtages: nombre("etages"),
          anneeConstruction: nombre("annee"),
        },
      });

      // 2. Envoi de la photo, si une photo a été choisie
      const photo = d.get("photo");
      if (photo instanceof File && photo.size > 0) {
        const envoiPhoto = new FormData();
        envoiPhoto.append("photo", photo);
        try {
          await apiClient(`/immeubles/${immeuble.id}/photo`, { methode: "POST", formulaire: envoiPhoto });
        } catch (err) {
          // L'immeuble est bien créé : on le signale sans bloquer
          alert(`Immeuble créé, mais la photo n'a pas pu être envoyée : ${err instanceof ErreurApi ? err.message : "erreur inconnue"}`);
        }
      }

      fermer();
      router.refresh(); // recharge la liste et les statistiques
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  // Chaque étape est un <fieldset> ; seule l'étape en cours est visible.
  // Les autres restent dans la page (hidden) pour que leurs valeurs soient conservées et envoyées.
  const blocEtape = (index: number) => ({
    "data-etape": index,
    hidden: etape !== index,
    className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  });

  return (
    <>
      <Button icon={Plus} onClick={ouvrir}>
        Ajouter un immeuble
      </Button>

      <dialog
        ref={modal}
        // Clic sur le fond sombre (en dehors de la fenêtre) → fermer
        onClick={(e) => e.target === modal.current && fermer()}
        // Touche Échap → fermer (et vider le formulaire)
        onCancel={(e) => {
          e.preventDefault();
          fermer();
        }}
        aria-labelledby="titre-modal-immeuble"
        className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm"
      >
        <form
          ref={formulaire}
          onSubmit={gererEnvoi}
          className="flex flex-col max-h-[90vh]"
        >
          {/* En-tête */}
          <div className="px-6 pt-5 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="titre-modal-immeuble" className="text-xl font-bold text-gray-900">
                  Ajouter un immeuble
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Étape {etape + 1} sur {etapes.length} — {etapes[etape].titre}
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

            {/* Indicateur d'étapes */}
            <div className="mt-5">
              <IndicateurEtapes etapes={etapes} etape={etape} />
            </div>
          </div>

          {/* Corps : une seule étape visible */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Étape 1 : informations générales */}
            <fieldset {...blocEtape(0)}>
              <Input id="nom" label="Nom de l'immeuble" placeholder="ex : Résidence Les Palmiers" required />
              <div className="w-full space-y-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type d&apos;immeuble <span className="text-red-500">*</span>
                </label>
                <select id="type" name="type" required defaultValue="" className={styleChamp}>
                  <option value="" disabled>
                    Choisir un type
                  </option>
                  <option value="Residentiel">Résidentiel</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixte">Mixte (résidentiel + commercial)</option>
                </select>
              </div>
              <div className="w-full space-y-2 sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Quelques mots sur l'immeuble : équipements, état, particularités…"
                  className={styleChamp}
                />
              </div>
            </fieldset>

            {/* Étape 2 : localisation */}
            <fieldset {...blocEtape(1)}>
              <div className="sm:col-span-2">
                <Input id="adresse" label="Adresse" placeholder="ex : Rue 1.234, face pharmacie" required />
              </div>
              <Input id="ville" label="Ville" placeholder="ex : Yaoundé" required />
              <Input id="quartier" label="Quartier" placeholder="ex : Bastos" required />
            </fieldset>

            {/* Étape 3 : caractéristiques */}
            <fieldset {...blocEtape(2)}>
              <Input id="etages" label="Nombre d'étages" type="number" min={0} placeholder="ex : 4" />
              <Input
                id="annee"
                label="Année de construction"
                type="number"
                min={1900}
                max={2100}
                placeholder="ex : 2018"
              />
            </fieldset>

            {/* Étape 4 : photo */}
            <fieldset {...blocEtape(3)}>
              <label
                htmlFor="photo"
                className="sm:col-span-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-10 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/50 transition"
              >
                <ImagePlus className="size-8 text-gray-400" />
                {nomPhoto ? (
                  <span className="text-sm font-medium text-gray-900 break-all">{nomPhoto}</span>
                ) : (
                  <span className="text-sm font-medium text-blue-600">Cliquez pour choisir une photo</span>
                )}
                <span className="text-xs text-gray-500">JPG, PNG ou WebP, 5 Mo maximum (facultatif)</span>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="sr-only"
                  onChange={(e) => setNomPhoto(e.target.files?.[0]?.name ?? "")}
                />
              </label>
            </fieldset>
          </div>

          {erreur && (
            <p role="alert" className="mx-6 mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
            </p>
          )}

          {/* Pied : navigation entre les étapes */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {etape === 0 ? (
              <Button variant="ghost" onClick={fermer}>
                Annuler
              </Button>
            ) : (
              <Button variant="outline" icon={ArrowLeft} onClick={precedent}>
                Précédent
              </Button>
            )}

            {derniereEtape ? (
              <Button type="submit" icon={Check} disabled={envoi}>
                {envoi ? "Enregistrement…" : "Enregistrer"}
              </Button>
            ) : (
              <Button onClick={suivant}>
                Suivant
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}
