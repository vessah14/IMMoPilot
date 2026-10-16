import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Logo from "@/components/ui/Logo";
import PaiementLoyer from "@/components/paiement/PaiementLoyer";
import { apiPublicOuIntrouvable } from "@/lib/api-serveur";
import type { PageLoyer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Payer mon loyer",
  robots: { index: false, follow: false }, // lien personnel : jamais dans les moteurs de recherche
};

// Page ouverte par le locataire depuis le lien envoyé par son bailleur (sans compte)
// ?paiement=5 : retour depuis la page de paiement SasPay, on suit ce paiement jusqu'à sa confirmation
export default async function PayerLoyer({
  params,
  searchParams,
}: {
  params: Promise<{ jeton: string }>;
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { jeton } = await params;
  const { paiement } = await searchParams;
  const page = await apiPublicOuIntrouvable<PageLoyer>(`/paiement-loyer/${encodeURIComponent(jeton)}`);
  if (!page) notFound(); // lien inconnu ou remplacé par le bailleur

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <Logo className="h-8" />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <ShieldCheck className="size-4 text-green-600" /> Paiement sécurisé
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-8">
        <PaiementLoyer jeton={jeton} page={page} paiementRetour={/^\d+$/.test(paiement ?? "") ? Number(paiement) : undefined} />
      </div>
    </main>
  );
}
