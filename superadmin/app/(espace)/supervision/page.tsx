import type { Metadata } from "next";
import { EnTetePage } from "@/components/dashboard/Filtres";
import TableauSupervision from "@/components/superadmin/TableauSupervision";
import { apiAdmin } from "@/lib/api-serveur";
import type { Supervision as EtatSupervision } from "@/lib/types";

export const metadata: Metadata = { title: "Supervision" };

// État de l'API en temps réel : premier affichage côté serveur, puis actualisation toutes les 5 secondes
export default async function Supervision() {
  const etat = await apiAdmin<EtatSupervision>("/supervision");

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage
        titre="Supervision"
        sousTitre="État de l'API, paiements, reversements et journal des événements en direct."
      />
      <TableauSupervision initial={etat} />
    </section>
  );
}
