// Mise en forme des données de l'API pour l'affichage (en français)

export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

// "2026-09-01" (DateOnly) ou "2026-09-01T10:00:00Z" (DateTime) → Date
const versDate = (texte: string) => new Date(texte.length === 10 ? `${texte}T12:00:00` : texte);

export const dateCourte = (texte: string) =>
  versDate(texte).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export const nomMois = (texte: string) =>
  versDate(texte).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export const moisCourt = (texte: string) =>
  versDate(texte).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

// "2026-09-15" → "2026-09-01" (format attendu par l'API pour un mois)
export const premierDuMois = (texte: string) => `${texte.slice(0, 7)}-01`;

// Mois en cours au format "2026-09-01"
export const moisActuel = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const libellesMoyen = {
  OrangeMoney: "Orange Money",
  MtnMomo: "MTN MoMo",
  Especes: "Espèces",
  Virement: "Virement",
} as const;

export const libellesTypeLogement = {
  Studio: "Studio",
  T1: "T1",
  T2: "T2",
  T3: "T3",
  T4Plus: "T4 et plus",
  Commerce: "Commerce",
} as const;

export const libellesTypeImmeuble = {
  Residentiel: "Résidentiel",
  Commercial: "Commercial",
  Mixte: "Mixte",
} as const;
