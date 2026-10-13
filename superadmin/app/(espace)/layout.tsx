import CoqueSuperAdmin from "@/components/layout/CoqueSuperAdmin";
import { apiAdmin, superAdminConnecte } from "@/lib/api-serveur";
import type { Ticket } from "@/lib/types";

// Pages réservées au super administrateur connecté
export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const [moi, tickets] = await Promise.all([superAdminConnecte(), apiAdmin<Ticket[]>("/tickets")]);
  const urgents = tickets.filter((t) => t.priorite === "Haute" && t.statut !== "Resolu").length;

  return (
    <CoqueSuperAdmin nom={moi.nomComplet} ticketsUrgents={urgents}>
      {children}
    </CoqueSuperAdmin>
  );
}
