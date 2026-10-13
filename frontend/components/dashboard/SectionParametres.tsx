"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CircleCheck, CircleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { ErreurApi } from "@/lib/api-client";

// Carte d'une section : titre, description, contenu et bouton d'enregistrement
export default function SectionParametres({
  titre,
  description,
  children,
  onEnregistrer,
  labelBouton = "Enregistrer",
}: {
  titre: string;
  description: string;
  children: React.ReactNode;
  onEnregistrer?: (donnees: FormData) => Promise<void>; // absent : section en lecture seule
  labelBouton?: string;
}) {
  const router = useRouter();
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok">("repos");
  const [erreur, setErreur] = useState("");

  const enregistrer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onEnregistrer) return;
    const formulaire = e.currentTarget;
    setErreur("");
    setEtat("envoi");
    try {
      await onEnregistrer(new FormData(formulaire));
      setEtat("ok");
      router.refresh();
      setTimeout(() => setEtat("repos"), 2500);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
      setEtat("repos");
    }
  };

  return (
    <form onSubmit={enregistrer} className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{titre}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="px-6 py-6">{children}</div>
      {onEnregistrer && (
        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {erreur && (
            <span role="alert" className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
              <CircleAlert className="size-4" /> {erreur}
            </span>
          )}
          {etat === "ok" && (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <CircleCheck className="size-4" /> Modifications enregistrées
            </span>
          )}
          <Button type="submit" icon={Save} disabled={etat === "envoi"}>
            {etat === "envoi" ? "Enregistrement…" : labelBouton}
          </Button>
        </div>
      )}
    </form>
  );
}
