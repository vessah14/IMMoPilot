import type { Metadata } from "next";
import { EnTetePage } from "@/components/dashboard/Filtres";
import FormulaireParametres from "@/components/superadmin/FormulaireParametres";
import ChangerMotDePasse from "@/components/superadmin/ChangerMotDePasse";
import { apiAdmin } from "@/lib/api-serveur";
import type { Parametres } from "@/lib/types";

export const metadata: Metadata = { title: "Paramètres" };

export default async function ParametresPlateforme() {
  const parametres = await apiAdmin<Parametres>("/parametres");

  return (
    <section className="flex flex-col gap-8 max-w-3xl">
      <EnTetePage titre="Paramètres" sousTitre="Réglages de la plateforme IMMO PILOT pour tous les clients." />
      <FormulaireParametres parametres={parametres} />
      <ChangerMotDePasse />
    </section>
  );
}
