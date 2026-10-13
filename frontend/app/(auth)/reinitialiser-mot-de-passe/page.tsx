import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import CadreAuth from "@/components/auth/CadreAuth";
import { FormulaireReinitialisation } from "@/components/auth/FormulairesMotDePasse";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

// Page ouverte depuis le lien reçu par e-mail : /reinitialiser-mot-de-passe?jeton=…
export default async function Reinitialiser({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const { jeton } = await searchParams;

  return (
    <CadreAuth>
      {jeton ? (
        <FormulaireReinitialisation jeton={jeton} />
      ) : (
        <div className="w-full max-w-md flex flex-col items-center gap-4 text-center" role="alert">
          <span className="size-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
            <LinkIcon className="size-8" />
          </span>
          <h1 className="text-3xl font-bold text-gray-900">Lien incomplet</h1>
          <p className="text-gray-600">
            Ouvrez le lien exactement tel qu&apos;il figure dans l&apos;e-mail reçu, ou faites une nouvelle demande.
          </p>
          <Link href="/mot-de-passe-oublie" className="font-medium text-blue-600 hover:underline">
            Refaire une demande
          </Link>
        </div>
      )}
    </CadreAuth>
  );
}
