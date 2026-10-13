import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDollarSign, Wallet, CircleAlert, Check, CircleCheck, Clock, CircleX } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { EnTetePage, Badge } from "@/components/dashboard/Filtres";
import BoutonExport from "@/components/ui/BoutonExport";
import ProlongerAbonnement from "@/components/superadmin/ProlongerAbonnement";
import { statutsClient } from "@/components/superadmin/libelles";
import { apiAdmin } from "@/lib/api-serveur";
import { fcfa, dateCourte } from "@/lib/format";
import type { Client, PaiementAbonnement, Statistiques } from "@/lib/types";

export const metadata: Metadata = { title: "Abonnements" };

const limites = {
  Starter: ["Jusqu'à 3 immeubles", "10 locataires"],
  Pro: ["Jusqu'à 15 immeubles", "100 locataires"],
  Enterprise: ["Immeubles illimités", "Locataires illimités"],
} as const;

const statutsPaiement = {
  EnAttente: { label: "En attente", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Reussi: { label: "Payé", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  Echoue: { label: "Échoué", icon: CircleX, style: "bg-red-100 text-red-700" },
} as const;

export default async function Abonnements() {
  const [s, clients, paiements] = await Promise.all([
    apiAdmin<Statistiques>("/statistiques"),
    apiAdmin<Client[]>("/clients"),
    apiAdmin<PaiementAbonnement[]>("/paiements-abonnement"),
  ]);

  // Clients à suivre : essai ou abonnement qui se termine, délai de grâce, expirés
  const aSuivre = clients
    .filter((c) => c.finAbonnement && c.statut !== "Suspendu" && c.statut !== "Gratuit")
    .sort((a, b) => a.finAbonnement!.localeCompare(b.finAbonnement!))
    .slice(0, 15);

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage titre="Abonnements" sousTitre="Paiements des bailleurs, échéances et formules.">
        <BoutonExport
          nomFichier="paiements-abonnement"
          entetes={["Date", "Client", "Formule", "Durée (mois)", "Montant (FCFA)", "Statut", "Opérateur", "Facture", "Manuel"]}
          lignes={paiements.map((p) => [
            dateCourte(p.dateCreation),
            p.client,
            p.formule,
            p.dureeMois,
            p.montant,
            statutsPaiement[p.statut].label,
            p.operateur,
            p.numeroFacture,
            p.manuel ? "Oui" : "Non",
          ])}
        />
        <Link
          href="/parametres"
          className="inline-flex items-center rounded-lg border border-blue-600 px-5 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Modifier les prix
        </Link>
      </EnTetePage>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <CarteStat titre="Encaissé ce mois" icon={Wallet} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(s.encaisseCeMois)}</p>
          <p className="text-sm text-gray-500">paiements d&apos;abonnement reçus</p>
        </CarteStat>
        <CarteStat titre="Revenu mensuel récurrent" icon={BadgeDollarSign} couleur="bg-blue-100 text-blue-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(s.revenuMensuelRecurrent)}</p>
          <p className="text-sm text-gray-500">{s.clientsActifs} clients payants · {s.essais} en essai</p>
        </CarteStat>
        <CarteStat titre="Abonnements expirés" icon={CircleAlert} couleur="bg-red-100 text-red-600">
          <p className="text-3xl font-bold">{s.expires}</p>
          <p className="text-sm text-gray-500">comptes en lecture seule, à relancer</p>
        </CarteStat>
      </div>

      {/* Formules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {s.formules.map((f) => (
          <div key={f.formule} className="flex flex-col gap-4 rounded-xl bg-white shadow-sm border border-gray-100 p-5">
            <div>
              <p className="text-sm font-medium text-gray-500">Formule</p>
              <p className="text-xl font-bold text-gray-900">{f.formule}</p>
              <p className="mt-1 text-gray-600">
                {f.prix === 0 ? <span className="font-semibold text-gray-900">Gratuit</span> : <><span className="font-semibold text-gray-900">{fcfa(f.prix)}</span> / mois</>}
              </p>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm text-gray-600">
              {limites[f.formule].map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <Check className="size-4 text-green-600" /> {l}
                </li>
              ))}
            </ul>
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
              <div>
                <p className="text-lg font-bold">{f.actifs}</p>
                <p className="text-xs text-gray-500">payants</p>
              </div>
              <div>
                <p className="text-lg font-bold">{f.essais}</p>
                <p className="text-xs text-gray-500">en essai</p>
              </div>
              <div>
                <p className="text-lg font-bold whitespace-nowrap">{f.revenu.toLocaleString("fr-FR")}</p>
                <p className="text-xs text-gray-500">FCFA / mois</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProlongerAbonnement clients={clients.filter((c) => c.statut !== "Suspendu").map((c) => ({ id: c.id, nom: c.nom, formule: c.formule }))} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Échéances */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-semibold text-gray-900">Échéances à suivre</h2>
            <p className="text-sm text-gray-500">Abonnements et essais, de la plus proche à la plus lointaine</p>
          </div>
          {aSuivre.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-gray-500">Aucune échéance à suivre.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {aSuivre.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{c.nom}</p>
                    <p className="text-sm text-gray-500">
                      Formule {c.formule} · échéance le {dateCourte(c.finAbonnement!)} ·{" "}
                      <a href={`mailto:${c.email}`} className="hover:text-blue-600">
                        {c.email}
                      </a>
                    </p>
                  </div>
                  <Badge {...statutsClient[c.statut]} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Paiements */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-semibold text-gray-900">Derniers paiements</h2>
            <p className="text-sm text-gray-500">Orange Money / MTN MoMo via CamPay, et prolongations manuelles</p>
          </div>
          {paiements.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-gray-500">Aucun paiement d&apos;abonnement pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {paiements.slice(0, 20).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{p.client}</p>
                    <p className="text-sm text-gray-500">
                      {p.formule} · {p.dureeMois} mois · {dateCourte(p.dateCreation)}
                      {p.manuel ? " · manuel" : p.operateur ? ` · ${p.operateur}` : ""}
                      {p.numeroFacture && ` · ${p.numeroFacture}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge {...statutsPaiement[p.statut]} />
                    <span className="w-28 text-right font-medium whitespace-nowrap">{fcfa(p.montant)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
