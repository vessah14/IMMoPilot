import type { Metadata } from "next";
import { Suspense } from "react";
import Logo from "@/components/ui/Logo";
import FormulaireConnexion from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };

export default function Connexion() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Super admin
          </span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Administration de la plateforme</h1>
          <p className="text-sm text-gray-500">Accès réservé à l&apos;équipe IMMO PILOT.</p>
        </div>
        <div className="mt-8">
          <Suspense>
            <FormulaireConnexion />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
