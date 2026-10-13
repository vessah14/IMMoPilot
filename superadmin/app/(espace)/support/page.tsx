import type { Metadata } from "next";
import { LifeBuoy, CircleAlert, CircleCheck } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { EnTetePage } from "@/components/dashboard/Filtres";
import ListeTickets from "@/components/superadmin/ListeTickets";
import { apiAdmin } from "@/lib/api-serveur";
import type { Ticket } from "@/lib/types";

export const metadata: Metadata = { title: "Support" };

export default async function Support() {
  const tickets = await apiAdmin<Ticket[]>("/tickets");
  const nonResolus = tickets.filter((t) => t.statut !== "Resolu");
  const urgents = nonResolus.filter((t) => t.priorite === "Haute").length;

  return (
    <section className="flex flex-col gap-8 max-w-5xl">
      <EnTetePage titre="Support" sousTitre="Les demandes d'aide envoyées par les clients depuis leurs paramètres." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CarteStat titre="Tickets à traiter" icon={LifeBuoy} couleur="bg-blue-100 text-blue-600">
          <p className="text-3xl font-bold">{nonResolus.length}</p>
        </CarteStat>
        <CarteStat titre="Priorité haute" icon={CircleAlert} couleur="bg-red-100 text-red-600">
          <p className="text-3xl font-bold">{urgents}</p>
        </CarteStat>
        <CarteStat titre="Résolus" icon={CircleCheck} couleur="bg-green-100 text-green-600">
          <p className="text-3xl font-bold">{tickets.length - nonResolus.length}</p>
        </CarteStat>
      </div>

      <ListeTickets tickets={tickets} />
    </section>
  );
}
