"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CircleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { styleChamp } from "@/components/ui/Input";
import { apiClient, ErreurApi } from "@/lib/api-client";

// Prolongation manuelle d'un abonnement (paiement reçu en espèces, virement, geste commercial…)
export default function ProlongerAbonnement({
  clients,
}: {
  clients: { id: number; nom: string; formule: string }[];
}) {
  const router = useRouter();
  const formulaire = useRef<HTMLFormElement>(null);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const prolonger = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const client = clients.find((c) => String(c.id) === d.get("client"));
    if (!client || !confirm(`Prolonger l'abonnement de « ${client.nom} » de ${d.get("duree")} mois (formule ${d.get("formule")}) ?`)) return;

    setErreur("");
    setMessage("");
    setEnvoi(true);
    try {
      await apiClient(`/admin/utilisateurs/${client.id}/prolongation`, {
        methode: "POST",
        corps: { formule: d.get("formule"), dureeMois: Number(d.get("duree")) },
      });
      setMessage(`Abonnement de « ${client.nom} » prolongé.`);
      formulaire.current?.reset();
      router.refresh();
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form ref={formulaire} onSubmit={prolonger} className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900">Prolonger un abonnement manuellement</h2>
      <p className="text-sm text-gray-500">Pour un paiement reçu hors CamPay (espèces, virement) ou un geste commercial.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 md:items-end">
        <div className="space-y-2">
          <label htmlFor="client" className="block text-sm font-medium text-gray-700">
            Client
          </label>
          <select id="client" name="client" required defaultValue="" className={styleChamp}>
            <option value="" disabled>
              Choisir un client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.formule})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="formule" className="block text-sm font-medium text-gray-700">
            Formule
          </label>
          <select id="formule" name="formule" defaultValue="Pro" className={styleChamp}>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="duree" className="block text-sm font-medium text-gray-700">
            Durée
          </label>
          <select id="duree" name="duree" defaultValue="1" className={styleChamp}>
            {[1, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} mois
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" icon={CalendarPlus} disabled={envoi}>
          {envoi ? "…" : "Prolonger"}
        </Button>
      </div>
      {erreur && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-red-700">
          <CircleAlert className="size-4" /> {erreur}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {message}
        </p>
      )}
    </form>
  );
}
