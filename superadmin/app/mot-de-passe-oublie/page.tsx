import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import FormulaireMotDePasseOublie from "@/components/auth/FormulaireMotDePasseOublie";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function MotDePasseOublie() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">Super admin</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Réinitialiser le mot de passe</h1>
          <p className="text-sm text-gray-500">Un lien temporaire sera envoyé à l’adresse du compte administrateur.</p>
        </div>
        <FormulaireMotDePasseOublie />
      </div>
    </main>
  );
}
