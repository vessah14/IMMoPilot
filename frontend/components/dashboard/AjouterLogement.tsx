"use client";

import { Plus } from "lucide-react";
import Input from "@/components/ui/Input";
import FormulaireModal, { ChampSelect } from "@/components/ui/FormulaireModal";
import ChampsBeneficiaire from "@/components/dashboard/ChampsBeneficiaire";
import { apiClient } from "@/lib/api-client";
import { libellesTypeLogement } from "@/lib/format";

export default function AjouterLogement({ immeubles }: { immeubles: { id: number; nom: string }[] }) {
  const enregistrer = async (d: FormData) => {
    await apiClient("/logements", {
      methode: "POST",
      corps: {
        immeubleId: Number(d.get("immeuble")),
        reference: d.get("reference"),
        type: d.get("type"),
        etage: Number(d.get("etage")),
        surface: Number(d.get("surface")),
        loyer: Number(d.get("loyer")),
        charges: Number(d.get("charges") || 0),
        statut: d.get("statut"),
        beneficiaireNom: d.get("beneficiaireNom") || null,
        beneficiaireCompte: d.get("beneficiaireCompte") || null,
      },
    });
  };

  return (
    <FormulaireModal
      boutonLabel="Ajouter un logement"
      boutonIcon={Plus}
      titre="Ajouter un logement"
      labelEnvoi="Enregistrer le logement"
      onEnvoyer={enregistrer}
    >
      <ChampSelect id="immeuble" label="Immeuble" options={immeubles.map((i) => ({ valeur: String(i.id), texte: i.nom }))} />
      <Input id="reference" label="Référence" placeholder="ex : A-12" required />
      <ChampSelect
        id="type"
        label="Type"
        options={Object.entries(libellesTypeLogement).map(([valeur, texte]) => ({ valeur, texte }))}
      />
      <Input id="etage" label="Étage (0 = RDC)" type="number" min={0} placeholder="ex : 2" required />
      <Input id="surface" label="Surface (m²)" type="number" min={1} step="0.01" placeholder="ex : 45" required />
      <Input id="loyer" label="Loyer mensuel (FCFA)" type="number" min={0} placeholder="ex : 85000" required />
      <Input id="charges" label="Charges mensuelles (FCFA)" type="number" min={0} placeholder="ex : 5000" />
      <ChampSelect
        id="statut"
        label="Statut"
        options={[
          { valeur: "Vacant", texte: "Vacant" },
          { valeur: "Travaux", texte: "En travaux" },
        ]}
      />
      <ChampsBeneficiaire aide="Laissez vide pour utiliser le propriétaire de l'immeuble, ou à défaut votre numéro (Paramètres → Agence)." />
    </FormulaireModal>
  );
}
