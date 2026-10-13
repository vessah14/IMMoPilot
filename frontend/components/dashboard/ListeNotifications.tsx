"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  CircleAlert,
  FileSignature,
  Wrench,
  Info,
  CheckCheck,
  Trash2,
  BellOff,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { apiClient, ErreurApi } from "@/lib/api-client";
import type { Notification, TypeNotification } from "@/lib/types";

// Icône, couleur et nom de chaque type (le nom sert aussi aux filtres)
const types: Record<
  TypeNotification,
  { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  Paiement: { label: "Paiements", icon: Wallet, style: "bg-green-100 text-green-600" },
  Retard: { label: "Retards", icon: CircleAlert, style: "bg-red-100 text-red-600" },
  Bail: { label: "Baux", icon: FileSignature, style: "bg-indigo-100 text-indigo-600" },
  Maintenance: { label: "Maintenance", icon: Wrench, style: "bg-orange-100 text-orange-600" },
  Systeme: { label: "Système", icon: Info, style: "bg-gray-100 text-gray-600" },
};

// "il y a 5 min", "il y a 3 h", "hier", "il y a 4 jours"…
function ilYA(iso: string, maintenant: number) {
  const minutes = Math.round((maintenant - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `il y a ${Math.max(minutes, 1)} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// Regroupe par période : Aujourd'hui / Cette semaine / Plus ancien
function periode(iso: string, maintenant: number) {
  const jours = (maintenant - new Date(iso).getTime()) / 86400000;
  if (jours < 1) return "Aujourd'hui";
  if (jours < 7) return "Cette semaine";
  return "Plus ancien";
}

export default function ListeNotifications({
  initiales,
  maintenant,
}: {
  initiales: Notification[];
  maintenant: number; // heure de référence, fournie par la page (évite un écart serveur / navigateur)
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initiales);
  const [filtre, setFiltre] = useState<TypeNotification | "toutes" | "non_lues">("toutes");

  const nonLues = notifications.filter((n) => !n.lue).length;

  const affichees = notifications.filter((n) =>
    filtre === "toutes" ? true : filtre === "non_lues" ? !n.lue : n.type === filtre,
  );

  // Mise à jour immédiate de l'affichage, puis enregistrement ; en cas d'échec on revient en arrière
  const agir = async (miseAJour: (liste: Notification[]) => Notification[], appel: () => Promise<unknown>) => {
    const avant = notifications;
    setNotifications(miseAJour);
    try {
      await appel();
      router.refresh(); // met à jour le compteur de la cloche
    } catch (err) {
      setNotifications(avant);
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    }
  };

  const marquerLue = (id: number) =>
    agir(
      (liste) => liste.map((n) => (n.id === id ? { ...n, lue: true } : n)),
      () => apiClient(`/notifications/${id}/lue`, { methode: "PUT" }),
    );
  const toutMarquerLu = () =>
    agir(
      (liste) => liste.map((n) => ({ ...n, lue: true })),
      () => apiClient("/notifications/lues", { methode: "PUT" }),
    );
  const supprimer = (id: number) =>
    agir(
      (liste) => liste.filter((n) => n.id !== id),
      () => apiClient(`/notifications/${id}`, { methode: "DELETE" }),
    );

  // Groupes dans l'ordre d'affichage
  const groupes = ["Aujourd'hui", "Cette semaine", "Plus ancien"]
    .map((nom) => ({ nom, items: affichees.filter((n) => periode(n.date, maintenant) === nom) }))
    .filter((g) => g.items.length > 0);

  const filtres: { valeur: typeof filtre; label: string }[] = [
    { valeur: "toutes", label: `Toutes (${notifications.length})` },
    { valeur: "non_lues", label: `Non lues (${nonLues})` },
    ...(Object.keys(types) as TypeNotification[]).map((t) => ({ valeur: t, label: types[t].label })),
  ];

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      {/* Filtres + action globale */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les notifications">
          {filtres.map((f) => (
            <button
              key={f.valeur}
              type="button"
              onClick={() => setFiltre(f.valeur)}
              aria-pressed={filtre === f.valeur}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filtre === f.valeur ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" icon={CheckCheck} onClick={toutMarquerLu} disabled={nonLues === 0} className="shrink-0 whitespace-nowrap self-start lg:self-auto">
          Tout marquer comme lu
        </Button>
      </div>

      {groupes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
          <BellOff className="size-10 text-gray-300" />
          <p className="font-medium text-gray-900">Aucune notification</p>
          <p className="text-sm text-gray-500">Vous êtes à jour : rien à signaler ici.</p>
        </div>
      ) : (
        groupes.map((groupe) => (
          <div key={groupe.nom}>
            <h2 className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {groupe.nom}
            </h2>
            <ul className="divide-y divide-gray-100">
              {groupe.items.map((n) => {
                const { icon: Icone, style, label } = types[n.type];
                return (
                  <li
                    key={n.id}
                    className={`group flex gap-4 px-5 py-4 transition-colors ${n.lue ? "" : "bg-blue-50/60"}`}
                  >
                    <span className={`size-10 shrink-0 rounded-lg flex items-center justify-center ${style}`} title={label}>
                      <Icone className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm ${n.lue ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>
                          {!n.lue && (
                            <span className="mr-2 inline-block size-2 rounded-full bg-blue-600 align-middle" aria-label="Non lue" />
                          )}
                          {n.titre}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">{ilYA(n.date, maintenant)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{n.message}</p>

                      {/* Actions */}
                      <div className="mt-2 flex gap-4">
                        {!n.lue && (
                          <button
                            type="button"
                            onClick={() => marquerLue(n.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                          >
                            <Check className="size-3.5" /> Marquer comme lue
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => supprimer(n.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
