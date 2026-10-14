"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleAlert, Info, LogIn } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { apiClient, ErreurApi } from "@/lib/api-client";

export default function FormulaireConnexion() {
  const router = useRouter();
  const parametres = useSearchParams();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setErreur("");
    setEnvoi(true);
    try {
      await apiClient("/admin/auth/connexion", {
        methode: "POST",
        corps: { email: d.get("email"), motDePasse: d.get("motDePasse") },
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-5">
      {parametres.get("raison") === "expiree" && !erreur && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="mt-0.5 size-4 shrink-0" /> Votre session a expiré. Reconnectez-vous.
        </p>
      )}
      {erreur && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
        </p>
      )}
      <Input id="email" label="Adresse e-mail" type="email" autoComplete="username" required />
      <Input id="motDePasse" label="Mot de passe" type="password" autoComplete="current-password" required />
      <Link href="/mot-de-passe-oublie" className="-mt-3 self-end text-sm font-medium text-blue-600 hover:underline">
        Mot de passe oublié ?
      </Link>
      <Button type="submit" icon={LogIn} fullWidth disabled={envoi} className="mt-2 py-3">
        {envoi ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
