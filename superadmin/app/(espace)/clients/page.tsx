import type { Metadata } from "next";
import { EnTetePage } from "@/components/dashboard/Filtres";
import ListeClients from "@/components/superadmin/ListeClients";
import BoutonExport from "@/components/ui/BoutonExport";
import { statutsClient } from "@/components/superadmin/libelles";
import { apiAdmin } from "@/lib/api-serveur";
import { dateCourte } from "@/lib/format";
import type { Client } from "@/lib/types";

export const metadata: Metadata = { title: "Clients" };

export default async function Clients() {
  const clients = await apiAdmin<Client[]>("/clients");

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage titre="Clients" sousTitre="Tous les bailleurs et agences inscrits sur IMMO PILOT.">
        <BoutonExport
          nomFichier="clients"
          entetes={["Client", "Contact", "E-mail", "Téléphone", "Ville", "Formule", "Statut", "Immeubles", "Locataires", "Inscription"]}
          lignes={clients.map((c) => [
            c.nom,
            c.contact,
            c.email,
            c.telephone,
            c.ville,
            c.formule,
            statutsClient[c.statut].label,
            c.immeubles,
            c.locataires,
            dateCourte(c.dateInscription),
          ])}
        />
      </EnTetePage>

      <ListeClients clients={clients} />
    </section>
  );
}
