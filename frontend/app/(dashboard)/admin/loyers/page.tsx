import { EnTetePage } from "@/components/dashboard/Filtres";
import SuiviLoyers from "@/components/dashboard/SuiviLoyers";
import BoutonExport from "@/components/ui/BoutonExport";
import { apiServeur, utilisateurConnecte } from "@/lib/api-serveur";
import { moisActuel, nomMois } from "@/lib/format";
import type { Echeance } from "@/lib/types";

const libellesStatut = { Paye: "Payé", Partiel: "Partiel", EnAttente: "En attente", Impaye: "Impayé" } as const;

export default async function Loyers() {
  const mois = moisActuel();
  const [echeances, moi] = await Promise.all([apiServeur<Echeance[]>(`/loyers?mois=${mois}`), utilisateurConnecte()]);
  // Signature des messages de relance
  const signature = [moi.nomStructure ?? moi.nomComplet, moi.telephone].join("\n");

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage titre="Loyers" sousTitre="Suivez les loyers attendus et encaissés, mois par mois.">
        <BoutonExport
          nomFichier={`loyers-${mois.slice(0, 7)}`}
          label={`Exporter ${nomMois(mois)}`}
          entetes={["Locataire", "Logement", "Dû (FCFA)", "Payé (FCFA)", "Statut"]}
          lignes={echeances.map((e) => [e.locataire, e.logement, e.du, e.paye, libellesStatut[e.statut]])}
        />
      </EnTetePage>

      <SuiviLoyers initiales={echeances} moisCourant={mois} signature={signature} />
    </section>
  );
}
