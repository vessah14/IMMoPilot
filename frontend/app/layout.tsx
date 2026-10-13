import type { Metadata } from "next";
import "./globals.css";
import { URL_SITE } from "@/lib/api-client";

// Site de démonstration (portfolio) : NEXT_PUBLIC_MODE_DEMO=true affiche un badge « Démo » sur toutes les pages
const modeDemo = process.env.NEXT_PUBLIC_MODE_DEMO === "true";

export const metadata: Metadata = {
  title: {
    default: "IMMO PILOT",
    template: "%s | IMMO PILOT",
  },
  description:
    "IMMO PILOT : gérez vos immeubles, locataires et loyers depuis une seule plateforme, avec paiement des loyers par Orange Money et MTN MoMo.",
  metadataBase: new URL(URL_SITE), // adresses complètes pour les aperçus de partage
  openGraph: { type: "website", locale: "fr_CM", siteName: "IMMO PILOT" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        {children}
        {modeDemo && (
          <p
            role="note"
            className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-950 shadow-lg"
          >
            Démo · aucun paiement réel
          </p>
        )}
      </body>
    </html>
  );
}