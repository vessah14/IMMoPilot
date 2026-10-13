import Link from "next/link";
import { Building2, House, CircleAlert, Wallet, Clock, ArrowRight } from "lucide-react";
import GraphiqueRevenus from "@/components/ui/GraphiqueRevenus";
import { apiServeur, utilisateurConnecte } from "@/lib/api-serveur";
import { fcfa, moisCourt, nomMois, dateCourte } from "@/lib/format";
import type { TableauDeBord } from "@/lib/types";

export default async function VueEnsemble() {
  const [moi, t] = await Promise.all([utilisateurConnecte(), apiServeur<TableauDeBord>("/tableau-de-bord")]);

  const totalImpayes = t.impayes.reduce((s, i) => s + i.montant, 0);
  const totalRetards = t.retards.reduce((s, r) => s + r.montant, 0);
  const totalAnnuel = t.revenus12Mois.reduce((s, r) => s + r.montant, 0);
  const prenom = moi.nomComplet.split(" ")[0];

  const stats = [
    { label: "Immeubles", valeur: String(t.immeubles), icon: Building2, couleur: "bg-blue-100 text-blue-600" },
    {
      label: "Logements occupés",
      valeur: `${t.logementsOccupes} / ${t.logements}`,
      icon: House,
      couleur: "bg-indigo-100 text-indigo-600",
    },
    { label: "Loyers impayés", valeur: fcfa(totalImpayes), icon: CircleAlert, couleur: "bg-red-100 text-red-600" },
    { label: "Encaissé ce mois", valeur: fcfa(t.encaisseCeMois), icon: Wallet, couleur: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Bonjour {prenom}</h1>
        <p className="mt-1 text-gray-600">Le résumé de votre patrimoine et de vos loyers.</p>
      </div>

      {/* Premier pas : aucun immeuble encore */}
      {t.immeubles === 0 && (
        <Link
          href="/admin/immeubles"
          className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900 hover:bg-blue-100 transition"
        >
          <span>
            <span className="font-semibold">Bienvenue !</span> Commencez par ajouter votre premier immeuble.
          </span>
          <ArrowRight className="size-5 shrink-0" />
        </Link>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icone = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className={`size-12 shrink-0 rounded-lg flex items-center justify-center ${stat.couleur}`}>
                <Icone className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold truncate">{stat.valeur}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Évolution des revenus */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-end justify-between gap-2 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold">Évolution des revenus</h2>
            <p className="text-sm text-gray-500">Loyers encaissés sur les 12 derniers mois</p>
          </div>
          <p className="text-sm text-gray-500">
            Total : <span className="font-semibold text-gray-900">{fcfa(totalAnnuel)}</span>
          </p>
        </div>
        <div className="p-5">
          <GraphiqueRevenus donnees={t.revenus12Mois.map((r) => ({ mois: moisCourt(r.mois), montant: r.montant }))} />
        </div>
      </div>

      {/* Tableaux : côte à côte sur grand écran */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableauLoyers
          titre="Loyers impayés"
          icon={CircleAlert}
          style="text-red-600"
          pastille="bg-red-100 text-red-700"
          total={totalImpayes}
          vide="Aucun loyer impayé sur les 3 derniers mois."
          colonnes={["Locataire", "Mois", "Reste dû"]}
          lignes={t.impayes.map((i) => ({
            cle: `${i.locataireId}-${i.mois}`,
            locataire: i.locataire,
            logement: i.logement,
            info: nomMois(i.mois),
            montant: i.montant,
          }))}
        />
        <TableauLoyers
          titre="Loyers en retard"
          icon={Clock}
          style="text-orange-600"
          pastille="bg-orange-100 text-orange-700"
          total={totalRetards}
          vide="Aucun retard pour le mois en cours."
          colonnes={["Locataire", "Retard", "Reste dû"]}
          lignes={t.retards.map((r) => ({
            cle: `${r.locataireId}`,
            locataire: r.locataire,
            logement: r.logement,
            info: `${r.joursRetard} jour${r.joursRetard > 1 ? "s" : ""} (échéance ${dateCourte(r.echeance)})`,
            montant: r.montant,
          }))}
        />
      </div>
    </div>
  );
}

function TableauLoyers({
  titre,
  icon: Icone,
  style,
  pastille,
  total,
  vide,
  colonnes,
  lignes,
}: {
  titre: string;
  icon: React.ComponentType<{ className?: string }>;
  style: string;
  pastille: string;
  total: number;
  vide: string;
  colonnes: string[];
  lignes: { cle: string; locataire: string; logement: string; info: string; montant: number }[];
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icone className={`size-5 ${style}`} />
          <h2 className="font-semibold">{titre}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pastille}`}>{lignes.length}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{fcfa(total)}</p>
      </div>
      {lignes.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{vide}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">{colonnes[0]}</th>
                <th className="px-5 py-3 font-medium">{colonnes[1]}</th>
                <th className="px-5 py-3 font-medium text-right">{colonnes[2]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lignes.map((l) => (
                <tr key={l.cle} className="hover:bg-gray-50">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="font-medium">{l.locataire}</p>
                    <p className="text-xs text-gray-500">{l.logement}</p>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">{l.info}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-medium">{fcfa(l.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-5 py-3 border-t border-gray-100 text-right">
        <Link href="/admin/loyers" className="text-sm font-medium text-blue-600 hover:underline">
          Voir l&apos;échéancier des loyers
        </Link>
      </div>
    </div>
  );
}
