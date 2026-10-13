"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Ban, CircleCheck, Lock, Unlock, ShieldCheck } from "lucide-react";
import { Recherche, Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { dateCourte } from "@/lib/format";
import type { UtilisateurAdmin } from "@/lib/types";

const initiales = (nom: string) =>
  nom
    .split(" ")
    .map((m) => m[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const roles = { Bailleur: "Bailleur", SuperAdmin: "Super admin" } as const;

export default function ListeUtilisateurs({ utilisateurs, moiId }: { utilisateurs: UtilisateurAdmin[]; moiId: number }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState<UtilisateurAdmin["role"] | "tous">("tous");
  const [occupe, setOccupe] = useState<number | null>(null);

  const resultats = utilisateurs.filter((u) => {
    const texte = `${u.nomComplet} ${u.email} ${u.structure ?? ""}`.toLowerCase();
    return texte.includes(recherche.trim().toLowerCase()) && (role === "tous" || u.role === role);
  });

  const basculer = async (u: UtilisateurAdmin) => {
    if (!confirm(u.actif ? `Bloquer ${u.nomComplet} ? Il ne pourra plus se connecter.` : `Débloquer ${u.nomComplet} ?`)) return;
    setOccupe(u.id);
    try {
      await apiClient(`/admin/utilisateurs/${u.id}/activation`, { methode: "PUT", corps: { actif: !u.actif } });
      router.refresh();
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setOccupe(null);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex flex-col gap-4 p-5 border-b border-gray-100">
        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un nom, un e-mail, une agence…"
          label="Rechercher un utilisateur"
        />
        <Pastilles
          label="Filtrer par rôle"
          valeur={role}
          onChange={setRole}
          options={[
            { valeur: "tous", label: `Tous (${utilisateurs.length})` },
            { valeur: "Bailleur", label: "Bailleurs" },
            { valeur: "SuperAdmin", label: "Super admins" },
          ]}
        />
      </div>

      {resultats.length === 0 ? (
        <EtatVide icon={UserCog} titre="Aucun utilisateur trouvé" texte="Essayez une autre recherche ou retirez le filtre." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {resultats.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 p-4 sm:px-5 md:flex-row md:items-center">
              <div className="flex items-center gap-3 min-w-0 md:flex-1">
                <span className="size-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                  {initiales(u.nomComplet)}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{u.nomComplet}</p>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="text-sm md:w-56">
                <p className="text-gray-900">{u.structure ?? "—"}</p>
                <p className="flex items-center gap-1 text-gray-500">
                  {u.role === "SuperAdmin" && <ShieldCheck className="size-3.5" />}
                  {roles[u.role]}
                </p>
              </div>
              <p className="text-sm text-gray-500 md:w-48">
                {u.derniereConnexion ? `Connecté le ${dateCourte(u.derniereConnexion)}` : "Jamais connecté"}
              </p>
              <div className="flex items-center justify-between gap-3 md:justify-end md:w-52">
                <Badge
                  {...(u.actif
                    ? { label: "Actif", icon: CircleCheck, style: "bg-green-100 text-green-700" }
                    : { label: "Bloqué", icon: Ban, style: "bg-red-100 text-red-700" })}
                />
                {u.id !== moiId && (
                  <button
                    type="button"
                    onClick={() => basculer(u)}
                    disabled={occupe === u.id}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium whitespace-nowrap disabled:opacity-50 ${
                      u.actif ? "text-red-700 hover:bg-red-50" : "text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {u.actif ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                    {u.actif ? "Bloquer" : "Débloquer"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
        {resultats.length} utilisateur{resultats.length > 1 ? "s" : ""} sur {utilisateurs.length}
      </p>
    </div>
  );
}
