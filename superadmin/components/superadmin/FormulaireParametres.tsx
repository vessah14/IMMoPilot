"use client";

import Input from "@/components/ui/Input";
import Interrupteur from "@/components/ui/Interrupteur";
import SectionParametres from "@/components/dashboard/SectionParametres";
import { apiClient } from "@/lib/api-client";
import type { Parametres } from "@/lib/types";

// Les trois sections enregistrent l'ensemble des paramètres : on complète avec les valeurs actuelles
export default function FormulaireParametres({ parametres: p }: { parametres: Parametres }) {
  const enregistrer = async (d: FormData) => {
    const texte = (cle: string, actuel: string | null) => (d.has(cle) ? String(d.get(cle)) : actuel);
    const nombre = (cle: string, actuel: number) => (d.has(cle) ? Number(d.get(cle)) : actuel);
    const booleen = (cle: string, actuel: boolean) => (d.has(cle) ? d.get(cle) === "true" : actuel);

    await apiClient("/admin/parametres", {
      methode: "PUT",
      corps: {
        nomPlateforme: texte("nomPlateforme", p.nomPlateforme),
        emailSupport: texte("emailSupport", p.emailSupport),
        telephoneSupport: texte("telephoneSupport", p.telephoneSupport) || null,
        dureeEssaiJours: nombre("dureeEssaiJours", p.dureeEssaiJours),
        prixStarter: nombre("prixStarter", p.prixStarter),
        prixPro: nombre("prixPro", p.prixPro),
        prixEnterprise: nombre("prixEnterprise", p.prixEnterprise),
        inscriptionsOuvertes: booleen("inscriptionsOuvertes", p.inscriptionsOuvertes),
        modeMaintenance: booleen("modeMaintenance", p.modeMaintenance),
      },
    });
  };

  return (
    <>
      <SectionParametres titre="Général" description="Informations affichées aux clients." onEnregistrer={enregistrer}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="nomPlateforme" label="Nom de la plateforme" defaultValue={p.nomPlateforme} required />
          <Input id="emailSupport" label="E-mail du support" type="email" defaultValue={p.emailSupport} required />
          <Input id="telephoneSupport" label="Téléphone du support" type="tel" defaultValue={p.telephoneSupport ?? ""} />
          <Input
            id="dureeEssaiJours"
            label="Durée de l'essai gratuit (jours)"
            type="number"
            min={0}
            max={90}
            defaultValue={p.dureeEssaiJours}
            required
          />
        </div>
      </SectionParametres>

      <SectionParametres
        titre="Tarifs des formules"
        description="Prix mensuels en FCFA, affichés sur le site et à l'inscription."
        onEnregistrer={enregistrer}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input id="prixStarter" label="Starter" type="number" min={0} step={500} defaultValue={p.prixStarter} required />
          <Input id="prixPro" label="Pro" type="number" min={0} step={500} defaultValue={p.prixPro} required />
          <Input id="prixEnterprise" label="Enterprise" type="number" min={0} step={500} defaultValue={p.prixEnterprise} required />
        </div>
      </SectionParametres>

      <SectionParametres
        titre="Accès à la plateforme"
        description="À utiliser avec prudence : ces réglages s'appliquent immédiatement à tous les clients."
        onEnregistrer={enregistrer}
      >
        <div className="divide-y divide-gray-100 -my-4">
          <Interrupteur
            nom="inscriptionsOuvertes"
            label="Inscriptions ouvertes"
            description="Les nouveaux bailleurs peuvent créer un compte."
            defaut={p.inscriptionsOuvertes}
          />
          <Interrupteur
            nom="modeMaintenance"
            label="Mode maintenance"
            description="Les bailleurs ne peuvent plus utiliser l'application (le super admin reste accessible)."
            defaut={p.modeMaintenance}
          />
        </div>
      </SectionParametres>
    </>
  );
}
