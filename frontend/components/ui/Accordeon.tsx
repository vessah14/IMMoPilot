"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const questions = [
  {
    question: "À qui s’adresse IMMOPILOT ?",
    reponse:
      "IMMOPILOT est conçu pour les propriétaires bailleurs qui veulent gérer leurs immeubles, leurs locataires et leurs loyers depuis une seule plateforme. Il convient aussi aux agences, qui peuvent indiquer le propriétaire de chaque immeuble ou logement : les loyers payés en ligne lui sont versés directement.",
  },
  {
    question: "Puis-je essayer IMMOPILOT gratuitement ?",
    reponse:
      "Oui. La formule Starter est gratuite. La formule Pro propose un essai gratuit de 14 jours, sans carte bancaire et sans engagement.",
  },
  {
    question: "Combien d’immeubles et de locataires puis-je gérer ?",
    reponse:
      "La formule Starter comprend jusqu’à 3 immeubles et 10 locataires. Pro permet de gérer jusqu’à 15 immeubles et 100 locataires. Enterprise inclut des immeubles et des locataires illimités.",
  },
  {
    question: "Comment IMMOPILOT m’aide-t-il à suivre les loyers ?",
    reponse:
      "Chaque mois, IMMOPILOT indique les loyers payés, partiels ou en retard. Vous relancez un locataire par e-mail ou WhatsApp en un clic, et il peut payer en ligne avec son lien personnel (Orange Money ou MTN MoMo).",
  },
  {
    question: "Que reçoivent mes locataires ?",
    reponse:
      "À leur arrivée, un e-mail avec leur lien personnel de paiement. Après chaque loyer réglé, en ligne ou enregistré par vous, un reçu par e-mail. Pour vous répondre, il leur suffit de répondre à l’e-mail.",
  },
  {
    question: "Quels rapports financiers sont disponibles ?",
    reponse:
      "La page Rapports présente vos revenus sur 12 mois, le taux d’occupation et les impayés. Immeubles, locataires, paiements et loyers s’exportent en CSV, à ouvrir dans Excel.",
  },
  {
    question: "Comment choisir une formule ?",
    reponse:
      "Choisissez Starter pour commencer avec un petit parc, Pro pour davantage d’immeubles et de fonctions de gestion, ou Enterprise pour des volumes illimités et une équipe. Vous pouvez changer de formule à tout moment depuis Paramètres → Abonnement.",
  },
  {
    question: "Comment contacter le support ?",
    reponse:
      "Depuis votre espace : Paramètres → Support. Vous suivez la réponse de l’équipe au même endroit.",
  },
];

export default function Accordeon() {
  // Index de la question ouverte (null = tout est fermé)
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-y-3 w-full max-w-3xl px-4">
      {questions.map((item, index) => {
        const estOuvert = ouvert === index;

        return (
          <div
            key={index}
            className={`rounded-xl border transition-colors ${
              estOuvert ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOuvert(estOuvert ? null : index)}
              className={`flex justify-between items-center gap-x-3 w-full font-semibold text-start py-4 px-5 transition-colors ${
                estOuvert ? "text-blue-600" : "text-gray-900 hover:text-blue-600"
              }`}
              aria-expanded={estOuvert}
              aria-controls={`faq-reponse-${index}`}
            >
              {item.question}
              {estOuvert ? (
                <Minus className="size-4 shrink-0" />
              ) : (
                <Plus className="size-4 shrink-0" />
              )}
            </button>

            {/* grid-rows 0fr → 1fr : ouverture/fermeture animée */}
            <div
              id={`faq-reponse-${index}`}
              role="region"
              className={`grid transition-[grid-template-rows] duration-300 ${
                estOuvert ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-4 px-5 text-gray-600">{item.reponse}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
