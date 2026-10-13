import Link from "next/link";
import { CircleAlert, Clock, ArrowRight } from "lucide-react";
import { dateCourte } from "@/lib/format";
import type { EtatAbonnement } from "@/lib/types";

// Bandeau affiché en haut de l'espace bailleur quand l'abonnement arrive à échéance ou a expiré
export default function BandeauAbonnement({
  etat,
  finAbonnement,
  maintenant,
}: {
  etat: EtatAbonnement;
  finAbonnement: string | null;
  maintenant: number;
}) {
  if (!finAbonnement || etat === "Gratuit") return null;

  const jours = Math.ceil((new Date(finAbonnement).getTime() - maintenant) / 86400000);
  let message: string;
  let style: string;

  if (etat === "Expire") {
    message = "Votre abonnement a expiré : vos données sont consultables, mais vous ne pouvez plus les modifier.";
    style = "border-red-200 bg-red-50 text-red-800";
  } else if (etat === "Grace") {
    message = `Votre abonnement a pris fin le ${dateCourte(finAbonnement)}. Renouvelez-le pour éviter le passage en lecture seule.`;
    style = "border-orange-200 bg-orange-50 text-orange-800";
  } else if (jours <= 7) {
    message =
      etat === "Essai"
        ? `Votre essai gratuit se termine dans ${jours} jour${jours > 1 ? "s" : ""}.`
        : `Votre abonnement se termine dans ${jours} jour${jours > 1 ? "s" : ""}.`;
    style = "border-blue-200 bg-blue-50 text-blue-900";
  } else {
    return null;
  }

  const Icone = etat === "Expire" || etat === "Grace" ? CircleAlert : Clock;
  return (
    <Link
      href="/admin/parametres?onglet=abonnement"
      className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 text-sm transition hover:brightness-95 ${style}`}
    >
      <span className="flex items-start gap-2">
        <Icone className="mt-0.5 size-4 shrink-0" />
        {message}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold whitespace-nowrap">
        Renouveler <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
