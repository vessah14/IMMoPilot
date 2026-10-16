// Appels à l'API depuis le navigateur (formulaires, boutons).
// Le cookie de session httpOnly est envoyé automatiquement grâce à credentials: "include".

// Adresse publique du site (liens envoyés aux locataires). En production : NEXT_PUBLIC_SITE_URL=https://votre-domaine
export const URL_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
// Vide = même domaine que le site : les appels /api/… passent par le proxy de next.config.ts
export const API_URL_PUBLIQUE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
  ) {
    super(message);
  }
}

type Options = {
  methode?: "GET" | "POST" | "PUT" | "DELETE";
  corps?: unknown; // envoyé en JSON
  formulaire?: FormData; // envoi de fichier (multipart)
  cleIdempotence?: string; // même clé = même opération : l'API ne l'exécute qu'une fois (voir useCleIdempotence)
};

export async function apiClient<T = void>(
  chemin: string,
  { methode = "GET", corps, formulaire, cleIdempotence }: Options = {},
): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${API_URL_PUBLIQUE}/api${chemin}`, {
      method: methode,
      credentials: "include",
      headers: {
        ...(corps !== undefined && { "Content-Type": "application/json" }),
        ...(cleIdempotence && { "Idempotency-Key": cleIdempotence }),
      },
      body: formulaire ?? (corps !== undefined ? JSON.stringify(corps) : undefined),
    });
  } catch {
    throw new ErreurApi("Impossible de joindre le serveur. Vérifiez votre connexion.", 0);
  }

  if (reponse.status === 401 && !chemin.startsWith("/auth/")) {
    // Session expirée : rechargement complet vers la route serveur qui efface le cookie (pas une page)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/deconnexion?raison=expiree";
    throw new ErreurApi("Votre session a expiré.", 401);
  }
  if (!reponse.ok) throw new ErreurApi(await messageErreur(reponse), reponse.status);
  if (reponse.status === 204) return undefined as T;
  return (await reponse.json()) as T;
}

// Extrait un message lisible d'une réponse d'erreur ASP.NET (format ProblemDetails)
async function messageErreur(reponse: Response): Promise<string> {
  if (reponse.status === 429) return "Trop de tentatives. Patientez une minute avant de réessayer.";
  try {
    const probleme = await reponse.json();
    const erreurs = probleme.errors ? (Object.values(probleme.errors).flat() as string[]) : [];
    return probleme.detail ?? erreurs[0] ?? probleme.title ?? "Une erreur est survenue.";
  } catch {
    return "Une erreur est survenue.";
  }
}
