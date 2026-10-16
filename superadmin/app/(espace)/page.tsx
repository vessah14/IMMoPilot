import Link from "next/link";
import { Briefcase, BadgeDollarSign, Hourglass, Building2, ArrowRight } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import GraphiqueRevenus from "@/components/ui/GraphiqueRevenus";
import { Badge } from "@/components/dashboard/Filtres";
import { statutsClient } from "@/components/superadmin/libelles";
import { apiAdmin, superAdminConnecte } from "@/lib/api-serveur";
import { fcfa, dateCourte, moisCourt } from "@/lib/format";
import type { Statistiques } from "@/lib/types";

export default async function VueEnsemblePlateforme() {
  const [moi, s] = await Promise.all([superAdminConnecte(), apiAdmin<Statistiques>("/statistiques")]);

  const totalFormules = s.formules.reduce((t, f) => t + f.actifs + f.essais, 0);

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500">Bonjour {moi.nomComplet.split(" ")[0]} 👋</h1>
        <p className="mt-2 text-gray-500">L&apos;état de la plateforme IMMO PILOT en un coup d&apos;œil.</p>
      </div>

      {s.ticketsUrgents > 0 && (
        <Link
          href="/support"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 hover:bg-red-100 transition"
        >
          <span>
            <span className="font-semibold">
              {s.ticketsUrgents} ticket{s.ticketsUrgents > 1 ? "s" : ""} urgent{s.ticketsUrgents > 1 ? "s" : ""}
            </span>{" "}
            attend{s.ticketsUrgents > 1 ? "ent" : ""} une réponse du support.
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Clients actifs" icon={Briefcase} couleur="bg-blue-100 text-blue-600">
          <p className="text-3xl font-bold">{s.clientsActifs}</p>
          <p className="text-sm text-gray-500">
            sur {s.clients} comptes inscrits · {s.suspendus} suspendu{s.suspendus > 1 ? "s" : ""}
          </p>
        </CarteStat>
        <CarteStat titre="Revenu mensuel récurrent" icon={BadgeDollarSign} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(s.revenuMensuelRecurrent)}</p>
          <p className="text-sm text-gray-500">{fcfa(s.encaisseCeMois)} encaissés ce mois-ci</p>
        </CarteStat>
        <CarteStat titre="Essais en cours" icon={Hourglass} couleur="bg-indigo-100 text-indigo-600">
          <p className="text-3xl font-bold">{s.essais}</p>
          <p className="text-sm text-gray-500">à convertir en abonnés payants</p>
        </CarteStat>
        <CarteStat titre="Biens gérés sur la plateforme" icon={Building2} couleur="bg-teal-100 text-teal-600">
          <p className="text-3xl font-bold">{s.immeubles}</p>
          <p className="text-sm text-gray-500">immeubles · {s.locataires} locataires</p>
        </CarteStat>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Abonnements encaissés</h2>
          <p className="text-sm text-gray-500">Paiements d&apos;abonnement reçus chaque mois (SasPay et manuels)</p>
        </div>
        <div className="p-5">
          <GraphiqueRevenus donnees={s.encaissements12Mois.map((m) => ({ mois: moisCourt(m.mois), montant: m.montant }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <h2 className="font-semibold text-gray-900">Dernières inscriptions</h2>
            <Link href="/clients" className="text-sm font-medium text-blue-600 hover:underline">
              Voir tous les clients
            </Link>
          </div>
          {s.dernieresInscriptions.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-gray-500">Aucun client inscrit pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {s.dernieresInscriptions.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{c.nom}</p>
                    <p className="text-sm text-gray-500">
                      {c.ville ?? "—"} · formule {c.formule} · inscrit le {dateCourte(c.dateInscription)}
                    </p>
                  </div>
                  <Badge {...statutsClient[c.statut]} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900">Clients par formule</h2>
          <p className="text-sm text-gray-500">Comptes actifs et en essai</p>
          <ul className="mt-5 flex flex-col gap-4">
            {s.formules.map((f) => {
              const nombre = f.actifs + f.essais;
              return (
                <li key={f.formule}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{f.formule}</span>
                    <span className="text-gray-500">
                      {nombre} client{nombre > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${totalFormules ? (nombre / totalFormules) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
