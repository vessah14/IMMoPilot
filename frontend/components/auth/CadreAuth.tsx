import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";

// Mise en page des pages de compte (mot de passe oublié…) : formulaire à gauche, image à droite
export default function CadreAuth({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen flex bg-gray-50">
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col px-4 sm:px-8 lg:px-12 py-8 bg-white">
        <div className="flex justify-between items-center">
          <Link href="/" aria-label="IMMO PILOT - Accueil">
            <Logo />
          </Link>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="size-4" />
            Retour à la connexion
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center py-10">{children}</div>
      </div>

      <div className="hidden lg:block flex-1 relative bg-[url('/images/Fond.png')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-linear-to-t from-blue-950/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <p className="text-2xl font-semibold max-w-md leading-snug">Votre patrimoine immobilier, piloté en toute sérénité.</p>
          <p className="mt-2 text-blue-100">Simple, rapide et sécurisé.</p>
        </div>
      </div>
    </section>
  );
}
