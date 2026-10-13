import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Utilisateur } from "@/lib/types";

// Appels à l'API depuis les composants serveur (pages, layouts).
// Le jeton est lu dans le cookie httpOnly posé par l'API à la connexion, puis transmis en en-tête.

export const API_URL = process.env.API_URL ?? "http://localhost:5065";
export const COOKIE_SESSION = "immopilot_session";

export async function apiServeur<T>(chemin: string): Promise<T> {
  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  if (!jeton) redirect("/connexion");

  const reponse = await fetch(`${API_URL}/api${chemin}`, {
    headers: { Authorization: `Bearer ${jeton}` },
    cache: "no-store",
  }).catch(() => {
    throw new Error(`L'API IMMO PILOT ne répond pas (${API_URL}). Est-elle démarrée ? (dotnet run --launch-profile http)`);
  });

  // Jeton expiré, invalide ou compte suspendu : on efface le cookie et on renvoie vers la connexion
  if (reponse.status === 401) redirect("/deconnexion?raison=expiree");
  if (reponse.status === 503) throw new Error("IMMO PILOT est en maintenance. Réessayez un peu plus tard.");
  if (!reponse.ok) throw new Error(`Erreur de l'API (${reponse.status}) sur ${chemin}`);

  return reponse.json() as Promise<T>;
}

// Appel sans connexion (ex : prix des formules). "revalidation" : durée de mise en cache en secondes.
export async function apiPublic<T>(chemin: string, revalidation?: number): Promise<T | null> {
  try {
    const reponse = await fetch(
      `${API_URL}/api${chemin}`,
      revalidation ? { next: { revalidate: revalidation } } : { cache: "no-store" },
    );
    return reponse.ok ? ((await reponse.json()) as T) : null;
  } catch {
    return null; // API injoignable : la page s'affiche quand même
  }
}

// Appel sans connexion qui distingue « introuvable » (null) d'« API arrêtée » (erreur → page « Réessayer »)
export async function apiPublicOuIntrouvable<T>(chemin: string): Promise<T | null> {
  const reponse = await fetch(`${API_URL}/api${chemin}`, { cache: "no-store" }).catch(() => {
    throw new Error(`L'API IMMO PILOT ne répond pas (${API_URL}). Est-elle démarrée ? (dotnet run --launch-profile http)`);
  });
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error(`Erreur ${reponse.status} de l'API IMMO PILOT`);
  return (await reponse.json()) as T;
}

// Utilisateur connecté, mémorisé pendant le rendu d'une page (plusieurs composants peuvent l'appeler)
export const utilisateurConnecte = cache(() => apiServeur<Utilisateur>("/auth/moi"));

// Heure du serveur au moment du rendu (pour afficher des durées relatives comme « il y a 5 min »)
export const horodatageServeur = () => Date.now();
