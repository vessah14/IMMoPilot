"use client";

import { useEffect, useRef, useState } from "react";

type Point = { mois: string; montant: number };

type GraphiqueRevenusProps = {
  donnees: Point[];
  hauteur?: number;
};

// Marges autour de la zone du graphique (place pour les axes)
const MARGE = { haut: 16, droite: 16, bas: 32, gauche: 56 };

// 2450000 → "2 450 000 FCFA"
const formatMontant = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

// 2450000 → "2,5 M" (pour l'axe, plus court)
const formatAxe = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`
    : n >= 1_000
      ? `${Math.round(n / 1_000)} k`
      : `${n}`;

// Calcule un maximum "rond" et des graduations régulières pour l'axe Y
function graduations(max: number, nombre = 4) {
  // Aucun revenu encore : échelle par défaut (0 à 100 000) pour garder un axe lisible
  const brut = (max > 0 ? max : 100000) / nombre;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut)!;
  return Array.from({ length: nombre + 1 }, (_, i) => i * pas);
}

export default function GraphiqueRevenus({ donnees, hauteur = 300 }: GraphiqueRevenusProps) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);
  const [survol, setSurvol] = useState<number | null>(null);

  // Le graphique s'adapte à la largeur de son conteneur (responsive)
  useEffect(() => {
    if (!conteneur.current) return;
    const observer = new ResizeObserver(([entree]) => setLargeur(entree.contentRect.width));
    observer.observe(conteneur.current);
    return () => observer.disconnect();
  }, []);

  const ticks = graduations(Math.max(...donnees.map((d) => d.montant)));
  const maxY = ticks[ticks.length - 1];

  const zoneL = Math.max(largeur - MARGE.gauche - MARGE.droite, 0);
  const zoneH = hauteur - MARGE.haut - MARGE.bas;

  // Position de chaque point en pixels
  const x = (i: number) => MARGE.gauche + (donnees.length > 1 ? (i / (donnees.length - 1)) * zoneL : 0);
  const y = (v: number) => MARGE.haut + zoneH - (v / maxY) * zoneH;

  const ligne = donnees.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.montant)}`).join(" ");
  const aire = `${ligne} L${x(donnees.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  // Sur petit écran, on n'affiche qu'un mois sur deux sur l'axe X
  const pasEtiquettes = largeur < 500 ? 2 : 1;

  // Trouve le mois le plus proche de la souris / du doigt
  const gererSurvol = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const i = Math.round((posX / rect.width) * (donnees.length - 1));
    setSurvol(Math.min(Math.max(i, 0), donnees.length - 1));
  };

  const actif = survol !== null ? donnees[survol] : null;

  return (
    <div ref={conteneur} className="relative w-full" style={{ height: hauteur }}>
      {largeur > 0 && (
        <svg
          width={largeur}
          height={hauteur}
          role="img"
          aria-label="Graphique de l'évolution des revenus mensuels"
          className="overflow-visible"
        >
          {/* Grille horizontale + valeurs de l'axe Y */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGE.gauche}
                x2={MARGE.gauche + zoneL}
                y1={y(t)}
                y2={y(t)}
                className="stroke-gray-100"
                strokeWidth={1}
              />
              <text
                x={MARGE.gauche - 10}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-400 text-xs"
              >
                {formatAxe(t)}
              </text>
            </g>
          ))}

          {/* Mois sur l'axe X */}
          {donnees.map((d, i) =>
            i % pasEtiquettes === 0 ? (
              <text
                key={d.mois}
                x={x(i)}
                y={hauteur - 8}
                textAnchor="middle"
                className="fill-gray-400 text-xs"
              >
                {d.mois}
              </text>
            ) : null,
          )}

          {/* Aire (voile léger) puis courbe */}
          <path d={aire} className="fill-blue-600/10" />
          <path
            d={ligne}
            fill="none"
            className="stroke-blue-600"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Ligne verticale + point du mois survolé */}
          {actif && survol !== null && (
            <g>
              <line
                x1={x(survol)}
                x2={x(survol)}
                y1={MARGE.haut}
                y2={MARGE.haut + zoneH}
                className="stroke-gray-300"
                strokeWidth={1}
              />
              <circle
                cx={x(survol)}
                cy={y(actif.montant)}
                r={5}
                className="fill-blue-600 stroke-white"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Zone invisible qui capte la souris (plus grande que la courbe) */}
          <rect
            x={MARGE.gauche}
            y={MARGE.haut}
            width={zoneL}
            height={zoneH}
            fill="transparent"
            onPointerMove={gererSurvol}
            onPointerDown={gererSurvol}
            onPointerLeave={() => setSurvol(null)}
          />
        </svg>
      )}

      {/* Infobulle */}
      {actif && survol !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
          style={{
            left: Math.min(Math.max(x(survol), 80), largeur - 80),
            top: y(actif.montant) - 12,
          }}
        >
          <p className="text-gray-300">{actif.mois}</p>
          <p className="font-semibold">{formatMontant(actif.montant)}</p>
        </div>
      )}

      {/* Version tableau, lue par les lecteurs d'écran */}
      <table className="sr-only">
        <caption>Revenus par mois</caption>
        <thead>
          <tr>
            <th>Mois</th>
            <th>Revenus</th>
          </tr>
        </thead>
        <tbody>
          {donnees.map((d) => (
            <tr key={d.mois}>
              <td>{d.mois}</td>
              <td>{formatMontant(d.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
