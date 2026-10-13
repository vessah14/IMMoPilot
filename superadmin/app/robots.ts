import type { MetadataRoute } from "next";

// Console d'administration : jamais dans les moteurs de recherche
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
