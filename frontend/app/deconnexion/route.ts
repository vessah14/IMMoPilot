import { NextResponse, type NextRequest } from "next/server";

// Déconnexion : efface le cookie de session (le jeton n'est gardé nulle part ailleurs) puis renvoie vers la connexion.
// GET : utilisé quand la session a expiré ; POST : bouton « Déconnexion ».
function deconnecter(request: NextRequest) {
  const url = new URL("/connexion", request.url);
  const raison = request.nextUrl.searchParams.get("raison");
  if (raison === "expiree") url.searchParams.set("raison", raison);

  const reponse = NextResponse.redirect(url, { status: 303 });
  reponse.cookies.delete("immopilot_session");
  return reponse;
}

export const GET = deconnecter;
export const POST = deconnecter;
