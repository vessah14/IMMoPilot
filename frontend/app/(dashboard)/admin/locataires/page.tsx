import { Users, CircleCheck, CircleAlert, CalendarClock } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { EnTetePage } from "@/components/dashboard/Filtres";
import AjouterLocataire from "@/components/dashboard/AjouterLocataire";
import ListeLocataires from "@/components/dashboard/ListeLocataires";
import { AlerteLimite, BoutonAjoutLimite } from "@/components/dashboard/LimiteFormule";
import BoutonExport from "@/components/ui/BoutonExport";
import { apiPublic, apiServeur, utilisateurConnecte } from "@/lib/api-serveur";
import { infosLimite } from "@/lib/limites";
import { dateCourte } from "@/lib/format";
import type { Locataire, Logement, Offre } from "@/lib/types";

const libellesSituation = { AJour: "À jour", Retard: "En retard", Impaye: "Impayé" } as const;

export default async function Locataires() {
  const [locataires, vacants, moi, offre] = await Promise.all([
    apiServeur<Locataire[]>("/locataires"),
    apiServeur<Logement[]>("/logements?statut=Vacant"),
    utilisateurConnecte(),
    apiPublic<Offre>("/offre", 300),
  ]);
  const limiteFormule = infosLimite(moi, offre, "locataires");

  const actuels = locataires.filter((l) => l.logementId !== null);
  const aJour = actuels.filter((l) => l.situation === "AJour").length;
  const enDifficulte = actuels.filter((l) => l.situation !== "AJour");

  // Baux qui se terminent dans les 60 prochains jours (calculé à chaque chargement de la page)
  const dans60Jours = new Date();
  dans60Jours.setDate(dans60Jours.getDate() + 60);
  const limite = dans60Jours.toISOString().slice(0, 10);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const bauxBientotFinis = actuels.filter((l) => l.finBail >= aujourdhui && l.finBail <= limite).length;

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage titre="Locataires" sousTitre="Suivez vos locataires, leurs baux et l'état de leurs paiements.">
        <BoutonExport
          nomFichier="locataires"
          entetes={["Nom", "E-mail", "Téléphone", "Logement", "Début du bail", "Fin du bail", "Loyer (FCFA)", "Caution (FCFA)", "Paiement"]}
          lignes={locataires.map((l) => [
            l.nomComplet,
            l.email,
            l.telephone,
            l.logement,
            dateCourte(l.debutBail),
            dateCourte(l.finBail),
            l.loyer,
            l.caution,
            l.logementId !== null ? libellesSituation[l.situation] : "Parti",
          ])}
        />
        <BoutonAjoutLimite infos={limiteFormule}>
          <AjouterLocataire
            logementsVacants={vacants.map((l) => ({ id: l.id, libelle: `${l.reference} — ${l.immeuble}`, loyer: l.loyer }))}
          />
        </BoutonAjoutLimite>
      </EnTetePage>

      <AlerteLimite infos={limiteFormule} />

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <CarteStat titre="Locataires actuels" icon={Users} couleur="bg-blue-100 text-blue-600">
          <p className="text-3xl font-bold">{actuels.length}</p>
          <p className="text-sm text-gray-500">occupent un logement</p>
        </CarteStat>

        <CarteStat titre="À jour de paiement" icon={CircleCheck} couleur="bg-green-100 text-green-600">
          <p className="text-3xl font-bold">{aJour}</p>
          <p className="text-sm text-gray-500">
            {actuels.length ? Math.round((aJour / actuels.length) * 100) : 0} % des locataires
          </p>
        </CarteStat>

        <CarteStat titre="En retard ou impayés" icon={CircleAlert} couleur="bg-red-100 text-red-600">
          <p className="text-3xl font-bold">{enDifficulte.length}</p>
          <p className="text-sm text-gray-500">à relancer depuis la page Loyers</p>
        </CarteStat>

        <CarteStat titre="Baux à renouveler" icon={CalendarClock} couleur="bg-orange-100 text-orange-600">
          <p className="text-3xl font-bold">{bauxBientotFinis}</p>
          <p className="text-sm text-gray-500">se terminent dans les 60 jours</p>
        </CarteStat>
      </div>

      <ListeLocataires
        locataires={locataires}
        logementsVacants={vacants.map((l) => ({ id: l.id, libelle: `${l.reference} — ${l.immeuble}`, loyer: l.loyer }))}
        compteEncaissement={moi.compteEncaissement}
      />
    </section>
  );
}
