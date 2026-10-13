import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/api-client";

// Moteurs de recherche : pages publiques uniquement (pas l'espace connecté ni les liens de paiement)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/payer", "/deconnexion", "/reinitialiser-mot-de-passe"] },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
