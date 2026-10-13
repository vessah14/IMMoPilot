import { Wallet, Receipt, KeyRound, HandCoins } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import GraphiqueRevenus from "@/components/ui/GraphiqueRevenus";
import BoutonExport from "@/components/ui/BoutonExport";
import { EnTetePage } from "@/components/dashboard/Filtres";
import { apiServeur } from "@/lib/api-serveur";
import { fcfa, moisCourt, nomMois, dateCourte, libellesMoyen } from "@/lib/format";
import type { Rapport } from "@/lib/types";

export default async function Rapports() {
  const r = await apiServeur<Rapport>("/rapports");

  // Part des loyers attendus effectivement encaissée, en moyenne sur 12 mois
  const moyenneMensuelle = r.totalEncaisse / 12;
  const tauxEncaissement = r.loyersAttendusParMois ? Math.min(Math.round((moyenneMensuelle / r.loyersAttendusParMois) * 100), 100) : 0;

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage
        titre="Rapports"
        sousTitre={`Bilan de vos encaissements du ${dateCourte(r.debut)} au ${dateCourte(r.fin)}.`}
      >
        <BoutonExport
          nomFichier="rapport-revenus"
          label="Exporter en Excel"
          entetes={["Mois", "Revenus encaissés (FCFA)"]}
          lignes={r.revenusParMois.map((m) => [nomMois(m.mois), m.montant])}
        />
      </EnTetePage>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Revenus encaissés" icon={Wallet} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(r.totalEncaisse)}</p>
          <p className="text-sm text-gray-500">sur 12 mois · {r.nombrePaiements} paiements</p>
        </CarteStat>
        <CarteStat titre="Moyenne mensuelle" icon={Receipt} couleur="bg-blue-100 text-blue-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(moyenneMensuelle)}</p>
          <p className="text-sm text-gray-500">encaissés par mois</p>
        </CarteStat>
        <CarteStat titre="Taux d'encaissement" icon={HandCoins} couleur="bg-teal-100 text-teal-600">
          <p className="text-2xl font-bold">{tauxEncaissement} %</p>
          <p className="text-sm text-gray-500">des loyers attendus ({fcfa(r.loyersAttendusParMois)} / mois)</p>
        </CarteStat>
        <CarteStat titre="Taux d'occupation" icon={KeyRound} couleur="bg-indigo-100 text-indigo-600">
          <p className="text-2xl font-bold">{r.tauxOccupation} %</p>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${r.tauxOccupation}%` }} />
          </div>
        </CarteStat>
      </div>

      {/* Évolution des revenus */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Évolution des revenus</h2>
          <p className="text-sm text-gray-500">Loyers encaissés chaque mois</p>
        </div>
        <div className="p-5">
          <GraphiqueRevenus donnees={r.revenusParMois.map((m) => ({ mois: moisCourt(m.mois), montant: m.montant }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Repartition
          titre="Revenus par immeuble"
          sousTitre="Part de chaque immeuble dans les encaissements"
          total={r.totalEncaisse}
          lignes={r.revenusParImmeuble.map((i) => ({
            cle: `${i.immeubleId}`,
            libelle: i.immeuble,
            detail: i.logements ? `${i.logements} logements` : undefined,
            montant: i.montant,
          }))}
        />
        <Repartition
          titre="Revenus par moyen de paiement"
          sousTitre="Comment vos locataires paient"
          total={r.totalEncaisse}
          lignes={r.revenusParMoyen.map((m) => ({ cle: m.moyen, libelle: libellesMoyen[m.moyen], montant: m.montant }))}
        />
      </div>
    </section>
  );
}

function Repartition({
  titre,
  sousTitre,
  total,
  lignes,
}: {
  titre: string;
  sousTitre: string;
  total: number;
  lignes: { cle: string; libelle: string; detail?: string; montant: number }[];
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900">{titre}</h2>
      <p className="text-sm text-gray-500">{sousTitre}</p>
      {lignes.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">Aucun paiement sur la période.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {lignes.map((l) => {
            const part = total ? (l.montant / total) * 100 : 0;
            return (
              <li key={l.cle}>
                <div className="flex flex-wrap justify-between gap-x-3 text-sm">
                  <span className="font-medium text-gray-700">
                    {l.libelle} {l.detail && <span className="font-normal text-gray-400">· {l.detail}</span>}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {fcfa(l.montant)} · {Math.round(part)} %
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${part}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
