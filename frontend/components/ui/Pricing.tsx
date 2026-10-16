import Link from "next/link";
import { Check, X } from "lucide-react";

type Prix = { Starter: number; Pro: number; Enterprise: number };

// Prix par défaut si l'API ne répond pas
const prixParDefaut: Prix = { Starter: 0, Pro: 25, Enterprise: 45000 };
const montant = (n: number) => n.toLocaleString("fr-FR");

export default function Pricing({ prix = prixParDefaut }: { prix?: Prix }) {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-1.5 rounded-full">
            Tarifs
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-500 mt-4">
            Un plan pour chaque bailleur
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Commencez gratuitement, évoluez selon vos besoins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* STARTER */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
            <p className="text-sm text-gray-500 mt-1">Pour les petits bailleurs</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900">{prix.Starter === 0 ? "Gratuit" : montant(prix.Starter)}</span>
            </div>
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Jusqu&apos;à 3 immeubles
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                10 locataires max
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Suivi des loyers
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Paiement en ligne des loyers
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X size={18} className="text-gray-300 shrink-0" />
                Relances e-mail / WhatsApp
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X size={18} className="text-gray-300 shrink-0" />
                Rapports et exports CSV
              </li>
            </ul>
            <Link href="/inscription?formule=Starter" className="mt-8 w-full border border-blue-600 text-blue-600 py-3 rounded-full font-semibold hover:bg-blue-50 transition block text-center">
              Commencer gratuitement
            </Link>
          </div>

          {/* PRO — populaire */}
          <div className="relative bg-white border-2 border-blue-600 rounded-2xl p-8 flex flex-col shadow-xl shadow-blue-500/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
              POPULAIRE
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
            <p className="text-sm text-gray-500 mt-1">Pour les bailleurs actifs</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900">{montant(prix.Pro)}</span>
              <span className="text-gray-500 ml-1">FCFA/mois</span>
            </div>
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Jusqu&apos;à 15 immeubles
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                100 locataires max
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Relances e-mail / WhatsApp
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Paiement en ligne des loyers
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Rapports financiers et exports CSV
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Check size={18} className="text-green-500 shrink-0" />
                Support depuis votre espace
              </li>
            </ul>
            <Link href="/inscription?formule=Pro" className="mt-8 w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 block text-center">
              Essai gratuit 14 jours
            </Link>
          </div>

          {/* ENTERPRISE */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-white">Enterprise</h3>
            <p className="text-sm text-gray-400 mt-1">Pour les agences immobilières</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-white">{montant(prix.Enterprise)}</span>
              <span className="text-gray-400 ml-1">FCFA/mois</span>
            </div>
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={18} className="text-blue-400 shrink-0" />
                Immeubles illimités
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={18} className="text-blue-400 shrink-0" />
                Locataires illimités
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={18} className="text-blue-400 shrink-0" />
                Tout le plan Pro inclus
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={18} className="text-blue-400 shrink-0" />
                Idéal pour les agences
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={18} className="text-blue-400 shrink-0" />
                Plusieurs propriétaires par parc
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={18} className="text-blue-400 shrink-0" />
                Support prioritaire
              </li>
            </ul>
            <Link href="/inscription?formule=Enterprise" className="mt-8 w-full border border-white text-white py-3 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition block text-center">
              Choisir Enterprise
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}