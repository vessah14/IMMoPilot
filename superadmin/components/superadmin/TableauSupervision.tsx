"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleAlert,
  CircleCheck,
  Clock,
  Database,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Search,
  Server,
  Wallet,
} from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { Badge } from "@/components/dashboard/Filtres";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa, nomMois } from "@/lib/format";
import type { EntreeJournal, StatutReversement, Supervision } from "@/lib/types";

const INTERVALLE = 5000; // actualisation toutes les 5 secondes

const statutsReversement: Record<StatutReversement, { label: string; style: string }> = {
  AFaire: { label: "À envoyer", style: "bg-orange-100 text-orange-700" },
  EnCours: { label: "En cours", style: "bg-blue-100 text-blue-700" },
  Reverse: { label: "Reversé", style: "bg-green-100 text-green-700" },
  Echoue: { label: "À régulariser", style: "bg-red-100 text-red-700" },
};

const filtresJournal = {
  tout: { label: "Tout", garde: () => true },
  alertes: { label: "Avertissements et erreurs", garde: (e: EntreeJournal) => e.niveau !== "Information" },
  erreurs: { label: "Erreurs", garde: (e: EntreeJournal) => e.niveau === "Error" || e.niveau === "Critical" },
} as const;

const styleNiveau = (n: EntreeJournal["niveau"]) =>
  n === "Error" || n === "Critical" ? "text-red-600" : n === "Warning" ? "text-amber-600" : "text-gray-500";

// « il y a 45 s », « il y a 3 min », « il y a 2 h 05 »
function ilYa(date: string | null, maintenant: number) {
  if (!date) return "jamais";
  const s = Math.max(0, Math.round((maintenant - new Date(date).getTime()) / 1000));
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  const h = Math.floor(s / 3600);
  return h < 48 ? `il y a ${h} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}` : `il y a ${Math.floor(h / 24)} j`;
}

const heure = (date: string) => new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function TableauSupervision({ initial }: { initial: Supervision }) {
  const [etat, setEtat] = useState(initial);
  const [enDirect, setEnDirect] = useState(true);
  const [derniereMaj, setDerniereMaj] = useState(() => Date.now());
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [erreurMaj, setErreurMaj] = useState("");
  const [filtre, setFiltre] = useState<keyof typeof filtresJournal>("tout");
  const [recherche, setRecherche] = useState("");
  const [relance, setRelance] = useState<number | null>(null);
  const [messageRelance, setMessageRelance] = useState("");

  // Actualisation en direct (mise en pause possible, ou quand l'onglet est masqué)
  useEffect(() => {
    if (!enDirect) return;
    const minuterie = setInterval(async () => {
      if (document.hidden) return;
      try {
        setEtat(await apiClient<Supervision>("/admin/supervision"));
        setDerniereMaj(Date.now());
        setErreurMaj("");
      } catch (err) {
        setErreurMaj(err instanceof ErreurApi ? err.message : "API injoignable");
      }
    }, INTERVALLE);
    return () => clearInterval(minuterie);
  }, [enDirect]);

  // Horloge des durées relatives (« il y a 12 s »)
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const journal = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return etat.journal.filter(
      (e) => filtresJournal[filtre].garde(e) && (!texte || `${e.source} ${e.message} ${e.exception ?? ""}`.toLowerCase().includes(texte)),
    );
  }, [etat.journal, filtre, recherche]);

  const relancer = async (paiementId: number) => {
    setRelance(paiementId);
    setMessageRelance("");
    try {
      await apiClient(`/admin/supervision/reversements/${paiementId}/relancer`, { methode: "POST" });
      setEtat(await apiClient<Supervision>("/admin/supervision"));
      setMessageRelance(`Reversement du loyer n° ${paiementId} relancé : voir le résultat ci-dessous et dans le journal.`);
    } catch (err) {
      setMessageRelance(err instanceof ErreurApi ? err.message : "Relance impossible.");
    } finally {
      setRelance(null);
    }
  };

  const enRetard = enDirect && maintenant - derniereMaj > INTERVALLE * 3;
  const c = etat.compteurs;

  return (
    <div className="flex flex-col gap-8">
      {/* Indicateur « en direct » */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
        <p className="flex items-center gap-2 text-sm text-gray-600" role="status" aria-live="polite">
          <span className={`relative flex size-2.5 rounded-full ${erreurMaj || enRetard ? "bg-red-500" : enDirect ? "bg-green-500" : "bg-gray-400"}`}>
            {enDirect && !erreurMaj && !enRetard && <span className="absolute inset-0 animate-ping rounded-full bg-green-400" />}
          </span>
          {erreurMaj
            ? `Actualisation impossible : ${erreurMaj}`
            : enDirect
              ? `En direct · mis à jour ${ilYa(new Date(derniereMaj).toISOString(), maintenant)}`
              : "En pause"}
        </p>
        <button
          type="button"
          onClick={() => setEnDirect((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          {enDirect ? <Pause className="size-4" /> : <Play className="size-4" />}
          {enDirect ? "Mettre en pause" : "Reprendre"}
        </button>
      </div>

      {/* État des services */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <CarteStat titre="API" icon={Server} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold text-gray-900">En ligne</p>
          <div className="text-sm text-gray-500">
            <p>Démarrée {ilYa(etat.api.demarreLe, maintenant)}</p>
            <p>
              Version {etat.api.version ?? "locale"} · {etat.api.memoireMo} Mo
            </p>
            <p>IP sortante : {etat.api.ipSortante ?? "inconnue"}</p>
          </div>
        </CarteStat>

        <CarteStat titre="Base de données" icon={Database} couleur={etat.base.ok ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}>
          <p className={`text-2xl font-bold ${etat.base.ok ? "text-gray-900" : "text-red-600"}`}>{etat.base.ok ? "Disponible" : "Injoignable"}</p>
          <p className="text-sm text-gray-500">{etat.base.ok ? `Répond en ${etat.base.latenceMs} ms` : etat.base.erreur}</p>
        </CarteStat>

        <CarteStat titre="Paiements" icon={Wallet} couleur={etat.paiements.simulation ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}>
          <p className="text-sm font-semibold text-gray-900">{etat.paiements.mode}</p>
          <p className={`text-sm ${etat.paiements.webhookConfigure ? "text-gray-500" : "text-amber-600"}`}>
            {etat.paiements.webhookConfigure ? "Webhook SasPay vérifié par signature" : "Secret du webhook SasPay absent"}
          </p>
        </CarteStat>

        <CarteStat titre="E-mails" icon={Mail} couleur={etat.emails.configures ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}>
          <p className="text-2xl font-bold text-gray-900">{etat.emails.configures ? etat.emails.mode : "Non configurés"}</p>
          <p className="text-sm text-gray-500">
            {etat.emails.enFile} e-mail{etat.emails.enFile > 1 ? "s" : ""} en attente d&apos;envoi
          </p>
        </CarteStat>
      </div>

      {/* Tâches de fond et compteurs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Clock className="size-4 text-gray-400" /> Tâches de fond (toutes les 2 minutes)
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {etat.taches.map((t) => (
              <li key={t.nom} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium capitalize text-gray-900">{t.nom}</span>
                <span className={t.erreur ? "text-red-600" : "text-gray-500"}>
                  {t.erreur ? `Échec ${ilYa(t.dernierPassage, maintenant)} : ${t.erreur}` : `${ilYa(t.dernierPassage, maintenant)}${t.dureeMs !== null ? ` · ${t.dureeMs} ms` : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Activity className="size-4 text-gray-400" /> En ce moment
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              { label: "Loyers à valider", valeur: c.loyersEnAttente },
              { label: "Abonnements à valider", valeur: c.abonnementsEnAttente },
              { label: "Reversés aujourd'hui", valeur: c.reversesAujourdhui, style: "text-green-700" },
              { label: "Reversements à envoyer", valeur: c.reversementsAFaire, style: c.reversementsAFaire ? "text-orange-600" : undefined },
              { label: "Reversements en cours", valeur: c.reversementsEnCours },
              { label: "À régulariser", valeur: c.reversementsEchoues, style: c.reversementsEchoues ? "text-red-600" : undefined },
            ].map((x) => (
              <div key={x.label}>
                <dt className="text-gray-500">{x.label}</dt>
                <dd className={`text-xl font-bold ${x.style ?? "text-gray-900"}`}>{x.valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Reversements pas encore reçus par les propriétaires */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Reversements aux propriétaires en attente</h2>
          <p className="text-sm text-gray-500">Nouvel essai automatique toutes les 10 minutes ; « Relancer » renvoie tout de suite.</p>
        </div>
        {messageRelance && <p className="mx-5 mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">{messageRelance}</p>}
        {etat.reversements.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-6 text-sm text-gray-500">
            <CircleCheck className="size-4 text-green-600" /> Aucun reversement en attente : tous les loyers payés en ligne ont été reversés.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {etat.reversements.map((r) => (
              <li key={r.paiementId} className="flex flex-col gap-2 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    Loyer n° {r.paiementId} · {r.locataire} → {r.bailleur}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="capitalize">{nomMois(r.periode)}</span> · {fcfa(r.montant)} payés · {fcfa(r.montantNet ?? r.montant)} à reverser sur{" "}
                    {r.compte}
                  </p>
                  {(r.erreur || r.dernierEssai) && (
                    <p className="mt-1 text-sm text-gray-600">
                      {r.erreur ?? "En attente de confirmation de l'opérateur"}
                      {r.dernierEssai && <span className="text-gray-400"> · dernier essai {ilYa(r.dernierEssai, maintenant)}</span>}
                      {r.echecs > 0 && <span className="text-gray-400"> · {r.echecs} refus</span>}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge {...statutsReversement[r.statut]} />
                  <button
                    type="button"
                    onClick={() => relancer(r.paiementId)}
                    disabled={relance !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RotateCcw className={`size-4 ${relance === r.paiementId ? "animate-spin" : ""}`} />
                    {relance === r.paiementId ? "Envoi…" : "Relancer"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Journal en direct */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Journal en direct</h2>
            <p className="text-sm text-gray-500">
              Les 200 derniers événements depuis le démarrage de l&apos;API (les logs Render gardent l&apos;historique complet).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Rechercher dans le journal</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="payout, loyer, erreur…"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
              />
            </label>
            <select
              value={filtre}
              onChange={(e) => setFiltre(e.target.value as keyof typeof filtresJournal)}
              aria-label="Niveau des événements"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {Object.entries(filtresJournal).map(([cle, f]) => (
                <option key={cle} value={cle}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {journal.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-6 text-sm text-gray-500">
            <CircleCheck className="size-4 text-green-600" /> Aucun événement{filtre !== "tout" || recherche ? " correspondant" : ""}.
          </p>
        ) : (
          <ol className="max-h-[32rem] divide-y divide-gray-50 overflow-y-auto font-mono text-xs">
            {journal.map((e) => (
              <li key={e.id} className="flex gap-3 px-5 py-2">
                <time dateTime={e.date} className="shrink-0 text-gray-400">
                  {heure(e.date)}
                </time>
                <span className={`w-14 shrink-0 font-semibold ${styleNiveau(e.niveau)}`}>
                  {e.niveau === "Information" ? "INFO" : e.niveau === "Warning" ? "AVERT." : "ERREUR"}
                </span>
                <span className="min-w-0 break-words text-gray-700">
                  <span className="text-gray-400">{e.source} · </span>
                  {e.message}
                  {e.exception && (
                    <span className="mt-0.5 flex items-start gap-1 text-red-600">
                      <CircleAlert className="mt-0.5 size-3 shrink-0" /> {e.exception}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
