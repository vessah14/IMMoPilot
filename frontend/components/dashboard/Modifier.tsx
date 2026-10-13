"use client";

import { Pencil } from "lucide-react";
import Input, { styleChamp } from "@/components/ui/Input";
import FormulaireModal, { ChampSelect } from "@/components/ui/FormulaireModal";
import { apiClient } from "@/lib/api-client";
import { fcfa, libellesMoyen, libellesTypeImmeuble, libellesTypeLogement } from "@/lib/format";
import type { Immeuble, Locataire, Logement, Paiement } from "@/lib/types";

// Fenêtres de modification : elles s'ouvrent dès leur affichage, préremplies.
// Les identifiants des champs commencent par « m- » pour ne pas se mélanger
// avec ceux des formulaires d'ajout présents sur la même page.

type Props<T> = { element: T; onFermer: () => void };

const options = (libelles: Record<string, string>) =>
  Object.entries(libelles).map(([valeur, texte]) => ({ valeur, texte }));

// Bouton crayon utilisé dans les listes
export function BoutonModifier({ onClick, libelle }: { onClick: () => void; libelle: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Modifier"
      aria-label={libelle}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
    >
      <Pencil className="size-4" />
    </button>
  );
}

export function ModifierImmeuble({ element: i, onFermer }: Props<Immeuble>) {
  const enregistrer = async (d: FormData) => {
    const nombre = (cle: string) => (d.get(cle) ? Number(d.get(cle)) : null);
    await apiClient(`/immeubles/${i.id}`, {
      methode: "PUT",
      corps: {
        nom: d.get("nom"),
        type: d.get("type"),
        description: d.get("description") || null,
        adresse: d.get("adresse"),
        ville: d.get("ville"),
        quartier: d.get("quartier"),
        nombreEtages: nombre("etages"),
        anneeConstruction: nombre("annee"),
      },
    });
  };

  return (
    <FormulaireModal titre={`Modifier « ${i.nom} »`} labelEnvoi="Enregistrer les modifications" onEnvoyer={enregistrer} onFermer={onFermer}>
      <Input id="m-nom" name="nom" label="Nom de l'immeuble" defaultValue={i.nom} required />
      <ChampSelect id="m-type" name="type" label="Type d'immeuble" options={options(libellesTypeImmeuble)} defaut={i.type} />
      <div className="w-full space-y-2 sm:col-span-2">
        <label htmlFor="m-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea id="m-description" name="description" rows={3} defaultValue={i.description ?? ""} className={styleChamp} />
      </div>
      <div className="sm:col-span-2">
        <Input id="m-adresse" name="adresse" label="Adresse" defaultValue={i.adresse} required />
      </div>
      <Input id="m-ville" name="ville" label="Ville" defaultValue={i.ville} required />
      <Input id="m-quartier" name="quartier" label="Quartier" defaultValue={i.quartier} required />
      <Input id="m-etages" name="etages" label="Nombre d'étages" type="number" min={0} defaultValue={i.nombreEtages ?? ""} />
      <Input id="m-annee" name="annee" label="Année de construction" type="number" min={1900} max={2100} defaultValue={i.anneeConstruction ?? ""} />
    </FormulaireModal>
  );
}

export function ModifierLogement({ element: l, onFermer }: Props<Logement>) {
  const occupe = l.statut === "Occupe";
  const enregistrer = async (d: FormData) => {
    await apiClient(`/logements/${l.id}`, {
      methode: "PUT",
      corps: {
        immeubleId: l.immeubleId,
        reference: d.get("reference"),
        type: d.get("type"),
        etage: Number(d.get("etage")),
        surface: Number(d.get("surface")),
        loyer: Number(d.get("loyer")),
        charges: Number(d.get("charges") || 0),
        statut: occupe ? null : d.get("statut"), // « Occupé » dépend du locataire, pas du formulaire
      },
    });
  };

  return (
    <FormulaireModal titre={`Modifier le logement ${l.reference}`} labelEnvoi="Enregistrer les modifications" onEnvoyer={enregistrer} onFermer={onFermer}>
      <p className="sm:col-span-2 text-sm text-gray-500">
        Immeuble : <span className="font-medium text-gray-900">{l.immeuble}</span>
      </p>
      <Input id="m-reference" name="reference" label="Référence" defaultValue={l.reference} required />
      <ChampSelect id="m-type" name="type" label="Type" options={options(libellesTypeLogement)} defaut={l.type} />
      <Input id="m-etage" name="etage" label="Étage (0 = RDC)" type="number" min={0} defaultValue={l.etage} required />
      <Input id="m-surface" name="surface" label="Surface (m²)" type="number" min={1} step="0.01" defaultValue={l.surface} required />
      <Input id="m-loyer" name="loyer" label="Loyer mensuel (FCFA)" type="number" min={0} defaultValue={l.loyer} required />
      <Input id="m-charges" name="charges" label="Charges mensuelles (FCFA)" type="number" min={0} defaultValue={l.charges} />
      {occupe ? (
        <p className="sm:col-span-2 text-sm text-gray-500">
          Occupé par <span className="font-medium text-gray-900">{l.locataire}</span> : le statut changera quand le logement sera libéré.
        </p>
      ) : (
        <ChampSelect
          id="m-statut"
          name="statut"
          label="Statut"
          options={[
            { valeur: "Vacant", texte: "Vacant" },
            { valeur: "Travaux", texte: "En travaux" },
          ]}
          defaut={l.statut}
        />
      )}
    </FormulaireModal>
  );
}

export function ModifierLocataire({ element: l, onFermer }: Props<Locataire>) {
  const enregistrer = async (d: FormData) => {
    await apiClient(`/locataires/${l.id}`, {
      methode: "PUT",
      corps: {
        nomComplet: d.get("nom"),
        email: d.get("email"),
        telephone: d.get("telephone"),
        logementId: l.logementId, // le logement ne change pas ici (départ : bouton « Libérer »)
        debutBail: d.get("debutBail"),
        finBail: d.get("finBail"),
        loyer: Number(d.get("loyer")),
        caution: Number(d.get("caution") || 0),
      },
    });
  };

  return (
    <FormulaireModal titre={`Modifier ${l.nomComplet}`} labelEnvoi="Enregistrer les modifications" onEnvoyer={enregistrer} onFermer={onFermer}>
      <Input id="m-nom" name="nom" label="Nom complet" defaultValue={l.nomComplet} required />
      <Input id="m-telephone" name="telephone" label="Téléphone" type="tel" defaultValue={l.telephone} required />
      <div className="sm:col-span-2">
        <Input id="m-email" name="email" label="Adresse e-mail" type="email" defaultValue={l.email} required />
      </div>
      <p className="sm:col-span-2 text-sm text-gray-500">
        Logement : <span className="font-medium text-gray-900">{l.logement ?? "aucun (parti)"}</span>
      </p>
      <Input id="m-debutBail" name="debutBail" label="Début du bail" type="date" defaultValue={l.debutBail} required />
      <Input id="m-finBail" name="finBail" label="Fin du bail" type="date" defaultValue={l.finBail} required />
      <Input id="m-loyer" name="loyer" label="Loyer mensuel (FCFA)" type="number" min={0} defaultValue={l.loyer} required />
      <Input id="m-caution" name="caution" label="Caution (FCFA)" type="number" min={0} defaultValue={l.caution} />
    </FormulaireModal>
  );
}

export function ModifierPaiement({ element: p, onFermer }: Props<Paiement>) {
  const enregistrer = async (d: FormData) => {
    await apiClient(`/paiements/${p.id}`, {
      methode: "PUT",
      corps: {
        locataireId: p.locataireId,
        montant: Number(d.get("montant")),
        datePaiement: d.get("date"),
        periode: `${d.get("periode")}-01`,
        moyen: d.get("moyen"),
        reference: d.get("reference") || null,
        statut: d.get("statut"),
      },
    });
  };

  return (
    <FormulaireModal titre="Modifier le paiement" labelEnvoi="Enregistrer les modifications" onEnvoyer={enregistrer} onFermer={onFermer}>
      <p className="sm:col-span-2 text-sm text-gray-500">
        Locataire : <span className="font-medium text-gray-900">{p.locataire}</span>
        {p.logement && ` · ${p.logement}`} · montant actuel {fcfa(p.montant)}
      </p>
      <Input id="m-montant" name="montant" label="Montant (FCFA)" type="number" min={1} defaultValue={p.montant} required />
      <Input id="m-date" name="date" label="Date du paiement" type="date" defaultValue={p.datePaiement.slice(0, 10)} required />
      <ChampSelect id="m-moyen" name="moyen" label="Moyen de paiement" options={options(libellesMoyen)} defaut={p.moyen} />
      <Input id="m-periode" name="periode" label="Mois payé" type="month" defaultValue={p.periode.slice(0, 7)} required />
      <Input id="m-reference" name="reference" label="Référence de transaction" defaultValue={p.reference ?? ""} />
      <div className="w-full space-y-2">
        <label htmlFor="m-statut" className="block text-sm font-medium text-gray-700">
          Statut
        </label>
        <select id="m-statut" name="statut" defaultValue={p.statut} className={styleChamp}>
          <option value="Confirme">Confirmé (argent reçu)</option>
          <option value="EnAttente">En attente de confirmation</option>
          <option value="Echoue">Échoué</option>
        </select>
      </div>
    </FormulaireModal>
  );
}
