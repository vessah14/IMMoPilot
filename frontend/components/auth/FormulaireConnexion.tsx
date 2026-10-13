"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, Info } from "lucide-react";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/password";
import { apiClient, ErreurApi } from "@/lib/api-client";

export default function FormulaireConnexion() {
  const router = useRouter();
  const parametres = useSearchParams();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // Après connexion : retour à la page demandée (seulement dans l'espace /admin, jamais vers un autre site)
  const suite = parametres.get("suite");
  const destination = suite?.startsWith("/admin") ? suite : "/admin";
  const sessionExpiree = parametres.get("raison") === "expiree";

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    setErreur("");
    setEnvoi(true);
    try {
      await apiClient("/auth/connexion", {
        methode: "POST",
        corps: { email: donnees.get("email"), motDePasse: donnees.get("password") },
      });
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={envoyer} className="w-full max-w-md flex flex-col gap-8">
      <div>
        <span className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-1.5 rounded-full">Connexion</span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          Bon retour sur <span className="text-blue-600">IMMO PILOT</span>
        </h1>
        <p className="mt-3 text-gray-600">Connectez-vous pour retrouver vos biens, vos locataires et vos loyers.</p>
      </div>

      {sessionExpiree && !erreur && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="mt-0.5 size-4 shrink-0" /> Votre session a expiré. Reconnectez-vous pour continuer.
        </p>
      )}
      {erreur && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
        </p>
      )}

      <div className="flex flex-col gap-5">
        <Input id="email" label="Adresse e-mail" type="email" placeholder="ex : jean@gmail.com" autoComplete="email" required />
        <Password
          id="password"
          label="Mot de passe"
          placeholder="Votre mot de passe"
          required
          autoComplete="current-password"
          afficherForce={false}
        />
        <Link href="/mot-de-passe-oublie" className="-mt-2 self-end text-sm font-medium text-blue-600 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={envoi}
          className="w-full bg-blue-600 text-white py-3 rounded-full font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60"
        >
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
        <p className="text-center text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  );
}
