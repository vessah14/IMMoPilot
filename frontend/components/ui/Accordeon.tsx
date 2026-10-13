"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const questions = [
  {
    question: "À qui s’adresse IMMOPILOT ?",
    reponse:
      "IMMOPILOT est conçu pour les propriétaires bailleurs qui veulent gérer leurs immeubles, leurs locataires et leurs loyers depuis une seule plateforme. La formule Enterprise s’adresse aussi aux agences immobilières.",
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
      "Vous pouvez suivre les loyers depuis votre espace. Selon la formule, vous disposez aussi de relances automatiques. La plateforme présente également l’indexation des loyers selon l’indice IRL de l’INSEE.",
  },
  {
    question: "Puis-je gérer les contrats et les demandes de maintenance ?",
    reponse:
      "Oui. IMMOPILOT centralise les informations des locataires et des contrats, et permet de recevoir et suivre les demandes d’intervention jusqu’à leur résolution.",
  },
  {
    question: "Quels rapports financiers sont disponibles ?",
    reponse:
      "Les formules Pro et Enterprise incluent des rapports financiers. La plateforme présente aussi la préparation assistée des déclarations 2044 et 2072, ainsi que l’export FEC pour votre expert-comptable.",
  },
  {
    question: "Comment choisir une formule ?",
    reponse:
      "Choisissez Starter pour commencer avec un petit parc, Pro pour davantage d’immeubles et de fonctions de gestion, ou Enterprise pour des volumes illimités et une équipe. Consultez les tarifs affichés sur cette page ou contactez l’équipe pour Enterprise.",
  },
  {
    question: "Comment contacter le support ?",
    reponse:
      "Le support par email est inclus dans la formule Pro. Les clients Enterprise bénéficient d’un support prioritaire 24/7. Pour contacter l’équipe au sujet de cette formule, écrivez à support@immopilot.cm.",
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
