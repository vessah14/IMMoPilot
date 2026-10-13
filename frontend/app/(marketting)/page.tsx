import { apiPublic } from "@/lib/api-serveur";
import type { Offre } from "@/lib/types";
import Link from "next/link";
import LienSection from "@/components/ui/LienSection";
import Accordeon from "@/components/ui/Accordeon";
import Cards from "@/components/ui/Cards";
import Pricing from "@/components/ui/Pricing";
import Apparition from "@/components/ui/Apparition";
import {
  Building2,
  Wallet,
  Users,
  Smartphone,
  FileText,
  BarChart3,
} from "lucide-react";

export default async function Homepage() {
  // Prix des formules réglés par le super admin (mis en cache 5 minutes)
  const offre = await apiPublic<Offre>("/offre", 300);
  const prix = offre ? Object.fromEntries(offre.formules.map((f) => [f.formule, f.prix])) : undefined;

  return (
    <>
      <Hero />
      <Fontionaliter />
      <Tarif prix={prix as React.ComponentProps<typeof Pricing>["prix"]} />
      <FAQ />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <div id="accueil" className="relative min-h-svh md:min-h-0 md:h-240 overflow-hidden">
      {/* Image de fond : léger zoom arrière à l'ouverture */}
      <div className="absolute inset-0 bg-[url('/images/Fond.png')] bg-cover bg-center bg-no-repeat animate-zoom-fond motion-reduce:animate-none"></div>

      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Contenu : chaque élément apparaît l'un après l'autre */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-svh md:min-h-0 md:h-full text-center px-6 pt-28 pb-16 md:py-0">
        <span className="bg-blue-600/20 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-blue-500/30 animate-apparition motion-reduce:animate-none">
          🏢 La solution pour les bailleurs modernes
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-tight animate-apparition [animation-delay:150ms] motion-reduce:animate-none">
          Gérez vos immeubles.
          <br />
          <span className="text-blue-400">Gardez le contrôle.</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mt-6 animate-apparition [animation-delay:300ms] motion-reduce:animate-none">
          Immeubles, locataires, loyers et paiements Orange Money / MTN MoMo :
          tout centralisé dans une seule plateforme. Simple, rapide, efficace.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto max-w-sm sm:max-w-none animate-apparition [animation-delay:450ms] motion-reduce:animate-none">
          <Link href="/inscription" className="bg-blue-600 text-white px-8 py-3.5 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 text-center">
            Commencer gratuitement
          </Link>
          <LienSection section="fonctionnalites" className="border border-white/30 text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-white/10 transition text-center">
            Voir la démo
          </LienSection>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-12 text-gray-400 text-sm [&>span]:whitespace-nowrap animate-apparition [animation-delay:600ms] motion-reduce:animate-none">
          <span>✅ Gratuit 14 jours</span>
          <span>✅ Sans carte bancaire</span>
          <span>✅ Paiement Mobile Money</span>
        </div>
      </div>
    </div>
  );
}

const fonctionnalites = [
  {
    icon: Building2,
    title: "Gestion des immeubles",
    description:
      "Immeubles et logements avec photos, statut de chaque logement (libre, occupé, en travaux) et propriétaire de chaque bien.",
  },
  {
    icon: Wallet,
    title: "Suivi des loyers",
    description:
      "Échéancier du mois : loyers payés, partiels ou en retard, et relance du locataire par e-mail ou WhatsApp en un clic.",
  },
  {
    icon: Users,
    title: "Gestion des locataires",
    description:
      "Fiches locataires, dates de bail, attribution des logements, historique des paiements et reçus envoyés automatiquement par e-mail.",
  },
  {
    icon: Smartphone,
    title: "Paiement en ligne",
    description:
      "Chaque locataire reçoit un lien personnel pour payer son loyer par Orange Money ou MTN MoMo, versé au propriétaire du logement.",
  },
  {
    icon: FileText,
    title: "Notifications & Alertes",
    description:
      "Notification à chaque loyer payé, retard ou nouveau locataire, et rappel avant l'échéance de votre abonnement.",
  },
  {
    icon: BarChart3,
    title: "Rapports financiers",
    description:
      "Revenus des 12 derniers mois, taux d'occupation, loyers impayés et export de vos données en CSV (Excel).",
  },
];

function Fontionaliter() {
  return (
    <>
      <section id="fonctionnalites" className="py-20 scroll-mt-20">
        <Apparition className="flex justify-center flex-col text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-500 mt-4">
            Tout ce dont vous avez besoin pour piloter vos Immeubles
          </h1>
          <p className="text-gray-500 text-lg mt-3 max-w-5xl mx-auto">
            Conçu spécifiquement pour automatiser les tâches chronophages et
            sécuriser vos revenus locatifs au quotidien.
          </p>
        </Apparition>
        <div className="max-w-350 mx-auto mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
            {fonctionnalites.map((f, i) => {
              const Icone = f.icon;
              return (
                // Les cartes d'une même ligne arrivent l'une après l'autre
                <Apparition key={f.title} delai={(i % 3) * 120} className="h-full">
                  <Cards
                    icon={<Icone size={24} />}
                    title={f.title}
                    description={f.description}
                    link="En savoir plus"
                  />
                </Apparition>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function Tarif({ prix }: React.ComponentProps<typeof Pricing>) {
  return (
    <>
      <div id="tarifs" className="scroll-mt-20">
        <Apparition>
          <Pricing prix={prix} />
        </Apparition>
      </div>
    </>
  );
}

function FAQ() {
  return (
    <>
      <div id="faq" className="max-w-320 mx-auto my-10 scroll-mt-20">
        <div className="flex flex-col justify-center items-center">
          <Apparition className="flex flex-col justify-center items-center mb-20">
            <span className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-1.5 rounded-full">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-blue-500 mt-4">
              Question frequente
            </h2>
          </Apparition>
          <Apparition delai={150} className="w-full flex justify-center">
            <Accordeon />
          </Apparition>
        </div>
      </div>
    </>
  );
}

function CTA() {
  return (
    <>
      <Apparition className="px-4 sm:px-6">
      <section className="mx-auto py-20 px-6 bg-linear-to-r from-blue-500 to-blue-700 rounded-2xl max-w-7xl my-16">
        <div className="flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white max-w-3xl leading-tight">
            Votre patrimoine mérite une gestion plus simple.
          </h2>
          <p className="text-blue-200 mt-4 max-w-xl text-lg">
            Rejoignez les propriétaires et gestionnaires qui gagnent en sérénité
            chaque mois avec IMMOPILOT.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto max-w-sm sm:max-w-none">
            <Link href="/inscription" className="bg-white text-blue-700 px-8 py-3.5 rounded-full text-lg font-semibold hover:bg-gray-100 transition shadow-lg text-center">
              Commencer gratuitement
            </Link>
            <LienSection section="fonctionnalites" className="border border-white/40 text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-white/10 transition text-center">
              Voir la démo
            </LienSection>
          </div>
          <p className="text-blue-300 text-sm mt-6">
            ✅ Essai gratuit 14 jours · Sans engagement · Sans carte bancaire
          </p>
        </div>
      </section>
      </Apparition>
    </>
  );
}
