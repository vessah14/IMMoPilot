import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IMMO PILOT",
    template: "%s | IMMO PILOT",
  },
  description:
    "IMMO PILOT vous permet de gérer vos immeubles, locataires, chambres et revenus depuis une seule plateforme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}