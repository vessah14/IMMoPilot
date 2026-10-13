"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CirclePause, CirclePlay } from "lucide-react";
import { Recherche, Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { statutsClient } from "@/components/superadmin/libelles";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { dateCourte } from "@/lib/format";
import type { Client, StatutClient } from "@/lib/types";

export default function ListeClients({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<StatutClient | "tous">("tous");
  const [occupe, setOccupe] = useState<number | null>(null);

  const resultats = clients.filter((c) => {
    const texte = `${c.nom} ${c.contact} ${c.email} ${c.ville ?? ""}`.toLowerCase();
    return texte.includes(recherche.trim().toLowerCase()) && (statut === "tous" || c.statut === statut);
  });

  const compte = (s: StatutClient) => clients.filter((c) => c.statut === s).length;

  // Suspendre / réactiver : effet immédiat, le client est déconnecté à sa prochaine action
  const basculer = async (c: Client) => {
    const suspendre = c.statut !== "Suspendu";
    const question = suspendre
      ? `Suspendre le compte de « ${c.nom} » ? Ses utilisateurs ne pourront plus se connecter.`
      : `Réactiver le compte de « ${c.nom} » ?`;
    if (!confirm(question)) return;

    setOccupe(c.id);
    try {
      await apiClient(`/admin/utilisateurs/${c.id}/activation`, { methode: "PUT", corps: { actif: !suspendre } });
      router.refresh();
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setOccupe(null);
    }
  };

  const boutonAction = (c: Client) =>
    c.statut === "Suspendu" ? (
      <button
        type="button"
        onClick={() => basculer(c)}
        disabled={occupe === c.id}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 whitespace-nowrap disabled:opacity-50"
      >
        <CirclePlay className="size-4" /> Réactiver
      </button>
    ) : (
      <button
        type="button"
        onClick={() => basculer(c)}
        disabled={occupe === c.id}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 whitespace-nowrap disabled:opacity-50"
      >
        <CirclePause className="size-4" /> Suspendre
      </button>
    );

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex flex-col gap-4 p-5 border-b border-gray-100">
        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un client, un contact, une ville…"
          label="Rechercher un client"
        />
        <Pastilles
          label="Filtrer par statut"
          valeur={statut}
          onChange={setStatut}
          options={[
            { valeur: "tous", label: `Tous (${clients.length})` },
            { valeur: "Actif", label: `Payés (${compte("Actif")})` },
            { valeur: "Essai", label: `En essai (${compte("Essai")})` },
            { valeur: "Grace", label: `À renouveler (${compte("Grace")})` },
            { valeur: "Expire", label: `Expirés (${compte("Expire")})` },
            { valeur: "Gratuit", label: `Gratuits (${compte("Gratuit")})` },
            { valeur: "Suspendu", label: `Suspendus (${compte("Suspendu")})` },
          ]}
        />
      </div>

      {resultats.length === 0 ? (
        <EtatVide
          icon={Briefcase}
          titre={clients.length === 0 ? "Aucun client inscrit" : "Aucun client trouvé"}
          texte={clients.length === 0 ? "Les bailleurs apparaîtront ici dès leur inscription." : "Essayez une autre recherche ou retirez le filtre."}
        />
      ) : (
        <>
          {/* Tableau — ordinateur */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Formule</th>
                  <th className="px-5 py-3 font-medium">Utilisation</th>
                  <th className="px-5 py-3 font-medium">Inscription</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultats.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.nom}</p>
                      <p className="text-xs text-gray-500">
                        {c.contact} ·{" "}
                        <a href={`mailto:${c.email}`} className="hover:text-blue-600">
                          {c.email}
                        </a>
                        {c.ville && ` · ${c.ville}`}
                      </p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{c.formule}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                      {c.immeubles} immeubles · {c.locataires} locataires
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{dateCourte(c.dateInscription)}</td>
                    <td className="px-5 py-3">
                      <Badge {...statutsClient[c.statut]} />
                    </td>
                    <td className="px-5 py-3 text-right">{boutonAction(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes — mobile et tablette */}
          <ul className="lg:hidden divide-y divide-gray-100">
            {resultats.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{c.nom}</p>
                    <p className="text-sm text-gray-500">
                      {c.contact}
                      {c.ville && ` · ${c.ville}`}
                    </p>
                  </div>
                  <Badge {...statutsClient[c.statut]} />
                </div>
                <p className="text-sm text-gray-600">
                  Formule {c.formule} · {c.immeubles} immeubles · {c.locataires} locataires
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">Inscrit le {dateCourte(c.dateInscription)}</span>
                  {boutonAction(c)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
        {resultats.length} client{resultats.length > 1 ? "s" : ""} affiché{resultats.length > 1 ? "s" : ""} sur {clients.length}
      </p>
    </div>
  );
}
