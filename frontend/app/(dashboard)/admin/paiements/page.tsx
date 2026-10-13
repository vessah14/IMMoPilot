import { Wallet, Receipt, Clock, Smartphone } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { EnTetePage } from "@/components/dashboard/Filtres";
import AjouterPaiement from "@/components/dashboard/AjouterPaiement";
import ListePaiements from "@/components/dashboard/ListePaiements";
import BoutonExport from "@/components/ui/BoutonExport";
import { apiServeur } from "@/lib/api-serveur";
import { fcfa, dateCourte, nomMois, libellesMoyen, moisActuel } from "@/lib/format";
import type { Locataire, MoyenPaiement, Paiement } from "@/lib/types";

const libellesStatut = { Confirme: "Confirmé", EnAttente: "En attente", Echoue: "Échoué" } as const;

export default async function Paiements() {
  const [paiements, locataires] = await Promise.all([
    apiServeur<Paiement[]>("/paiements"),
    apiServeur<Locataire[]>("/locataires"),
  ]);

  const confirmes = paiements.filter((p) => p.statut === "Confirme");
  const mois = moisActuel().slice(0, 7); // "2026-09"
  const ceMois = confirmes.filter((p) => p.datePaiement.startsWith(mois));
  const encaisseCeMois = ceMois.reduce((s, p) => s + p.montant, 0);
  const enAttente = paiements.filter((p) => p.statut === "EnAttente");
  const echoues = paiements.filter((p) => p.statut === "Echoue").length;

  // Montant confirmé par moyen de paiement
  const totalConfirme = confirmes.reduce((s, p) => s + p.montant, 0);
  const parMoyen = (Object.keys(libellesMoyen) as MoyenPaiement[])
    .map((m) => ({ moyen: m, total: confirmes.filter((p) => p.moyen === m).reduce((s, p) => s + p.montant, 0) }))
    .sort((a, b) => b.total - a.total);
  const mobile = parMoyen.filter((m) => m.moyen === "OrangeMoney" || m.moyen === "MtnMomo").reduce((s, m) => s + m.total, 0);
  const partMobile = totalConfirme ? Math.round((mobile / totalConfirme) * 100) : 0;

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage titre="Paiements" sousTitre="Historique de tous les paiements reçus de vos locataires.">
        <BoutonExport
          nomFichier="paiements"
          entetes={["Date", "Locataire", "Logement", "Mois payé", "Moyen", "Référence", "Statut", "Montant (FCFA)"]}
          lignes={paiements.map((p) => [
            dateCourte(p.datePaiement),
            p.locataire,
            p.logement,
            nomMois(p.periode),
            libellesMoyen[p.moyen],
            p.reference,
            libellesStatut[p.statut],
            p.montant,
          ])}
        />
        {locataires.length > 0 && (
          <AjouterPaiement
            locataires={locataires
              .filter((l) => l.logementId !== null)
              .map((l) => ({ id: l.id, libelle: `${l.nomComplet} — ${l.logement}`, loyer: l.loyer }))}
          />
        )}
      </EnTetePage>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Encaissé ce mois" icon={Wallet} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(encaisseCeMois)}</p>
          <p className="text-sm text-gray-500">{ceMois.length} paiements confirmés</p>
        </CarteStat>
        <CarteStat titre="En attente de confirmation" icon={Clock} couleur="bg-orange-100 text-orange-600">
          <p className="text-3xl font-bold">{enAttente.length}</p>
          <p className="text-sm text-gray-500">{fcfa(enAttente.reduce((s, p) => s + p.montant, 0))}</p>
        </CarteStat>
        <CarteStat titre="Paiements échoués" icon={Receipt} couleur="bg-red-100 text-red-600">
          <p className="text-3xl font-bold">{echoues}</p>
          <p className="text-sm text-gray-500">à vérifier avec le locataire</p>
        </CarteStat>
        <CarteStat titre="Paiements mobiles" icon={Smartphone} couleur="bg-blue-100 text-blue-600">
          <p className="text-3xl font-bold">{partMobile} %</p>
          <p className="text-sm text-gray-500">des montants via Orange Money ou MTN MoMo</p>
        </CarteStat>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2">
          <ListePaiements paiements={paiements} />
        </div>

        {/* Répartition par moyen de paiement */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900">Répartition par moyen</h2>
          <p className="text-sm text-gray-500">Montants confirmés, tous mois confondus</p>
          <ul className="mt-5 flex flex-col gap-4">
            {parMoyen.map((m) => (
              <li key={m.moyen}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-700">{libellesMoyen[m.moyen]}</span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {fcfa(m.total)} · {totalConfirme ? Math.round((m.total / totalConfirme) * 100) : 0} %
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${totalConfirme ? (m.total / totalConfirme) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
