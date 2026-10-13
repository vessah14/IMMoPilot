import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/api-client";

// Pages publiques proposées aux moteurs de recherche
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: URL_SITE, changeFrequency: "monthly", priority: 1 },
    { url: `${URL_SITE}/inscription`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${URL_SITE}/connexion`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${URL_SITE}/conditions-utilisation`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${URL_SITE}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
