"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, Mail } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiClient, ErreurApi } from "@/lib/api-client";

export default function FormulaireMotDePasseOublie() {
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await apiClient("/admin/auth/mot-de-passe-oublie", {
        methode: "POST",
        corps: { email: new FormData(e.currentTarget).get("email") },
      });
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  if (envoye) {
    return <p role="status" className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
      Si cette adresse correspond à un compte super administrateur actif, un lien de réinitialisation vient d’être envoyé.
    </p>;
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-5">
      {erreur && <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="mt-0.5 size-4 shrink-0" />{erreur}</p>}
      <Input id="email" label="Adresse e-mail administrateur" type="email" autoComplete="email" required />
      <Button type="submit" icon={Mail} fullWidth disabled={envoi}>
        {envoi ? "Envoi…" : "Recevoir un lien de réinitialisation"}
      </Button>
      <Link href="/connexion" className="text-center text-sm font-medium text-blue-600 hover:underline">Retour à la connexion</Link>
    </form>
  );
}
