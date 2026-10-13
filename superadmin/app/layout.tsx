import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Super admin | IMMO PILOT",
    template: "%s | Super admin IMMO PILOT",
  },
  description: "Administration de la plateforme IMMO PILOT : clients, abonnements, utilisateurs et support.",
  robots: { index: false, follow: false }, // application interne : pas de référencement
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
