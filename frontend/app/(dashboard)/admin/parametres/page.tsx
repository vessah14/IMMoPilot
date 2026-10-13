import ParametresCompte from "@/components/dashboard/ParametresCompte";
import { apiServeur, utilisateurConnecte } from "@/lib/api-serveur";
import type { Abonnement, Formule, Ticket } from "@/lib/types";

// ?onglet=abonnement ouvre directement l'onglet demandé (lien du bandeau de renouvellement)
// ?formule=Pro présélectionne la formule à payer ; ?bienvenue=1 : on arrive juste après l'inscription
export default async function Parametres({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; formule?: string; bienvenue?: string }>;
}) {
  const { onglet, formule, bienvenue } = await searchParams;
  const [moi, tickets, abonnement] = await Promise.all([
    utilisateurConnecte(),
    apiServeur<Ticket[]>("/support"),
    apiServeur<Abonnement>("/abonnement"),
  ]);

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500">Paramètres</h1>
        <p className="mt-2 text-gray-500">Gérez votre compte, votre agence et votre abonnement.</p>
      </div>

      <ParametresCompte
        moi={moi}
        tickets={tickets}
        abonnement={abonnement}
        ongletInitial={onglet}
        formuleInitiale={abonnement.offres.find((o) => o.formule === formule)?.formule as Formule | undefined}
        bienvenue={bienvenue === "1"}
      />
    </section>
  );
}
