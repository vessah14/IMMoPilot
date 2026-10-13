"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Mail, MessageCircle, RefreshCw, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { apiClient, ErreurApi, URL_SITE } from "@/lib/api-client";
import type { Locataire } from "@/lib/types";

// Adresse complète du lien personnel de paiement d'un locataire
export const urlPaiement = (jeton: string) => `${URL_SITE}/payer/${jeton}`;

// Bouton des listes : ouvre la fenêtre du lien de paiement
export function BoutonLienPaiement({ onClick, libelle }: { onClick: () => void; libelle: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Lien de paiement du loyer"
      aria-label={libelle}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
    >
      <Link2 className="size-4" />
    </button>
  );
}

// Fenêtre : lien personnel du locataire, à copier ou envoyer par WhatsApp ; possibilité d'en créer un nouveau
export default function LienPaiement({
  locataire,
  compteEncaissement,
  onFermer,
}: {
  locataire: Locataire;
  compteEncaissement: string | null;
  onFermer: () => void;
}) {
  const router = useRouter();
  const modal = useRef<HTMLDialogElement>(null);
  const [jeton, setJeton] = useState(locataire.jetonPaiement);
  const [copie, setCopie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [emailEnvoye, setEmailEnvoye] = useState(false);

  // Envoi du lien au locataire par e-mail (par la plateforme, réponses adressées au bailleur)
  const envoyerEmail = async () => {
    setErreur("");
    setEnvoi(true);
    try {
      await apiClient(`/locataires/${locataire.id}/lien-paiement/envoi`, { methode: "POST" });
      setEmailEnvoye(true);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  useEffect(() => {
    modal.current?.showModal();
  }, []);

  const fermer = () => {
    modal.current?.close();
    onFermer();
  };

  const lien = jeton ? urlPaiement(jeton) : "";
  let numero = locataire.telephone.replace(/\D/g, "");
  if (numero.length === 9) numero = `237${numero}`;
  const message = `Bonjour ${locataire.nomComplet}, vous pouvez désormais payer votre loyer par Orange Money ou MTN MoMo avec ce lien personnel : ${lien}`;

  const copier = async () => {
    await navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  const nouveauLien = async () => {
    if (!confirm("Créer un nouveau lien ? L'ancien ne fonctionnera plus (à faire si le lien a été partagé par erreur).")) return;
    setErreur("");
    setEnvoi(true);
    try {
      const l = await apiClient<Locataire>(`/locataires/${locataire.id}/lien-paiement`, { methode: "POST" });
      setJeton(l.jetonPaiement);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <dialog
      ref={modal}
      onClick={(e) => e.target === modal.current && fermer()}
      onCancel={(e) => {
        e.preventDefault();
        fermer();
      }}
      aria-labelledby="titre-lien-paiement"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div>
          <h2 id="titre-lien-paiement" className="text-xl font-bold text-gray-900">
            Lien de paiement
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {locataire.nomComplet} paie son loyer en ligne avec ce lien, sans créer de compte.
          </p>
        </div>
        <button type="button" onClick={fermer} aria-label="Fermer" className="-mr-1.5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">
        {locataire.beneficiaireCompte ? (
          <p className="text-sm text-gray-600">
            Les paiements arrivent sur le compte de <strong className="text-gray-900">{locataire.beneficiaireNom}</strong> (
            <strong className="text-gray-900">{locataire.beneficiaireCompte.replace(/^237/, "")}</strong>)
            {locataire.beneficiaireCompte === compteEncaissement
              ? " : votre numéro (Paramètres → Agence)."
              : " : propriétaire du logement ou de l'immeuble (modifiable dans Logements ou Immeubles)."}
          </p>
        ) : (
          <p role="alert" className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Indiquez d&apos;abord votre numéro Mobile Money de réception des loyers dans{" "}
            <a href="/admin/parametres?onglet=agence" className="font-medium underline">
              Paramètres → Agence
            </a>
            , sinon votre locataire ne pourra pas payer.
          </p>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <Link2 className="size-4 shrink-0 text-gray-400" />
          <input readOnly value={lien} aria-label="Lien de paiement" onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" icon={copie ? Check : Copy} onClick={copier}>
            {copie ? "Lien copié" : "Copier le lien"}
          </Button>
          <a
            href={`https://wa.me/${numero}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
          >
            <MessageCircle className="size-4" /> Envoyer par WhatsApp
          </a>
          <Button variant="secondary" icon={emailEnvoye ? Check : Mail} onClick={envoyerEmail} disabled={envoi} className="sm:col-span-2">
            {emailEnvoye ? `E-mail envoyé à ${locataire.email}` : `Envoyer par e-mail (${locataire.email})`}
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Le lien est envoyé automatiquement par e-mail au locataire à son arrivée et ajouté à vos relances (page Loyers). Chaque paiement apparaît dans « Paiements » et
          vous recevez une notification.
        </p>

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

        <button
          type="button"
          onClick={nouveauLien}
          disabled={envoi}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-gray-500 hover:text-red-600 disabled:opacity-50"
        >
          <RefreshCw className="size-4" /> {envoi ? "Création…" : "Créer un nouveau lien (désactive l'ancien)"}
        </button>
      </div>
    </dialog>
  );
}
