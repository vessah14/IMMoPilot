import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import FormulaireConnexion from "@/components/auth/FormulaireConnexion";
import ImageFond from "@/components/ui/ImageFond";

export default function Connexion() {
  return (
    <section className="min-h-screen flex bg-gray-50">
      {/* Colonne gauche : formulaire */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col px-4 sm:px-8 lg:px-12 py-8 bg-white">
        <div className="flex justify-between items-center">
          <Link href="/" aria-label="IMMO PILOT - Accueil">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="size-4" />
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <Suspense>
            <FormulaireConnexion />
          </Suspense>
        </div>
      </div>

      {/* Colonne droite : image (masquée sur mobile) */}
      <div className="hidden lg:block flex-1 relative bg-slate-900">
        <ImageFond sizes="50vw" />
        {/* Dégradé sombre en bas pour rendre le texte lisible */}
        <div className="absolute inset-0 bg-linear-to-t from-blue-950/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <p className="text-2xl font-semibold max-w-md leading-snug">
            Votre patrimoine immobilier, piloté en toute sérénité.
          </p>
          <p className="mt-2 text-blue-100">
            Simple, rapide et sécurisé.
          </p>
        </div>
      </div>
    </section>
  );
}
