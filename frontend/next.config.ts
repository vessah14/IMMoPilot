import path from "node:path";
import type { NextConfig } from "next";

// Adresse de l'API ASP.NET (en production : variable d'environnement API_URL, ex : https://immopilot-api.onrender.com)
const API_URL = process.env.API_URL ?? "http://localhost:5065";

const nextConfig: NextConfig = {
  images: {
    // Photos des immeubles hébergées sur Cloudinary
    remotePatterns: [new URL("https://res.cloudinary.com/**")],
  },
  // Le navigateur appelle /api/… sur le domaine du site, et Next transmet à l'API.
  // Ainsi le cookie de session appartient au domaine du site : la connexion fonctionne même
  // quand le site et l'API sont hébergés sur deux domaines différents (Vercel + Render…).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  // Racine du projet (évite l'avertissement dû à un package-lock.json dans le dossier utilisateur)
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
