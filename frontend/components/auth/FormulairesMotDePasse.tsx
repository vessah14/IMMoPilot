"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, KeyRound, MailCheck } from "lucide-react";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/password";
import { apiClient, ErreurApi } from "@/lib/api-client";

const styleBouton =
  "w-full bg-blue-600 text-white py-3 rounded-full font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60";

function Erreur({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      <CircleAlert className="mt-0.5 size-4 shrink-0" /> {message}
    </p>
  );
}

// Étape 1 : l'utilisateur donne son e-mail, on lui envoie un lien
export function FormulaireMotDePasseOublie() {
  const [envoye, setEnvoye] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setErreur("");
    setEnvoi(true);
    try {
      await apiClient("/auth/mot-de-passe-oublie", { methode: "POST", corps: { email } });
      setEnvoye(email);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  if (envoye) {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4 text-center" role="status">
        <span className="size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <MailCheck className="size-8" />
        </span>
        <h1 className="text-3xl font-bold text-gray-900">Vérifiez vos e-mails</h1>
        <p className="text-gray-600">
          Si un compte existe avec l&apos;adresse <strong className="text-gray-900">{envoye}</strong>, vous allez recevoir un
          lien pour choisir un nouveau mot de passe. Il est valable 1 heure.
        </p>
        <p className="text-sm text-gray-500">Pensez à regarder dans les courriers indésirables (spams).</p>
        <button type="button" onClick={() => setEnvoye("")} className="text-sm font-medium text-blue-600 hover:underline">
          Renvoyer le lien
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="w-full max-w-md flex flex-col gap-8">
      <div>
        <span className="size-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <KeyRound className="size-6" />
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">Mot de passe oublié ?</h1>
        <p className="mt-3 text-gray-600">
          Saisissez l&apos;adresse e-mail de votre compte : nous vous envoyons un lien pour en choisir un nouveau.
        </p>
      </div>
      <Erreur message={erreur} />
      <Input id="email" label="Adresse e-mail" type="email" placeholder="ex : jean@gmail.com" autoComplete="email" required />
      <div className="flex flex-col gap-4">
        <button type="submit" disabled={envoi} className={styleBouton}>
          {envoi ? "Envoi…" : "Recevoir le lien"}
        </button>
        <p className="text-center text-sm text-gray-600">
          Vous vous en souvenez ?{" "}
          <Link href="/connexion" className="font-medium text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
}

// Étape 2 : l'utilisateur arrive depuis le lien de l'e-mail et choisit son nouveau mot de passe
export function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    if (d.get("nouveau") !== d.get("confirmation")) {
      setErreur("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setErreur("");
    setEnvoi(true);
    try {
      // Change le mot de passe et connecte directement
      await apiClient("/auth/reinitialisation", { methode: "POST", corps: { jeton, nouveauMotDePasse: d.get("nouveau") } });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={envoyer} className="w-full max-w-md flex flex-col gap-8">
      <div>
        <span className="size-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <KeyRound className="size-6" />
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">Nouveau mot de passe</h1>
        <p className="mt-3 text-gray-600">Choisissez un mot de passe d&apos;au moins 8 caractères. Vos autres appareils seront déconnectés.</p>
      </div>
      <Erreur message={erreur} />
      <div className="flex flex-col gap-5">
        <Password id="nouveau" label="Nouveau mot de passe" placeholder="8 caractères minimum" minLength={8} required autoComplete="new-password" />
        <Password
          id="confirmation"
          label="Confirmer le mot de passe"
          placeholder="Retapez le mot de passe"
          minLength={8}
          required
          autoComplete="new-password"
          afficherForce={false}
        />
      </div>
      <button type="submit" disabled={envoi} className={styleBouton}>
        {envoi ? "Enregistrement…" : "Enregistrer et me connecter"}
      </button>
    </form>
  );
}
