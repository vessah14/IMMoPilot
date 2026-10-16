import { useRef } from "react";

// Clé d'idempotence d'un formulaire de paiement : la même tant que l'opération n'a pas réussi
// (double clic, nouvel envoi après une coupure réseau → l'API ne crée qu'un seul paiement),
// puis une nouvelle pour l'opération suivante.
export function useCleIdempotence() {
  const cle = useRef<string | null>(null);
  return {
    cle: () => (cle.current ??= crypto.randomUUID()),
    renouveler: () => {
      cle.current = null;
    },
  };
}
