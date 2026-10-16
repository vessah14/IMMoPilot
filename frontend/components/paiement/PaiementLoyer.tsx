"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, CircleX, Clock, ExternalLink, Home, Loader2, PartyPopper, Smartphone, Phone } from "lucide-react";
import Input from "@/components/ui/Input";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { useCleIdempotence } from "@/lib/idempotence";
import { fcfa, dateCourte, nomMois } from "@/lib/format";
import type { PageLoyer, PaiementLoyer as Paiement, StatutEcheance } from "@/lib/types";

const libellesMois: Record<StatutEcheance, { label: string; style: string }> = {
  Impaye: { label: "En retard", style: "bg-red-100 text-red-700" },
  Partiel: { label: "Partiellement payé", style: "bg-orange-100 text-orange-700" },
  EnAttente: { label: "À payer", style: "bg-blue-100 text-blue-700" },
  Paye: { label: "Payé", style: "bg-green-100 text-green-700" },
};

const statutsPaiement = {
  Confirme: { label: "Payé", icon: CircleCheck, style: "text-green-700" },
  EnAttente: { label: "En attente", icon: Clock, style: "text-orange-700" },
  Echoue: { label: "Échoué", icon: CircleX, style: "text-red-700" },
} as const;

// Paiement du loyer par le locataire : choix du mois, numéro Mobile Money, validation sur le téléphone
export default function PaiementLoyer({
  jeton,
  page,
  paiementRetour,
}: {
  jeton: string;
  page: PageLoyer;
  paiementRetour?: number; // retour depuis la page de paiement SasPay : paiement à suivre
}) {
  const router = useRouter();
  const [mois, setMois] = useState(page.moisDus[0]?.mois ?? "");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<Paiement | null>(null); // en attente de validation sur le téléphone
  const [resultat, setResultat] = useState<Paiement | null>(null);
  const [redirection, setRedirection] = useState(false); // départ vers la page de paiement SasPay
  const idempotence = useCleIdempotence(); // un double envoi ne crée qu'une seule demande de paiement

  // Mois sélectionné ; s'il vient d'être payé (il disparaît de la liste), on passe au suivant
  const choisi = page.moisDus.find((m) => m.mois === mois) ?? page.moisDus[0];
  const base = `/paiement-loyer/${encodeURIComponent(jeton)}`;

  // Retour depuis la page de paiement SasPay : on reprend le suivi de ce paiement
  useEffect(() => {
    if (!paiementRetour) return;
    let actif = true;
    apiClient<Paiement>(`${base}/paiements/${paiementRetour}`)
      .then((p) => {
        if (!actif) return;
        if (p.statut === "EnAttente") setEnCours(p);
        else {
          setResultat(p);
          router.refresh();
        }
      })
      .catch(() => {
        // paiement introuvable : on affiche simplement la page
      });
    return () => {
      actif = false;
    };
  }, [paiementRetour, base, router]);

  // Pendant l'attente : statut redemandé toutes les 4 secondes (3 minutes maximum)
  useEffect(() => {
    if (!enCours) return;
    const debut = Date.now();
    const minuterie = setInterval(async () => {
      try {
        const p = await apiClient<Paiement>(`${base}/paiements/${enCours.id}`);
        if (p.statut !== "EnAttente" || Date.now() - debut > 3 * 60 * 1000) {
          setEnCours(null);
          setResultat(p);
          router.refresh(); // met à jour les mois restant à payer et l'historique
        }
      } catch {
        // coupure réseau passagère : on réessaie au prochain tour
      }
    }, 4000);
    return () => clearInterval(minuterie);
  }, [enCours, base, router]);

  const payer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const telephone = String(new FormData(e.currentTarget).get("telephone"));
    setErreur("");
    setResultat(null);
    setEnvoi(true);
    try {
      const p = await apiClient<Paiement>(`${base}/paiements`, {
        methode: "POST",
        cleIdempotence: idempotence.cle(),
        corps: { mois: choisi?.mois, telephone },
      });
      idempotence.renouveler(); // demande créée : un prochain paiement sera une nouvelle opération
      // Orange Money (et parfois MTN) : le paiement se fait sur la page SasPay, puis retour automatique ici
      if (p.urlPaiement) {
        setRedirection(true);
        window.location.assign(p.urlPaiement);
        return;
      }
      setEnCours(p);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Le paiement n'a pas pu être lancé. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div>
        <p className="text-sm text-gray-500">Bonjour,</p>
        <h1 className="text-2xl font-bold text-gray-900">{page.locataire}</h1>
        <div className="mt-3 flex flex-col gap-1 text-sm text-gray-600">
          {page.logement && (
            <p className="flex items-center gap-2">
              <Home className="size-4 text-gray-400" /> {page.logement}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-gray-400" /> Bailleur : {page.bailleur}
            {page.telephoneBailleur && <> · <a href={`tel:${page.telephoneBailleur}`} className="text-blue-600 hover:underline">{page.telephoneBailleur}</a></>}
          </p>
        </div>
      </div>

      {page.verseA && (
        <p className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm border border-gray-100">
          Votre paiement est reversé automatiquement à <strong className="text-gray-900">{page.verseA}</strong>.
        </p>
      )}

      {page.simulation && (
        <div role="note" className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Mode simulation : aucun argent réel n&apos;est débité.</p>
          <p className="mt-1">
            Numéro finissant par <strong className="font-mono">0000</strong> → refusé · <strong className="font-mono">1111</strong> → reste en
            attente · autre numéro → payé après quelques secondes.
          </p>
        </div>
      )}

      {/* Résultat du dernier paiement */}
      {resultat && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl p-4 ${
            resultat.statut === "Confirme" ? "bg-green-50 text-green-900" : resultat.statut === "Echoue" ? "bg-red-50 text-red-800" : "bg-orange-50 text-orange-900"
          }`}
        >
          {resultat.statut === "Confirme" ? <CircleCheck className="mt-0.5 size-6 shrink-0" /> : <CircleAlert className="mt-0.5 size-6 shrink-0" />}
          <div>
            <p className="font-semibold">
              {resultat.statut === "Confirme"
                ? `Paiement reçu : ${fcfa(resultat.montant)} pour ${nomMois(resultat.mois)}`
                : resultat.statut === "Echoue"
                  ? "Le paiement n'a pas abouti"
                  : "Paiement toujours en attente"}
            </p>
            <p className="mt-1 text-sm">
              {resultat.statut === "Confirme"
                ? `Référence ${resultat.reference}. Votre bailleur est prévenu automatiquement.`
                : resultat.statut === "Echoue"
                  ? "Aucun montant n'a été débité. Vérifiez votre solde ou votre numéro, puis réessayez."
                  : "Si vous avez validé sur votre téléphone, la confirmation arrivera dans quelques minutes."}
            </p>
          </div>
        </div>
      )}

      {/* Paiement */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {redirection ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center" role="status" aria-live="polite">
            <span className="flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ExternalLink className="size-8" />
            </span>
            <div>
              <p className="text-lg font-semibold text-gray-900">Ouverture de la page de paiement sécurisée…</p>
              <p className="mt-1 text-gray-600">
                Validez le paiement sur la page SasPay : vous reviendrez ici automatiquement une fois le paiement terminé.
              </p>
            </div>
            <Loader2 className="size-6 animate-spin text-blue-600" />
          </div>
        ) : enCours ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center" role="status" aria-live="polite">
            <span className="relative flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Smartphone className="size-8" />
              <Loader2 className="absolute -right-1 -top-1 size-6 animate-spin text-blue-600" />
            </span>
            <div>
              <p className="text-lg font-semibold text-gray-900">Validez le paiement sur votre téléphone</p>
              <p className="mt-1 text-gray-600">
                Une demande de <strong>{fcfa(enCours.montant)}</strong> ({enCours.operateur}) vient d&apos;être envoyée.
                Tapez votre code secret pour confirmer.
              </p>
              {enCours.codeUssd && (
                <p className="mt-2 text-sm text-gray-500">
                  Rien reçu ? Composez <strong className="font-mono">{enCours.codeUssd}</strong>.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400">Cette page se met à jour toute seule.</p>
          </div>
        ) : !page.verseA ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" role="note">
            <span className="flex size-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <CircleAlert className="size-7" />
            </span>
            <p className="text-lg font-semibold text-gray-900">Paiement en ligne pas encore activé</p>
            <p className="text-gray-600">Votre bailleur n&apos;a pas encore indiqué de compte pour recevoir les loyers. Contactez-le.</p>
          </div>
        ) : page.moisDus.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <PartyPopper className="size-7" />
            </span>
            <p className="text-lg font-semibold text-gray-900">Vous êtes à jour !</p>
            <p className="text-gray-600">Aucun loyer à payer pour le moment. Merci.</p>
          </div>
        ) : (
          <form onSubmit={payer} className="flex flex-col gap-5 p-5 sm:p-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-semibold text-gray-900">Quel mois voulez-vous payer ?</legend>
              {page.moisDus.map((m) => (
                <label
                  key={m.mois}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 transition has-checked:border-blue-600 has-checked:bg-blue-50/50"
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="mois" value={m.mois} checked={choisi?.mois === m.mois} onChange={() => setMois(m.mois)} className="size-4 accent-blue-600" />
                    <span>
                      <span className="block font-medium capitalize text-gray-900">{nomMois(m.mois)}</span>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${libellesMois[m.statut].style}`}>
                        {libellesMois[m.statut].label}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold whitespace-nowrap text-gray-900">{fcfa(m.reste)}</span>
                    {m.paye > 0 && <span className="text-xs text-gray-500 whitespace-nowrap">déjà payé {fcfa(m.paye)}</span>}
                  </span>
                </label>
              ))}
            </fieldset>

            <Input
              id="telephone"
              label="Numéro Orange Money ou MTN MoMo"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="ex : 677 12 34 56"
              required
            />

            {erreur && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={envoi || !choisi}
              className="w-full rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              {envoi ? "Envoi de la demande…" : choisi ? `Payer ${fcfa(choisi.reste)}` : "Choisissez un mois"}
            </button>
            <p className="text-center text-xs text-gray-500">
              Vous validerez le paiement sur votre téléphone ou sur la page sécurisée SasPay (Orange Money ou MTN MoMo).
            </p>
          </form>
        )}
      </section>

      {/* Derniers paiements */}
      {page.derniers.length > 0 && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <h2 className="px-5 pt-5 pb-2 font-semibold text-gray-900">Mes derniers paiements</h2>
          <ul className="divide-y divide-gray-100">
            {page.derniers.map((p) => {
              const s = statutsPaiement[p.statut];
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium capitalize text-gray-900">{nomMois(p.mois)}</p>
                    <p className="text-gray-500">
                      {dateCourte(p.date)} · {p.operateur}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium whitespace-nowrap text-gray-900">{fcfa(p.montant)}</p>
                    <p className={`inline-flex items-center gap-1 ${s.style}`}>
                      <s.icon className="size-3.5" /> {s.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-gray-400">
        Ce lien est personnel : ne le partagez pas. En cas de question, contactez votre bailleur.
      </p>
    </div>
  );
}
