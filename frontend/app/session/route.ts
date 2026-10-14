import { NextResponse, type NextRequest } from "next/server";

// Réponse immédiate (sans appeler l'API) : un cookie de session est-il présent ?
// Sert à la barre de navigation pour afficher tout de suite « Mon compte » ou « Se connecter ».
export function GET(request: NextRequest) {
  return NextResponse.json(
    { connecte: request.cookies.has("immopilot_session") },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
