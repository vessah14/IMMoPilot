"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, ChevronDown, Send, CircleCheck, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import { styleChamp } from "@/components/ui/Input";
import { Pastilles, Badge, EtatVide } from "@/components/dashboard/Filtres";
import { priorites, statutsTicket } from "@/components/superadmin/libelles";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { dateCourte } from "@/lib/format";
import type { StatutTicket, Ticket } from "@/lib/types";

export default function ListeTickets({ tickets: initiaux }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initiaux);
  const [filtre, setFiltre] = useState<StatutTicket | "tous">("tous");
  const [ouvert, setOuvert] = useState<number | null>(null); // ticket déplié
  const [envoi, setEnvoi] = useState<number | null>(null);

  const affiches = tickets.filter((t) => filtre === "tous" || t.statut === filtre);
  const compte = (s: StatutTicket) => tickets.filter((t) => t.statut === s).length;

  // Réponse et/ou changement de statut (la réponse est aussi envoyée au client en notification)
  const traiter = async (id: number, corps: { reponse?: string; statut?: StatutTicket }) => {
    setEnvoi(id);
    try {
      const miseAJour = await apiClient<Ticket>(`/admin/tickets/${id}`, { methode: "PUT", corps });
      setTickets((liste) => liste.map((t) => (t.id === id ? miseAJour : t)));
      router.refresh(); // compteur de la cloche
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(null);
    }
  };

  const repondre = (e: React.FormEvent<HTMLFormElement>, id: number) => {
    e.preventDefault();
    const formulaire = e.currentTarget;
    const reponse = new FormData(formulaire).get("reponse")?.toString().trim();
    if (reponse) traiter(id, { reponse }).then(() => formulaire.reset());
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100">
        <Pastilles
          label="Filtrer par statut"
          valeur={filtre}
          onChange={setFiltre}
          options={[
            { valeur: "tous", label: `Tous (${tickets.length})` },
            { valeur: "Ouvert", label: `Ouverts (${compte("Ouvert")})` },
            { valeur: "EnCours", label: `En cours (${compte("EnCours")})` },
            { valeur: "Resolu", label: `Résolus (${compte("Resolu")})` },
          ]}
        />
      </div>

      {affiches.length === 0 ? (
        <EtatVide icon={LifeBuoy} titre="Aucun ticket" texte="Aucune demande ne correspond à ce filtre." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {affiches.map((t) => {
            const deplie = ouvert === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setOuvert(deplie ? null : t.id)}
                  aria-expanded={deplie}
                  aria-controls={`ticket-${t.id}`}
                  className="w-full flex flex-col gap-2 p-4 sm:px-5 text-left hover:bg-gray-50 md:flex-row md:items-center"
                >
                  <div className="min-w-0 md:flex-1">
                    <p className="font-medium text-gray-900">{t.sujet}</p>
                    <p className="text-sm text-gray-500">
                      #{t.id} · {t.client} · {dateCourte(t.dateCreation)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge {...priorites[t.priorite]} />
                    <Badge {...statutsTicket[t.statut]} />
                    <ChevronDown className={`size-5 text-gray-400 transition-transform ${deplie ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {deplie && (
                  <div id={`ticket-${t.id}`} className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-line">{t.message}</p>

                    {t.reponse && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
                        <p className="mb-1 font-medium text-blue-800">
                          Dernière réponse {t.dateReponse && <span className="font-normal">· {dateCourte(t.dateReponse)}</span>}
                        </p>
                        <p className="text-gray-700 whitespace-pre-line">{t.reponse}</p>
                      </div>
                    )}

                    {t.statut !== "Resolu" ? (
                      <form onSubmit={(e) => repondre(e, t.id)} className="flex flex-col gap-3">
                        <label htmlFor={`reponse-${t.id}`} className="text-sm font-medium text-gray-700">
                          Répondre au client
                        </label>
                        <textarea
                          id={`reponse-${t.id}`}
                          name="reponse"
                          rows={3}
                          required
                          maxLength={4000}
                          placeholder="Le client recevra votre réponse dans ses notifications…"
                          className={styleChamp}
                        />
                        <div className="flex flex-wrap justify-end gap-3">
                          {t.statut === "Ouvert" && (
                            <Button variant="outline" icon={Clock} disabled={envoi === t.id} onClick={() => traiter(t.id, { statut: "EnCours" })}>
                              Prendre en charge
                            </Button>
                          )}
                          <Button variant="outline" icon={CircleCheck} disabled={envoi === t.id} onClick={() => traiter(t.id, { statut: "Resolu" })}>
                            Marquer résolu
                          </Button>
                          <Button type="submit" icon={Send} disabled={envoi === t.id}>
                            Envoyer
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-end">
                        <Button variant="outline" disabled={envoi === t.id} onClick={() => traiter(t.id, { statut: "EnCours" })}>
                          Rouvrir le ticket
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
