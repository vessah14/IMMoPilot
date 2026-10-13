// Libellés, icônes et couleurs des statuts (jamais la couleur seule)
import { CircleCheck, Hourglass, CirclePause, Clock, ArrowUp, ArrowRight, ArrowDown, CircleDot, CircleX } from "lucide-react";
import type { PrioriteTicket, StatutClient, StatutTicket } from "@/lib/types";

type Icone = React.ComponentType<{ className?: string }>;

export const statutsClient: Record<StatutClient, { label: string; icon: Icone; style: string }> = {
  Gratuit: { label: "Gratuit", icon: CircleDot, style: "bg-gray-100 text-gray-700" },
  Essai: { label: "Essai gratuit", icon: Hourglass, style: "bg-blue-100 text-blue-700" },
  Actif: { label: "Payé", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  Grace: { label: "À renouveler", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Expire: { label: "Expiré", icon: CircleX, style: "bg-red-100 text-red-700" },
  Suspendu: { label: "Suspendu", icon: CirclePause, style: "bg-red-100 text-red-700" },
};

export const priorites: Record<PrioriteTicket, { label: string; icon: Icone; style: string }> = {
  Haute: { label: "Haute", icon: ArrowUp, style: "bg-red-100 text-red-700" },
  Moyenne: { label: "Moyenne", icon: ArrowRight, style: "bg-orange-100 text-orange-700" },
  Basse: { label: "Basse", icon: ArrowDown, style: "bg-gray-100 text-gray-700" },
};

export const statutsTicket: Record<StatutTicket, { label: string; icon: Icone; style: string }> = {
  Ouvert: { label: "Ouvert", icon: CircleDot, style: "bg-blue-100 text-blue-700" },
  EnCours: { label: "En cours", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Resolu: { label: "Résolu", icon: CircleCheck, style: "bg-green-100 text-green-700" },
};
