"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import Input, { styleChamp } from "@/components/ui/Input";
import FormulaireModal from "@/components/ui/FormulaireModal";
import { apiClient } from "@/lib/api-client";
import { fcfa } from "@/lib/format";

type LogementVacant = { id: number; libelle: string; loyer: number };

export default function AjouterLocataire({ logementsVacants }: { logementsVacants: LogementVacant[] }) {
  // Le loyer est prérempli avec celui du logement choisi (modifiable)
  const [loyer, setLoyer] = useState("");

  const enregistrer = async (d: FormData) => {
    await apiClient("/locataires", {
      methode: "POST",
      corps: {
        nomComplet: d.get("nom"),
        email: d.get("email"),
        telephone: d.get("telephone"),
        logementId: Number(d.get("logement")),
        debutBail: d.get("debutBail"),
        finBail: d.get("finBail"),
        loyer: Number(d.get("loyer")),
        caution: Number(d.get("caution") || 0),
      },
    });
    setLoyer("");
  };

  return (
    <FormulaireModal
      boutonLabel="Ajouter un locataire"
      boutonIcon={UserPlus}
      titre="Ajouter un locataire"
      labelEnvoi="Enregistrer le locataire"
      onEnvoyer={enregistrer}
    >
      <Input id="nom" label="Nom complet" placeholder="ex : Jean Dupont" required />
      <Input id="telephone" label="Téléphone" type="tel" placeholder="ex : 677 12 34 56" required />
      <div className="sm:col-span-2">
        <Input id="email" label="Adresse e-mail" type="email" placeholder="ex : jean@gmail.com" required />
      </div>
      <div className="sm:col-span-2 w-full space-y-2">
        <label htmlFor="logement" className="block text-sm font-medium text-gray-700">
          Logement attribué <span className="text-red-500">*</span>
        </label>
        <select
          id="logement"
          name="logement"
          required
          defaultValue=""
          className={styleChamp}
          onChange={(e) => {
            const choisi = logementsVacants.find((l) => String(l.id) === e.target.value);
            if (choisi) setLoyer(String(choisi.loyer));
          }}
        >
          <option value="" disabled>
            {logementsVacants.length ? "Choisir un logement vacant…" : "Aucun logement vacant"}
          </option>
          {logementsVacants.map((l) => (
            <option key={l.id} value={l.id}>
              {l.libelle} — {fcfa(l.loyer)}
            </option>
          ))}
        </select>
      </div>
      <Input id="debutBail" label="Début du bail" type="date" required />
      <Input id="finBail" label="Fin du bail" type="date" required />
      <Input
        id="loyer"
        label="Loyer mensuel (FCFA)"
        type="number"
        min={0}
        placeholder="ex : 85000"
        required
        value={loyer}
        onChange={(e) => setLoyer(e.target.value)}
      />
      <Input id="caution" label="Caution (FCFA)" type="number" min={0} placeholder="ex : 170000" />
    </FormulaireModal>
  );
}
