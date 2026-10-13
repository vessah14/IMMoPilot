import { NextResponse, type NextRequest } from "next/server";

// Vérification rapide (optimiste) : présence du cookie de session.
// La vraie vérification est faite par l'API à chaque appel (jeton valide, compte actif).
const COOKIE_SESSION = "immopilot_session";

export function proxy(request: NextRequest) {
  const connecte = request.cookies.has(COOKIE_SESSION);
  const { pathname, search } = request.nextUrl;

  // Espace bailleur réservé aux personnes connectées
  if (pathname.startsWith("/admin") && !connecte) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", pathname + search);
    return NextResponse.redirect(url);
  }

  // Déjà connecté : inutile d'afficher la connexion ou l'inscription
  if ((pathname === "/connexion" || pathname === "/inscription") && connecte) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/connexion", "/inscription"],
};
