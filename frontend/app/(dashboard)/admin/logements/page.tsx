import { House, CircleCheck, DoorOpen, Wallet } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import AjouterLogement from "@/components/dashboard/AjouterLogement";
import ListeLogements from "@/components/dashboard/ListeLogements";
import BoutonExport from "@/components/ui/BoutonExport";
import { apiServeur } from "@/lib/api-serveur";
import { fcfa, libellesTypeLogement } from "@/lib/format";
import type { Immeuble, Logement } from "@/lib/types";

export default async function Logements() {
  const [logements, immeubles] = await Promise.all([
    apiServeur<Logement[]>("/logements"),
    apiServeur<Immeuble[]>("/immeubles"),
  ]);

  const occupes = logements.filter((l) => l.statut === "Occupe");
  const vacants = logements.filter((l) => l.statut === "Vacant").length;
  const enTravaux = logements.filter((l) => l.statut === "Travaux").length;
  const tauxOccupation = logements.length ? (occupes.length / logements.length) * 100 : 0;
  const loyersOccupes = occupes.reduce((s, l) => s + l.loyer, 0);
  const loyerMoyen = logements.length ? logements.reduce((s, l) => s + l.loyer, 0) / logements.length : 0;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500">Logements & Lots</h1>
          <p className="mt-2 text-gray-500">
            {logements.length} logement{logements.length > 1 ? "s" : ""} au total, répartis sur {immeubles.length} immeuble
            {immeubles.length > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <BoutonExport
            nomFichier="logements"
            entetes={["Référence", "Immeuble", "Type", "Étage", "Surface (m²)", "Loyer (FCFA)", "Charges (FCFA)", "Statut", "Locataire"]}
            lignes={logements.map((l) => [
              l.reference,
              l.immeuble,
              libellesTypeLogement[l.type],
              l.etage,
              l.surface,
              l.loyer,
              l.charges,
              l.statut,
              l.locataire,
            ])}
          />
          {immeubles.length > 0 && <AjouterLogement immeubles={immeubles.map((i) => ({ id: i.id, nom: i.nom }))} />}
        </div>
      </div>

      {immeubles.length === 0 && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900">
          Ajoutez d&apos;abord un immeuble dans la page <strong>Immeubles</strong> : vous pourrez ensuite y créer des logements.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Total des logements" icon={House} couleur="bg-blue-100 text-blue-600">
          <p className="text-3xl font-bold">{logements.length}</p>
          <p className="text-sm text-gray-500">sur {immeubles.length} immeubles</p>
        </CarteStat>

        <CarteStat titre="Logements occupés" icon={CircleCheck} couleur="bg-green-100 text-green-600">
          <p className="text-3xl font-bold">{occupes.length}</p>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-green-600" style={{ width: `${tauxOccupation}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-600">{Math.round(tauxOccupation)} %</span>
          </div>
        </CarteStat>

        <CarteStat titre="Logements disponibles" icon={DoorOpen} couleur="bg-indigo-100 text-indigo-600">
          <p className="text-3xl font-bold">{vacants}</p>
          <p className="text-sm text-gray-500">vacants · {enTravaux} en travaux</p>
        </CarteStat>

        <CarteStat titre="Loyers des logements occupés" icon={Wallet} couleur="bg-teal-100 text-teal-600">
          <p className="text-2xl font-bold whitespace-nowrap">{fcfa(loyersOccupes)}</p>
          <p className="text-sm text-gray-500">Loyer moyen : {fcfa(loyerMoyen)}</p>
        </CarteStat>
      </div>

      <ListeLogements logements={logements} />
    </section>
  );
}
