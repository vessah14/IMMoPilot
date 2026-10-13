import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import FormulaireReinitialisation from "@/components/auth/FormulaireReinitialisation";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ReinitialiserMotDePasse({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string }>;
}) {
  const { jeton } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">Super admin</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Choisir un nouveau mot de passe</h1>
        </div>
        <FormulaireReinitialisation jeton={jeton ?? ""} />
      </div>
    </main>
  );
}
