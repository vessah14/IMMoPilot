"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import Input from "@/components/ui/Input";
import { lienFormule, useAcces } from "@/components/dashboard/Formule";

// Propriétaire du bien qui reçoit les loyers payés en ligne (immeuble ou logement), facultatif.
// Plusieurs propriétaires par parc : formule Enterprise (sinon l'API ignore ces champs).
export default function ChampsBeneficiaire({
  prefixe = "",
  nom,
  compte,
  aide,
}: {
  prefixe?: string; // « m- » dans les fenêtres de modification (identifiants uniques)
  nom?: string | null;
  compte?: string | null; // 2376XXXXXXXX
  aide: string;
}) {
  const autorise = useAcces("ProprietairesMultiples");

  if (!autorise)
    return (
      <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-dashed border-gray-300 p-4">
        <Lock className="mt-0.5 size-4 shrink-0 text-gray-400" />
        <p className="text-sm text-gray-600">
          Les loyers payés en ligne arrivent sur votre numéro de réception (Paramètres → Agence).
          {nom && ` Propriétaire déjà enregistré : ${nom} (conservé).`} Un propriétaire différent par immeuble ou par logement
          est inclus dans la formule{" "}
          <Link href={lienFormule("ProprietairesMultiples")} className="font-medium text-blue-600 hover:underline">
            Enterprise
          </Link>
          .
        </p>
      </div>
    );

  return (
    <div className="sm:col-span-2 flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Qui reçoit les loyers payés en ligne ?</p>
        <p className="text-xs text-gray-500">{aide}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id={`${prefixe}beneficiaireNom`} name="beneficiaireNom" label="Propriétaire du bien (facultatif)" placeholder="ex : M. Paul Mbarga" defaultValue={nom ?? ""} />
        <Input
          id={`${prefixe}beneficiaireCompte`}
          name="beneficiaireCompte"
          label="Son numéro Mobile Money (facultatif)"
          type="tel"
          placeholder="ex : 677 12 34 56"
          defaultValue={compte?.replace(/^237/, "") ?? ""}
        />
      </div>
    </div>
  );
}
