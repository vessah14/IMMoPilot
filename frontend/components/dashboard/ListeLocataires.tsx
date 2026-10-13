"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock, CircleAlert, Users, Mail, Phone, DoorOpen, Trash2 } from "lucide-react";
import { Recherche, Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { BoutonModifier, ModifierLocataire } from "@/components/dashboard/Modifier";
import LienPaiement, { BoutonLienPaiement } from "@/components/dashboard/LienPaiement";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa, dateCourte } from "@/lib/format";
import type { Locataire, SituationPaiement } from "@/lib/types";

// Libellé + icône + couleurs (jamais la couleur seule)
const situations: Record<SituationPaiement, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  AJour: { label: "À jour", icon: CircleCheck, style: "bg-green-100 text-green-700" },
  Retard: { label: "En retard", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Impaye: { label: "Impayé", icon: CircleAlert, style: "bg-red-100 text-red-700" },
};

// "Jean Dupont" → "JD"
const initiales = (nom: string) =>
  nom
    .split(" ")
    .map((m) => m[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Avatar({ nom }: { nom: string }) {
  return (
    <span className="size-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
      {initiales(nom)}
    </span>
  );
}

export default function ListeLocataires({
  locataires,
  logementsVacants,
  compteEncaissement,
}: {
  locataires: Locataire[];
  logementsVacants: { id: number; libelle: string; loyer: number }[]; // pour attribuer un logement dans « Modifier »
  compteEncaissement: string | null; // compte du bailleur qui reçoit les loyers en ligne
}) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<SituationPaiement | "tous" | "anciens">("tous");
  const [occupe, setOccupe] = useState<number | null>(null);
  const [edition, setEdition] = useState<Locataire | null>(null); // locataire en cours de modification
  const [lien, setLien] = useState<Locataire | null>(null); // fenêtre du lien de paiement

  const actuels = locataires.filter((l) => l.logementId !== null);
  const resultats = locataires.filter((l) => {
    const texte = `${l.nomComplet} ${l.email} ${l.telephone} ${l.logement ?? ""}`.toLowerCase();
    const correspond =
      filtre === "tous" ? l.logementId !== null : filtre === "anciens" ? l.logementId === null : l.logementId !== null && l.situation === filtre;
    return correspond && texte.includes(recherche.trim().toLowerCase());
  });

  const compte = (s: SituationPaiement) => actuels.filter((l) => l.situation === s).length;

  const action = async (l: Locataire, question: string, operation: () => Promise<unknown>) => {
    if (!confirm(question)) return;
    setOccupe(l.id);
    try {
      await operation();
      router.refresh();
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setOccupe(null);
    }
  };

  // Départ du locataire : le logement redevient vacant, l'historique des paiements est conservé
  const liberer = (l: Locataire) =>
    action(l, `${l.nomComplet} quitte le logement ${l.logement} ? Le logement redeviendra vacant.`, () =>
      apiClient(`/locataires/${l.id}`, {
        methode: "PUT",
        corps: { ...l, logementId: null },
      }),
    );

  const supprimer = (l: Locataire) =>
    action(l, `Supprimer définitivement ${l.nomComplet} ?`, () => apiClient(`/locataires/${l.id}`, { methode: "DELETE" }));

  const actions = (l: Locataire) => (
    <div className="flex items-center justify-end gap-1">
      {l.logementId !== null && l.jetonPaiement && (
        <BoutonLienPaiement onClick={() => setLien(l)} libelle={`Lien de paiement de ${l.nomComplet}`} />
      )}
      <BoutonModifier onClick={() => setEdition(l)} libelle={`Modifier ${l.nomComplet}`} />
      {l.logementId !== null && (
        <button
          type="button"
          onClick={() => liberer(l)}
          disabled={occupe === l.id}
          title="Libérer le logement (départ du locataire)"
          aria-label={`Libérer le logement de ${l.nomComplet}`}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
        >
          <DoorOpen className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => supprimer(l)}
        disabled={occupe === l.id}
        title="Supprimer"
        aria-label={`Supprimer ${l.nomComplet}`}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      {edition && <ModifierLocataire key={edition.id} element={edition} logementsVacants={logementsVacants} onFermer={() => setEdition(null)} />}
      {lien && <LienPaiement key={lien.id} locataire={lien} compteEncaissement={compteEncaissement} onFermer={() => setLien(null)} />}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-100">
        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un nom, un e-mail, un logement…"
          label="Rechercher un locataire"
        />
        <Pastilles
          label="Filtrer par situation"
          valeur={filtre}
          onChange={setFiltre}
          options={[
            { valeur: "tous", label: `Actuels (${actuels.length})` },
            { valeur: "AJour", label: `À jour (${compte("AJour")})` },
            { valeur: "Retard", label: `En retard (${compte("Retard")})` },
            { valeur: "Impaye", label: `Impayés (${compte("Impaye")})` },
            { valeur: "anciens", label: `Anciens (${locataires.length - actuels.length})` },
          ]}
        />
      </div>

      {resultats.length === 0 ? (
        <EtatVide
          icon={Users}
          titre={locataires.length === 0 ? "Aucun locataire pour l'instant" : "Aucun locataire trouvé"}
          texte={
            locataires.length === 0
              ? "Ajoutez un locataire et attribuez-lui un logement vacant."
              : "Essayez une autre recherche ou un autre filtre."
          }
        />
      ) : (
        <>
          {/* Tableau — ordinateur */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Locataire</th>
                  <th className="px-5 py-3 font-medium">Logement</th>
                  <th className="px-5 py-3 font-medium">Téléphone</th>
                  <th className="px-5 py-3 font-medium">Fin de bail</th>
                  <th className="px-5 py-3 font-medium">Paiement</th>
                  <th className="px-5 py-3 font-medium text-right">Loyer</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultats.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nom={l.nomComplet} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 whitespace-nowrap">{l.nomComplet}</p>
                          <a href={`mailto:${l.email}`} className="text-xs text-gray-500 hover:text-blue-600">
                            {l.email}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{l.logement ?? "—"}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <a href={`tel:${l.telephone.replace(/\s/g, "")}`} className="text-gray-600 hover:text-blue-600">
                        {l.telephone}
                      </a>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{dateCourte(l.finBail)}</td>
                    <td className="px-5 py-3">{l.logementId !== null && <Badge {...situations[l.situation]} />}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-right font-medium">{fcfa(l.loyer)}</td>
                    <td className="px-3 py-3">{actions(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes — mobile et tablette */}
          <ul className="lg:hidden divide-y divide-gray-100">
            {resultats.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <Avatar nom={l.nomComplet} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">{l.nomComplet}</p>
                      {l.logementId !== null && <Badge {...situations[l.situation]} />}
                    </div>
                    <p className="text-sm text-gray-500">{l.logement ?? "Plus de logement"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-gray-500">Fin de bail : {dateCourte(l.finBail)}</span>
                  <span className="font-semibold whitespace-nowrap">{fcfa(l.loyer)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${l.telephone.replace(/\s/g, "")}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Phone className="size-4" /> Appeler
                  </a>
                  <a
                    href={`mailto:${l.email}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Mail className="size-4" /> E-mail
                  </a>
                  {actions(l)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
        {resultats.length} locataire{resultats.length > 1 ? "s" : ""} affiché{resultats.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
