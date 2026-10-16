"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CircleAlert, CircleCheck, Clock, Loader2, Smartphone, CircleX, Receipt, PartyPopper, ArrowRight, ExternalLink } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/dashboard/Filtres";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa, dateCourte } from "@/lib/format";
import type { Abonnement, EtatAbonnement, Formule, PaiementAbonnement, Utilisateur } from "@/lib/types";

const etats: Record<EtatAbonnement, { label: string; style: string }> = {
  Gratuit: { label: "Gratuit", style: "bg-gray-100 text-gray-700" },
  Essai: { label: "Essai gratuit", style: "bg-blue-100 text-blue-700" },
  Actif: { label: "Actif", style: "bg-green-100 text-green-700" },
  Grace: { label: "À renouveler", style: "bg-orange-100 text-orange-700" },
  Expire: { label: "Expiré", style: "bg-red-100 text-red-700" },
};

const statutsPaiement = {
  EnAttente: { label: "En attente", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Reussi: { label: "Payé", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  Echoue: { label: "Échoué", icon: CircleX, style: "bg-red-100 text-red-700" },
} as const;

const libelleDuree = (mois: number) => (mois === 12 ? "12 mois" : `${mois} mois`);

export default function OngletAbonnement({
  abonnement: a,
  moi,
  formuleInitiale,
  bienvenue = false,
  paiementRetour,
}: {
  abonnement: Abonnement;
  moi: Utilisateur;
  formuleInitiale?: Formule; // formule présélectionnée (lien « Passer à Pro », inscription)
  bienvenue?: boolean; // on arrive juste après l'inscription
  paiementRetour?: number; // retour depuis la page de paiement SasPay : paiement à suivre
}) {
  const router = useRouter();
  const [formule, setFormule] = useState<Formule>(formuleInitiale ?? (a.formule === "Starter" ? "Pro" : a.formule));
  const blocPaiement = useRef<HTMLDivElement>(null);

  // Arrivée depuis un lien « Passer à … » : on amène directement au formulaire
  // (après l'inscription, on reste en haut pour voir le message de bienvenue)
  useEffect(() => {
    if (formuleInitiale && !bienvenue) blocPaiement.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formuleInitiale, bienvenue]);
  const [duree, setDuree] = useState(1);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<PaiementAbonnement | null>(null); // paiement en attente de validation
  const [resultat, setResultat] = useState<PaiementAbonnement | null>(null);
  const [redirection, setRedirection] = useState(false); // départ vers la page de paiement SasPay
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);

  // Retour depuis la page de paiement SasPay : on reprend le suivi de ce paiement
  useEffect(() => {
    if (!paiementRetour) return;
    let actif = true;
    apiClient<PaiementAbonnement>(`/abonnement/paiements/${paiementRetour}`)
      .then((p) => {
        if (!actif) return;
        if (p.statut === "EnAttente") setEnCours(p);
        else {
          setResultat(p);
          router.refresh();
        }
        blocPaiement.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(() => {
        // paiement introuvable : on affiche simplement le formulaire
      });
    return () => {
      actif = false;
    };
  }, [paiementRetour, router]);

  const offre = a.offres.find((o) => o.formule === formule) ?? a.offres[0];
  const tarif = offre.tarifs.find((t) => t.dureeMois === duree) ?? offre.tarifs[0];

  // Pendant l'attente : on redemande le statut toutes les 4 secondes (3 minutes maximum)
  useEffect(() => {
    if (!enCours) return;
    const debut = Date.now();
    minuterie.current = setInterval(async () => {
      try {
        const p = await apiClient<PaiementAbonnement>(`/abonnement/paiements/${enCours.id}`);
        if (p.statut !== "EnAttente") {
          setEnCours(null);
          setResultat(p);
          router.refresh(); // met à jour l'échéance, le bandeau et la cloche
        } else if (Date.now() - debut > 3 * 60 * 1000) {
          setEnCours(null);
          setResultat(p); // toujours en attente : affiché comme tel
        }
      } catch {
        // erreur réseau passagère : on réessaie au prochain tour
      }
    }, 4000);
    return () => {
      if (minuterie.current) clearInterval(minuterie.current);
    };
  }, [enCours, router]);

  const payer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const telephone = String(new FormData(e.currentTarget).get("telephoneMomo"));
    setErreur("");
    setResultat(null);
    setEnvoi(true);
    try {
      const p = await apiClient<PaiementAbonnement>("/abonnement/paiements", {
        methode: "POST",
        corps: { formule, dureeMois: duree, telephone },
      });
      // Orange Money (et parfois MTN) : le paiement se fait sur la page SasPay, puis retour automatique ici
      if (p.urlPaiement) {
        setRedirection(true);
        window.location.assign(p.urlPaiement);
        return;
      }
      setEnCours(p);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Juste après l'inscription à une formule payante */}
      {bienvenue && (
        <div role="status" className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-5 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Votre compte est créé, bienvenue sur IMMO PILOT !</p>
              <p className="text-sm text-green-800">
                Finalisez le paiement de votre formule {formule} ci-dessous.
                {a.etat === "Essai" && a.joursRestants !== null &&
                  ` Vous pouvez aussi profiter d'abord de vos ${a.joursRestants} jours d'essai gratuit et payer plus tard.`}
              </p>
            </div>
          </div>
          {a.etat === "Essai" && (
            <Link href="/admin" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-green-800 hover:underline">
              Commencer mon essai <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      )}

      {/* Situation actuelle */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Formule actuelle</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{a.formule}</p>
            <p className="mt-1 text-gray-600">
              {a.finAbonnement === null
                ? "Gratuite, sans échéance."
                : a.etat === "Expire"
                  ? `Expirée depuis le ${dateCourte(a.finAbonnement)} : vos données sont en lecture seule.`
                  : `${a.etat === "Essai" ? "Essai gratuit" : "Active"} jusqu'au ${dateCourte(a.finAbonnement)}${
                      a.joursRestants !== null && a.joursRestants >= 0 ? ` (${a.joursRestants} jour${a.joursRestants > 1 ? "s" : ""})` : ""
                    }.`}
            </p>
          </div>
          <Badge {...etats[a.etat]} />
        </div>

        {/* Utilisation */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Immeubles", utilise: moi.utilisation.immeubles, max: moi.utilisation.limiteImmeubles },
            { label: "Locataires", utilise: moi.utilisation.locataires, max: moi.utilisation.limiteLocataires },
          ].map((u) => (
            <div key={u.label}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{u.label}</span>
                <span className="text-gray-500">
                  {u.utilise} / {u.max ?? "illimité"}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: u.max ? `${Math.min((u.utilise / u.max) * 100, 100)}%` : "4%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paiement */}
      <div ref={blocPaiement} className="scroll-mt-24 rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {a.formule === "Starter" ? "Passer à une formule supérieure" : "Payer / renouveler mon abonnement"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">Paiement sécurisé par Orange Money ou MTN Mobile Money, via SasPay.</p>
        </div>

        {a.modeSimulation && (
          <div role="note" className="mx-6 mt-5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Mode simulation : aucun argent réel n&apos;est débité.</p>
            <p className="mt-1">
              Numéro se terminant par <strong className="font-mono">0000</strong> → paiement refusé ·{" "}
              <strong className="font-mono">1111</strong> → reste en attente · tout autre numéro → paiement réussi après
              quelques secondes.
            </p>
          </div>
        )}

        {!a.paiementEnLigneDisponible ? (
          <p className="px-6 py-6 text-sm text-gray-600">
            Le paiement en ligne n&apos;est pas encore disponible. Contactez le support depuis l&apos;onglet « Support » pour renouveler votre abonnement.
          </p>
        ) : redirection ? (
          /* Départ vers la page de paiement SasPay */
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
          /* Attente de validation sur le téléphone */
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center" role="status" aria-live="polite">
            <span className="relative flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Smartphone className="size-8" />
              <Loader2 className="absolute -right-1 -top-1 size-6 animate-spin text-blue-600" />
            </span>
            <div>
              <p className="text-lg font-semibold text-gray-900">Validez le paiement sur votre téléphone</p>
              <p className="mt-1 text-gray-600">
                Une demande de <strong>{fcfa(enCours.montant)}</strong> a été envoyée au {enCours.telephone.replace(/^237/, "")}.
                Tapez votre code secret {enCours.operateur ? `${enCours.operateur} ` : ""}pour confirmer.
              </p>
              {enCours.codeUssd && (
                <p className="mt-2 text-sm text-gray-500">
                  Rien reçu ? Composez <strong className="font-mono">{enCours.codeUssd}</strong> sur votre téléphone.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400">Cette page se met à jour toute seule.</p>
          </div>
        ) : (
          <form onSubmit={payer} className="flex flex-col gap-6 px-6 py-6">
            {resultat && (
              <p
                role="status"
                className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                  resultat.statut === "Reussi"
                    ? "bg-green-50 text-green-800"
                    : resultat.statut === "Echoue"
                      ? "bg-red-50 text-red-700"
                      : "bg-orange-50 text-orange-800"
                }`}
              >
                {resultat.statut === "Reussi" ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}
                {resultat.statut === "Reussi"
                  ? `Paiement reçu, merci ! Facture ${resultat.numeroFacture}. Votre abonnement est prolongé.`
                  : resultat.statut === "Echoue"
                    ? "Le paiement n'a pas été validé (solde insuffisant, code erroné ou demande expirée). Vous pouvez réessayer."
                    : "Nous n'avons pas encore reçu la confirmation. Si vous avez validé, votre abonnement sera mis à jour dans quelques minutes."}
              </p>
            )}

            {/* Formule */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700">Formule</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {a.offres.map((o) => (
                  <label
                    key={o.formule}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 has-checked:border-blue-600 has-checked:bg-blue-50/60 has-checked:ring-1 has-checked:ring-blue-600"
                  >
                    <input
                      type="radio"
                      name="formule"
                      value={o.formule}
                      checked={formule === o.formule}
                      onChange={() => setFormule(o.formule)}
                      className="sr-only"
                    />
                    <span className="font-semibold text-gray-900">{o.formule}</span>
                    <span className="text-sm text-gray-600">{fcfa(o.prixMensuel)} / mois</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Durée */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700">Durée</legend>
              <div className="grid grid-cols-3 gap-3">
                {offre.tarifs.map((t) => (
                  <label
                    key={t.dureeMois}
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-gray-200 p-3 text-center transition hover:border-blue-300 has-checked:border-blue-600 has-checked:bg-blue-50/60 has-checked:ring-1 has-checked:ring-blue-600"
                  >
                    <input
                      type="radio"
                      name="duree"
                      value={t.dureeMois}
                      checked={duree === t.dureeMois}
                      onChange={() => setDuree(t.dureeMois)}
                      className="sr-only"
                    />
                    <span className="font-semibold text-gray-900">{libelleDuree(t.dureeMois)}</span>
                    <span className="text-sm text-gray-600">{fcfa(t.montant)}</span>
                    {t.moisOfferts > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {t.moisOfferts} mois offerts
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <Input
                id="telephoneMomo"
                label="Numéro Orange Money ou MTN MoMo"
                type="tel"
                defaultValue={moi.telephone}
                placeholder="ex : 677 12 34 56"
                required
              />
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-500">Total à payer</p>
                <p className="text-xl font-bold text-gray-900">{fcfa(tarif.montant)}</p>
              </div>
            </div>

            {erreur && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-500">
                Vous validerez le paiement sur votre téléphone ou sur la page sécurisée SasPay. Aucun prélèvement automatique.
              </p>
              <Button type="submit" icon={Check} disabled={envoi} className="shrink-0">
                {envoi ? "Envoi de la demande…" : `Payer ${fcfa(tarif.montant)}`}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Historique */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <h2 className="px-6 pt-5 pb-3 text-lg font-semibold text-gray-900">Historique des paiements</h2>
        {a.historique.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gray-500">Aucun paiement d&apos;abonnement pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {a.historique.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="size-9 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Receipt className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.formule} · {libelleDuree(p.dureeMois)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dateCourte(p.dateCreation)}
                      {p.numeroFacture && ` · Facture ${p.numeroFacture}`}
                      {p.operateur && ` · ${p.operateur}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge {...statutsPaiement[p.statut]} />
                  <span className="w-32 text-right font-medium whitespace-nowrap">{fcfa(p.montant)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Pour revenir à la formule gratuite Starter, contactez le support.
      </p>
    </div>
  );
}
