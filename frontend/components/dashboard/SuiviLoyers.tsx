"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Clock,
  CircleAlert,
  Check,
  HandCoins,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  MessageCircle,
  Mail,
} from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa, nomMois, dateCourte } from "@/lib/format";
import type { Echeance, StatutEcheance } from "@/lib/types";

const statuts: Record<StatutEcheance, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  Paye: { label: "Payé", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  Partiel: { label: "Partiel", icon: CircleDashed, style: "bg-blue-100 text-blue-700" },
  EnAttente: { label: "En attente", icon: Clock, style: "bg-gray-100 text-gray-700" },
  Impaye: { label: "Impayé", icon: CircleAlert, style: "bg-red-100 text-red-700" },
};

// "2026-09-01" + n mois
const decalerMois = (mois: string, n: number) => {
  const d = new Date(`${mois}T12:00:00`);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

type Canal = "Email" | "WhatsApp";

export default function SuiviLoyers({
  initiales,
  moisCourant,
  signature,
}: {
  initiales: Echeance[];
  moisCourant: string;
  signature: string; // nom (ou agence) et téléphone du propriétaire, en bas des messages
}) {
  const [mois, setMois] = useState(moisCourant);
  const [echeances, setEcheances] = useState(initiales);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState<StatutEcheance | "tous">("tous");
  const [relanceEnCours, setRelanceEnCours] = useState<number | null>(null);

  const changerMois = async (n: number) => {
    const nouveau = decalerMois(mois, n);
    setChargement(true);
    setErreur("");
    try {
      setEcheances(await apiClient<Echeance[]>(`/loyers?mois=${nouveau}`));
      setMois(nouveau);
      setFiltre("tous");
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Impossible de charger ce mois.");
    } finally {
      setChargement(false);
    }
  };

  // Le lien ouvre la messagerie ou le WhatsApp du propriétaire avec le message déjà écrit ;
  // en même temps, on garde la trace de la relance (date affichée + notification)
  const relancer = async (e: Echeance, canal: Canal) => {
    setRelanceEnCours(e.locataireId);
    try {
      const miseAJour = await apiClient<Echeance>("/loyers/relances", {
        methode: "POST",
        corps: { locataireId: e.locataireId, mois, canal },
      });
      setEcheances((liste) => liste.map((x) => (x.locataireId === e.locataireId ? miseAJour : x)));
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "La relance n'a pas pu être enregistrée.");
    } finally {
      setRelanceEnCours(null);
    }
  };

  const lignes = echeances.filter((e) => filtre === "tous" || e.statut === filtre);
  const attendu = echeances.reduce((s, e) => s + e.du, 0);
  const encaisse = echeances.reduce((s, e) => s + Math.min(e.paye, e.du), 0);
  const reste = attendu - encaisse;
  const taux = attendu ? Math.round((encaisse / attendu) * 100) : 0;
  const compte = (s: StatutEcheance) => echeances.filter((e) => e.statut === s).length;

  return (
    <div className={`flex flex-col gap-8 transition-opacity ${chargement ? "opacity-60" : ""}`}>
      {/* Choix du mois */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => changerMois(-1)}
          disabled={chargement}
          aria-label="Mois précédent"
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="min-w-44 text-center text-lg font-semibold capitalize" aria-live="polite">
          {nomMois(mois)}
        </p>
        <button
          type="button"
          onClick={() => changerMois(1)}
          disabled={chargement || mois >= moisCourant}
          aria-label="Mois suivant"
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRight className="size-5" />
        </button>
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      </div>

      {/* Statistiques du mois */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Loyers attendus" icon={HandCoins} couleur="bg-blue-100 text-blue-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(attendu)}</p>
          <p className="text-sm text-gray-500">{echeances.length} échéances</p>
        </CarteStat>
        <CarteStat titre="Encaissé" icon={Wallet} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(encaisse)}</p>
          <p className="text-sm text-gray-500">{compte("Paye")} loyers payés en entier</p>
        </CarteStat>
        <CarteStat titre="Reste à percevoir" icon={CircleDollarSign} couleur="bg-red-100 text-red-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(reste)}</p>
          <p className="text-sm text-gray-500">{echeances.length - compte("Paye")} locataires concernés</p>
        </CarteStat>
        <CarteStat titre="Taux de recouvrement" icon={TrendingUp} couleur="bg-indigo-100 text-indigo-600">
          <p className="text-2xl font-bold">{taux} %</p>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${taux}%` }} />
          </div>
        </CarteStat>
      </div>

      {/* Échéancier */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <Pastilles
            label="Filtrer par statut"
            valeur={filtre}
            onChange={setFiltre}
            options={[
              { valeur: "tous", label: `Tous (${echeances.length})` },
              ...(Object.keys(statuts) as StatutEcheance[]).map((s) => ({ valeur: s, label: `${statuts[s].label} (${compte(s)})` })),
            ]}
          />
        </div>

        {lignes.length === 0 ? (
          <EtatVide
            icon={HandCoins}
            titre="Aucune échéance"
            texte={
              echeances.length === 0
                ? "Aucun locataire n'avait de bail en cours ce mois-ci."
                : "Aucun loyer ne correspond à ce filtre pour ce mois."
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {lignes.map((e) => {
              const resteLigne = Math.max(e.du - e.paye, 0);
              return (
                <li key={e.locataireId} className="grid grid-cols-1 gap-3 p-4 sm:px-5 md:grid-cols-[1fr_1.4fr_auto] md:items-center">
                  <div className="flex items-start justify-between gap-3 md:block">
                    <div>
                      <p className="font-medium text-gray-900">{e.locataire}</p>
                      <p className="text-sm text-gray-500">{e.logement}</p>
                    </div>
                    <div className="md:hidden">
                      <Badge {...statuts[e.statut]} />
                    </div>
                  </div>

                  {/* Progression du paiement */}
                  <div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-600">
                        {fcfa(Math.min(e.paye, e.du))} <span className="text-gray-400">/ {fcfa(e.du)}</span>
                      </span>
                      {resteLigne > 0 && <span className="font-medium text-red-600 whitespace-nowrap">reste {fcfa(resteLigne)}</span>}
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${e.statut === "Paye" ? "bg-green-600" : "bg-blue-600"}`}
                        style={{ width: `${e.du ? Math.min((e.paye / e.du) * 100, 100) : 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <div className="hidden md:block">
                      <Badge {...statuts[e.statut]} />
                    </div>
                    {e.statut !== "Paye" && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={lienEmail(e, mois, signature)}
                            onClick={() => relancer(e, "Email")}
                            aria-disabled={relanceEnCours === e.locataireId}
                            title={`Écrire à ${e.email} depuis votre messagerie`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 whitespace-nowrap"
                          >
                            <Mail className="size-4" /> E-mail
                          </a>
                          <a
                            href={lienWhatsApp(e, mois, signature)}
                            onClick={() => relancer(e, "WhatsApp")}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={relanceEnCours === e.locataireId}
                            title="Relancer par WhatsApp"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 whitespace-nowrap"
                          >
                            <MessageCircle className="size-4" /> WhatsApp
                          </a>
                        </div>
                        {e.derniereRelance && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 whitespace-nowrap" title="Dernière relance">
                            <Check className="size-3.5" /> Relancé le {dateCourte(e.derniereRelance)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// Texte de la relance, signé par le propriétaire
const messageRelance = (e: Echeance, mois: string, signature: string) =>
  `Bonjour ${e.locataire},\n\n` +
  `Sauf erreur de ma part, le loyer de ${nomMois(mois)} pour le logement ${e.logement} n'est pas encore entièrement réglé ` +
  `(reste à payer : ${fcfa(e.du - e.paye).replace(/\s/g, " ")}).\n` +
  `Merci de régulariser dès que possible. Si vous avez déjà payé, ne tenez pas compte de ce message.\n\n` +
  `Cordialement,\n${signature}`;

// Ouvre la messagerie du propriétaire (Gmail, Outlook…) : l'e-mail part de sa propre adresse
function lienEmail(e: Echeance, mois: string, signature: string) {
  const sujet = `Rappel : loyer de ${nomMois(mois)}`;
  return `mailto:${e.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(messageRelance(e, mois, signature))}`;
}

// Ouvre WhatsApp (téléphone ou WhatsApp Web) avec le message déjà écrit
function lienWhatsApp(e: Echeance, mois: string, signature: string) {
  let numero = e.telephone.replace(/\D/g, "");
  if (numero.length === 9) numero = `237${numero}`; // numéro camerounais sans indicatif
  return `https://wa.me/${numero}?text=${encodeURIComponent(messageRelance(e, mois, signature))}`;
}
