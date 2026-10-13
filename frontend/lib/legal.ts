// Informations légales affichées dans les conditions d'utilisation et la politique de confidentialité.
// IMMO PILOT est publié comme projet de démonstration (portfolio) : aucune société n'est derrière.
// Pour une exploitation commerciale, renseignez ici la raison sociale, le RCCM, le NIU et l'adresse.
export const editeur = {
  nom: "IMMO PILOT",
  statut: "Projet de démonstration (portfolio), sans activité commerciale ni encaissement réel",
  // Adresse de contact : variable d'environnement NEXT_PUBLIC_EMAIL_CONTACT (sinon : formulaire Support de l'espace)
  email: process.env.NEXT_PUBLIC_EMAIL_CONTACT || null,
  // À compléter seulement en cas d'activité réelle (laisser null sinon : la ligne n'est pas affichée)
  formeJuridique: null as string | null,
  rccm: null as string | null,
  niu: null as string | null,
  adresse: null as string | null,
  telephone: null as string | null,
};

// Date de la dernière modification des documents (à changer à chaque mise à jour)
export const miseAJourLegale = "14 octobre 2026";
