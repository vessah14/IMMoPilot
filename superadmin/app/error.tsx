"use client"; // les pages d'erreur sont des composants client

import { useEffect } from "react";
import { ServerCrash, RotateCw } from "lucide-react";

// Affichée quand une page n'arrive pas à charger ses données (serveur arrêté, erreur de l'API…)
export default function Erreur({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ServerCrash className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Impossible de charger la page</h1>
        <p className="mt-2 text-gray-600">
          Le serveur IMMO PILOT ne répond pas pour le moment. Vérifiez votre connexion, puis réessayez dans quelques instants.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RotateCw className="size-4" /> Réessayer
        </button>
        {error.digest && <p className="mt-4 text-xs text-gray-400">Code : {error.digest}</p>}
      </div>
    </main>
  );
}
