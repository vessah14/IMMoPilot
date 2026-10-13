import { LayoutGrid, KeyRound, Wallet, Building2 } from "lucide-react";
import AjouterImmeuble from "@/components/dashboard/AjouterImmeuble";
import CarteStat from "@/components/dashboard/CarteStat";
import ListeImmeubles from "@/components/dashboard/ListeImmeubles";
import { AlerteLimite, BoutonAjoutLimite } from "@/components/dashboard/LimiteFormule";
import BoutonExport from "@/components/ui/BoutonExport";
import { apiPublic, apiServeur, utilisateurConnecte } from "@/lib/api-serveur";
import { infosLimite } from "@/lib/limites";
import { fcfa, libellesTypeImmeuble } from "@/lib/format";
import type { Immeuble, Logement, Offre } from "@/lib/types";

export default async function Immeubles() {
  const [moi, immeubles, logements, offre] = await Promise.all([
    utilisateurConnecte(),
    apiServeur<Immeuble[]>("/immeubles"),
    apiServeur<Logement[]>("/logements"),
    apiPublic<Offre>("/offre", 300), // prix et limites des formules, pour proposer la formule supérieure
  ]);
  const limite = infosLimite(moi, offre, "immeubles");

  const totalLots = logements.length;
  const occupes = logements.filter((l) => l.statut === "Occupe");
  const vacants = logements.filter((l) => l.statut === "Vacant").length;
  const tauxOccupation = totalLots ? (occupes.length / totalLots) * 100 : 0;
  const loyersAttendus = occupes.reduce((s, l) => s + l.loyer, 0);
  const { immeubles: utilises, limiteImmeubles } = moi.utilisation;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500">Mes immeubles</h1>
          <p className="mt-2 max-w-2xl text-base text-gray-500">
            Supervisez les performances locatives et les unités de gestion de l&apos;ensemble de votre parc.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <BoutonExport
            nomFichier="immeubles"
            entetes={["Nom", "Type", "Adresse", "Quartier", "Ville", "Logements", "Occupés"]}
            lignes={immeubles.map((i) => [
              i.nom,
              libellesTypeImmeuble[i.type],
              i.adresse,
              i.quartier,
              i.ville,
              i.nombreLogements,
              i.logementsOccupes,
            ])}
          />
          <BoutonAjoutLimite infos={limite}>
            <AjouterImmeuble />
          </BoutonAjoutLimite>
        </div>
      </div>

      <AlerteLimite infos={limite} />

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Lots totaux sous gestion" icon={LayoutGrid} couleur="bg-blue-100 text-blue-600">
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-bold whitespace-nowrap">{totalLots}</span>
            <span className="text-sm text-gray-500">logements</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-600" />
              {occupes.length} occupés
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gray-300" />
              {vacants} vacants
            </span>
          </p>
        </CarteStat>

        <CarteStat titre="Taux d'occupation global" icon={KeyRound} couleur="bg-indigo-100 text-indigo-600">
          <p className="text-3xl font-bold whitespace-nowrap">{tauxOccupation.toFixed(1)} %</p>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${tauxOccupation}%` }} />
          </div>
        </CarteStat>

        <CarteStat titre="Loyers mensuels attendus" icon={Wallet} couleur="bg-green-100 text-green-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(loyersAttendus)}</p>
          <p className="text-sm text-gray-500">sur les logements occupés</p>
        </CarteStat>

        <CarteStat titre="Immeubles autorisés" icon={Building2} couleur="bg-teal-100 text-teal-600">
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-bold whitespace-nowrap">
              {utilises} / {limiteImmeubles ?? "∞"}
            </span>
            <span className="text-sm text-gray-500">formule {moi.formule}</span>
          </p>
          {limiteImmeubles !== null && (
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(limiteImmeubles, 15) }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < utilises ? "bg-teal-600" : "bg-gray-100"}`}
                />
              ))}
            </div>
          )}
        </CarteStat>
      </div>

      <ListeImmeubles immeubles={immeubles} />
    </section>
  );
}
