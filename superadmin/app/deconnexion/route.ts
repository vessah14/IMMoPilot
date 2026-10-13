import { NextResponse, type NextRequest } from "next/server";

// Déconnexion : efface le cookie de session puis renvoie vers la connexion.
// GET : session expirée ; POST : bouton « Déconnexion ».
function deconnecter(request: NextRequest) {
  const url = new URL("/connexion", request.url);
  if (request.nextUrl.searchParams.get("raison") === "expiree") url.searchParams.set("raison", "expiree");

  const reponse = NextResponse.redirect(url, { status: 303 });
  reponse.cookies.delete("immopilot_admin_session");
  return reponse;
}

export const GET = deconnecter;
export const POST = deconnecter;
