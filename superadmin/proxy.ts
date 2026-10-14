import { NextResponse, type NextRequest } from "next/server";

// Vérification rapide (optimiste) : présence du cookie de session du super admin.
// La vraie vérification (jeton valide, rôle SuperAdmin, compte actif) est faite par l'API à chaque appel.
const COOKIE_SESSION = "immopilot_admin_session";

export function proxy(request: NextRequest) {
  const connecte = request.cookies.has(COOKIE_SESSION);
  const { pathname } = request.nextUrl;

  if (pathname === "/connexion") {
    return connecte ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (pathname === "/mot-de-passe-oublie" || pathname === "/reinitialiser-mot-de-passe") {
    return NextResponse.next();
  }
  if (!connecte) return NextResponse.redirect(new URL("/connexion", request.url));
  return NextResponse.next();
}

export const config = {
  // Toutes les pages, sauf : la déconnexion, les appels /api (transmis à l'API, qui vérifie elle-même la session),
  // robots.txt, les fichiers internes de Next.js et les icônes
  matcher: ["/((?!api/|deconnexion|robots.txt|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|logo-icone.svg).*)"],
};
