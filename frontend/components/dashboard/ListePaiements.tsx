"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock, CircleX, Receipt, Trash2 } from "lucide-react";
import { Recherche, Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { BoutonModifier, ModifierPaiement } from "@/components/dashboard/Modifier";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa, dateCourte, nomMois, libellesMoyen } from "@/lib/format";
import type { MoyenPaiement, Paiement, StatutPaiement } from "@/lib/types";

const statuts: Record<StatutPaiement, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  Confirme: { label: "Confirmé", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  EnAttente: { label: "En attente", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Echoue: { label: "Échoué", icon: CircleX, style: "bg-red-100 text-red-700" },
};

// Loyer payé en ligne : où en est son reversement sur le compte du propriétaire
function Reversement({ p }: { p: Paiement }) {
  if (!p.reversement) return null;
  const texte =
    p.reversement === "Reverse"
      ? `Reçu : ${fcfa(p.montantReverse ?? 0)} (frais déduits)`
      : p.reversement === "Echoue"
        ? "Reversement à régulariser (support)"
        : "Reversement en cours…";
  const style = p.reversement === "Reverse" ? "text-green-700" : p.reversement === "Echoue" ? "text-red-600" : "text-gray-500";
  return <p className={`text-xs font-normal ${style}`}>{texte}</p>;
}

export default function ListePaiements({ paiements }: { paiements: Paiement[] }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [moyen, setMoyen] = useState<MoyenPaiement | "tous">("tous");
  const [occupe, setOccupe] = useState<number | null>(null);
  const [edition, setEdition] = useState<Paiement | null>(null); // paiement en cours de modification

  const resultats = paiements.filter((p) => {
    const texte = `${p.locataire} ${p.logement ?? ""} ${p.reference ?? ""}`.toLowerCase();
    return texte.includes(recherche.trim().toLowerCase()) && (moyen === "tous" || p.moyen === moyen);
  });

  const supprimer = async (p: Paiement) => {
    if (!confirm(`Supprimer le paiement de ${fcfa(p.montant)} de ${p.locataire} ?`)) return;
    setOccupe(p.id);
    try {
      await apiClient(`/paiements/${p.id}`, { methode: "DELETE" });
      router.refresh();
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setOccupe(null);
    }
  };

  const boutonSupprimer = (p: Paiement) => (
    <span className="inline-flex items-center gap-1">
    <BoutonModifier onClick={() => setEdition(p)} libelle={`Modifier le paiement de ${p.locataire}`} />
    <button
      type="button"
      onClick={() => supprimer(p)}
      disabled={occupe === p.id}
      title="Supprimer"
      aria-label={`Supprimer le paiement de ${p.locataire}`}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
    >
      <Trash2 className="size-4" />
    </button>
    </span>
  );

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      {edition && <ModifierPaiement key={edition.id} element={edition} onFermer={() => setEdition(null)} />}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-100">
        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un locataire, un logement, une référence…"
          label="Rechercher un paiement"
        />
        <Pastilles
          label="Filtrer par moyen de paiement"
          valeur={moyen}
          onChange={setMoyen}
          options={[
            { valeur: "tous" as const, label: `Tous (${paiements.length})` },
            ...(Object.keys(libellesMoyen) as MoyenPaiement[]).map((m) => ({ valeur: m, label: libellesMoyen[m] })),
          ]}
        />
      </div>

      {resultats.length === 0 ? (
        <EtatVide
          icon={Receipt}
          titre={paiements.length === 0 ? "Aucun paiement enregistré" : "Aucun paiement trouvé"}
          texte={
            paiements.length === 0
              ? "Enregistrez les loyers reçus avec le bouton « Enregistrer un paiement »."
              : "Essayez une autre recherche ou retirez le filtre."
          }
        />
      ) : (
        <>
          {/* Tableau — ordinateur */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Locataire</th>
                  <th className="px-5 py-3 font-medium">Mois payé</th>
                  <th className="px-5 py-3 font-medium">Moyen</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Montant</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultats.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{dateCourte(p.datePaiement)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{p.locataire}</p>
                      <p className="text-xs text-gray-500">{p.logement ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600 capitalize">{nomMois(p.periode)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="text-gray-900">{libellesMoyen[p.moyen]}</p>
                      {p.reference && <p className="text-xs text-gray-500">{p.reference}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge {...statuts[p.statut]} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right font-medium">
                      {fcfa(p.montant)}
                      <Reversement p={p} />
                    </td>
                    <td className="px-3 py-3 text-right">{boutonSupprimer(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes — mobile et tablette */}
          <ul className="lg:hidden divide-y divide-gray-100">
            {resultats.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{p.locataire}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {p.logement ?? "—"} · {nomMois(p.periode)}
                    </p>
                  </div>
                  <Badge {...statuts[p.statut]} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-gray-500">
                    {dateCourte(p.datePaiement)} · {libellesMoyen[p.moyen]}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-right font-semibold whitespace-nowrap">
                      {fcfa(p.montant)}
                      <Reversement p={p} />
                    </span>
                    {boutonSupprimer(p)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
        {resultats.length} paiement{resultats.length > 1 ? "s" : ""} · Total confirmé :{" "}
        <span className="font-medium text-gray-900">
          {fcfa(resultats.filter((p) => p.statut === "Confirme").reduce((s, p) => s + p.montant, 0))}
        </span>
      </p>
    </div>
  );
}
