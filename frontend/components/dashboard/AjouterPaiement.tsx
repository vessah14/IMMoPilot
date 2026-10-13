"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Input, { styleChamp } from "@/components/ui/Input";
import FormulaireModal, { ChampSelect } from "@/components/ui/FormulaireModal";
import { apiClient } from "@/lib/api-client";
import { libellesMoyen } from "@/lib/format";

type LocataireChoix = { id: number; libelle: string; loyer: number };

export default function AjouterPaiement({ locataires }: { locataires: LocataireChoix[] }) {
  // Le montant est prérempli avec le loyer du locataire choisi (modifiable)
  const [montant, setMontant] = useState("");
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const enregistrer = async (d: FormData) => {
    await apiClient("/paiements", {
      methode: "POST",
      corps: {
        locataireId: Number(d.get("locataire")),
        montant: Number(d.get("montant")),
        datePaiement: d.get("date"),
        periode: `${d.get("periode")}-01`, // "2026-09" → "2026-09-01"
        moyen: d.get("moyen"),
        reference: d.get("reference") || null,
        statut: d.get("statut"),
      },
    });
    setMontant("");
  };

  return (
    <FormulaireModal
      boutonLabel="Enregistrer un paiement"
      boutonIcon={Plus}
      titre="Enregistrer un paiement"
      labelEnvoi="Enregistrer le paiement"
      onEnvoyer={enregistrer}
    >
      <div className="sm:col-span-2 w-full space-y-2">
        <label htmlFor="locataire" className="block text-sm font-medium text-gray-700">
          Locataire <span className="text-red-500">*</span>
        </label>
        <select
          id="locataire"
          name="locataire"
          required
          defaultValue=""
          className={styleChamp}
          onChange={(e) => {
            const choisi = locataires.find((l) => String(l.id) === e.target.value);
            if (choisi) setMontant(String(choisi.loyer));
          }}
        >
          <option value="" disabled>
            Choisir un locataire…
          </option>
          {locataires.map((l) => (
            <option key={l.id} value={l.id}>
              {l.libelle}
            </option>
          ))}
        </select>
      </div>
      <Input
        id="montant"
        label="Montant (FCFA)"
        type="number"
        min={1}
        placeholder="ex : 85000"
        required
        value={montant}
        onChange={(e) => setMontant(e.target.value)}
      />
      <Input id="date" label="Date du paiement" type="date" defaultValue={aujourdhui} max={aujourdhui} required />
      <ChampSelect
        id="moyen"
        label="Moyen de paiement"
        options={Object.entries(libellesMoyen).map(([valeur, texte]) => ({ valeur, texte }))}
      />
      <Input id="periode" label="Mois payé" type="month" defaultValue={aujourdhui.slice(0, 7)} required />
      <Input id="reference" label="Référence de transaction" placeholder="ex : OM-240915-8842 (facultatif)" />
      <div className="w-full space-y-2">
        <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
          Statut
        </label>
        <select id="statut" name="statut" defaultValue="Confirme" className={styleChamp}>
          <option value="Confirme">Confirmé (argent reçu)</option>
          <option value="EnAttente">En attente de confirmation</option>
          <option value="Echoue">Échoué</option>
        </select>
      </div>
    </FormulaireModal>
  );
}
