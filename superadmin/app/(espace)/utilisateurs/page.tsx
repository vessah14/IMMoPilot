import type { Metadata } from "next";
import { Users, CircleCheck, Ban } from "lucide-react";
import CarteStat from "@/components/dashboard/CarteStat";
import { EnTetePage } from "@/components/dashboard/Filtres";
import ListeUtilisateurs from "@/components/superadmin/ListeUtilisateurs";
import BoutonExport from "@/components/ui/BoutonExport";
import { apiAdmin, superAdminConnecte } from "@/lib/api-serveur";
import { dateCourte } from "@/lib/format";
import type { UtilisateurAdmin } from "@/lib/types";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function Utilisateurs() {
  const [moi, utilisateurs] = await Promise.all([superAdminConnecte(), apiAdmin<UtilisateurAdmin[]>("/utilisateurs")]);
  const actifs = utilisateurs.filter((u) => u.actif).length;

  return (
    <section className="flex flex-col gap-8">
      <EnTetePage titre="Utilisateurs" sousTitre="Toutes les personnes qui se connectent à IMMO PILOT.">
        <BoutonExport
          nomFichier="utilisateurs"
          entetes={["Nom", "E-mail", "Structure", "Rôle", "Actif", "Dernière connexion", "Inscription"]}
          lignes={utilisateurs.map((u) => [
            u.nomComplet,
            u.email,
            u.structure,
            u.role,
            u.actif ? "Oui" : "Non",
            u.derniereConnexion ? dateCourte(u.derniereConnexion) : "",
            dateCourte(u.dateInscription),
          ])}
        />
      </EnTetePage>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CarteStat titre="Comptes utilisateurs" icon={Users} couleur="bg-blue-100 text-blue-600">
          <p className="text-3xl font-bold">{utilisateurs.length}</p>
        </CarteStat>
        <CarteStat titre="Actifs" icon={CircleCheck} couleur="bg-green-100 text-green-600">
          <p className="text-3xl font-bold">{actifs}</p>
        </CarteStat>
        <CarteStat titre="Bloqués" icon={Ban} couleur="bg-red-100 text-red-600">
          <p className="text-3xl font-bold">{utilisateurs.length - actifs}</p>
        </CarteStat>
      </div>

      <ListeUtilisateurs utilisateurs={utilisateurs} moiId={moi.id} />
    </section>
  );
}
