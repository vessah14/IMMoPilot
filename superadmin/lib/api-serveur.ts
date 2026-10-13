import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { MoiAdmin } from "@/lib/types";

// Appels à l'API depuis les composants serveur. Le jeton est lu dans le cookie httpOnly du super admin.
export const API_URL = process.env.API_URL ?? "http://localhost:5065";
export const COOKIE_SESSION = "immopilot_admin_session";

// chemin relatif à /api/admin, ex : "/clients"
export async function apiAdmin<T>(chemin: string): Promise<T> {
  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  if (!jeton) redirect("/connexion");

  const reponse = await fetch(`${API_URL}/api/admin${chemin}`, {
    headers: { Authorization: `Bearer ${jeton}` },
    cache: "no-store",
  }).catch(() => {
    throw new Error(`L'API IMMO PILOT ne répond pas (${API_URL}). Est-elle démarrée ? (dotnet run --launch-profile http)`);
  });

  // Jeton expiré, invalide, ou compte qui n'est pas super admin
  if (reponse.status === 401 || reponse.status === 403) redirect("/deconnexion?raison=expiree");
  if (!reponse.ok) throw new Error(`Erreur de l'API (${reponse.status}) sur ${chemin}`);
  return reponse.json() as Promise<T>;
}

export const superAdminConnecte = cache(() => apiAdmin<MoiAdmin>("/auth/moi"));
