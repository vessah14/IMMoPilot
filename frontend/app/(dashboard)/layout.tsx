import CoqueAdmin from "@/components/layout/CoqueAdmin";
import BandeauAbonnement from "@/components/dashboard/BandeauAbonnement";
import { horodatageServeur, utilisateurConnecte } from "@/lib/api-serveur";

// Espace bailleur / gestionnaire (/admin) : réservé aux comptes connectés
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const moi = await utilisateurConnecte(); // redirige vers /connexion si la session est invalide

  return (
    <CoqueAdmin
      utilisateur={{ nom: moi.nomComplet, structure: moi.nomStructure }}
      alertesNonLues={moi.notificationsNonLues}
    >
      <BandeauAbonnement etat={moi.etatAbonnement} finAbonnement={moi.finAbonnement} maintenant={horodatageServeur()} />
      {children}
    </CoqueAdmin>
  );
}
