"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, KeyRound } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiClient, ErreurApi } from "@/lib/api-client";

export default function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    const d = new FormData(e.currentTarget);
    try {
      await apiClient("/admin/auth/reinitialisation", {
        methode: "POST",
        corps: { jeton, nouveauMotDePasse: d.get("nouveau") },
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
      setEnvoi(false);
    }
  };

  if (!jeton) return <p role="alert" className="text-sm text-red-700">Le lien est incomplet. Demande une nouvelle réinitialisation.</p>;

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-5">
      {erreur && <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="mt-0.5 size-4 shrink-0" />{erreur}</p>}
      <Input id="nouveau" label="Nouveau mot de passe" type="password" autoComplete="new-password" minLength={8} required />
      <Button type="submit" icon={KeyRound} fullWidth disabled={envoi}>
        {envoi ? "Modification…" : "Réinitialiser le mot de passe"}
      </Button>
      <Link href="/connexion" className="text-center text-sm font-medium text-blue-600 hover:underline">Retour à la connexion</Link>
    </form>
  );
}
