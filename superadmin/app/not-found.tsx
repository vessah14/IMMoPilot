import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, SearchX } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Page introuvable" };

// Page 404 : adresse inconnue, ou élément supprimé (notFound())
export default function PageIntrouvable() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-16">
      {/* Halo décoratif */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />

      <Link href="/" aria-label="IMMO PILOT" className="relative mb-10">
        <Logo />
      </Link>

      <div className="relative w-full max-w-lg text-center">
        <p aria-hidden className="bg-linear-to-b from-blue-600 to-blue-300 bg-clip-text text-8xl font-extrabold tracking-tight text-transparent sm:text-9xl">
          404
        </p>
        <span className="mx-auto -mt-4 flex size-14 items-center justify-center rounded-full border-4 border-gray-50 bg-white text-blue-600 shadow-md">
          <SearchX className="size-7" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">Page introuvable</h1>
        <p className="mt-3 text-gray-600">
          L&apos;adresse est peut-être mal saisie, ou cette page a été déplacée ou supprimée.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <ArrowLeft className="size-4" /> Retour à la vue d&apos;ensemble
          </Link>
          <Link
            href="/clients"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-600 px-5 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          >
            <LayoutDashboard className="size-4" /> Voir les clients
          </Link>
        </div>
      </div>
    </main>
  );
}
