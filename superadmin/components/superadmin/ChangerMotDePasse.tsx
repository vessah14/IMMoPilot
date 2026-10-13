"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiClient, ErreurApi } from "@/lib/api-client";

export default function ChangerMotDePasse() {
  const [erreur, setErreur] = useState("");
  const [ok, setOk] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formulaire = e.currentTarget;
    const d = new FormData(formulaire);
    setErreur("");
    setOk(false);
    setEnvoi(true);
    try {
      await apiClient("/admin/auth/mot-de-passe", {
        methode: "PUT",
        corps: { motDePasseActuel: d.get("actuel"), nouveauMotDePasse: d.get("nouveau") },
      });
      formulaire.reset();
      setOk(true);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={envoyer} className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-900">Sécurité du compte administrateur</h2>
        <p className="mt-1 text-sm text-gray-500">Change régulièrement le mot de passe de ce compte.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2">
        <Input id="actuel" label="Mot de passe actuel" type="password" autoComplete="current-password" required />
        <Input id="nouveau" label="Nouveau mot de passe" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
        {erreur && <span role="alert" className="text-sm font-medium text-red-700">{erreur}</span>}
        {ok && <span role="status" className="text-sm font-medium text-green-700">Mot de passe modifié.</span>}
        <Button type="submit" icon={KeyRound} disabled={envoi}>
          {envoi ? "Modification…" : "Changer le mot de passe"}
        </Button>
      </div>
    </form>
  );
}
