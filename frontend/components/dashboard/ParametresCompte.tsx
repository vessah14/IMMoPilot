"use client";

import { useState } from "react";
import { User, Building, Lock, CreditCard, LifeBuoy, Check, Clock, CircleCheck, CircleDot } from "lucide-react";
import Input, { styleChamp } from "@/components/ui/Input";
import Password from "@/components/ui/password";
import SectionParametres from "@/components/dashboard/SectionParametres";
import { Badge } from "@/components/dashboard/Filtres";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { dateCourte } from "@/lib/format";
import OngletAbonnement from "@/components/dashboard/OngletAbonnement";
import type { Abonnement, Formule, StatutTicket, Ticket, Utilisateur } from "@/lib/types";

const onglets = [
  { id: "profil", label: "Profil", icon: User },
  { id: "agence", label: "Agence", icon: Building },
  { id: "securite", label: "Sécurité", icon: Lock },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "support", label: "Support", icon: LifeBuoy },
] as const;

type IdOnglet = (typeof onglets)[number]["id"];

const statutsTicket: Record<StatutTicket, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  Ouvert: { label: "Envoyé", icon: CircleDot, style: "bg-blue-100 text-blue-700" },
  EnCours: { label: "En cours", icon: Clock, style: "bg-orange-100 text-orange-700" },
  Resolu: { label: "Résolu", icon: CircleCheck, style: "bg-green-100 text-green-700" },
};

type Props = {
  moi: Utilisateur;
  tickets: Ticket[];
  abonnement: Abonnement;
  ongletInitial?: string;
  formuleInitiale?: Formule; // formule présélectionnée dans l'onglet Abonnement
  bienvenue?: boolean; // arrivée juste après l'inscription
  paiementRetour?: number; // retour depuis la page de paiement SasPay
};

export default function ParametresCompte({ moi, tickets, abonnement, ongletInitial, formuleInitiale, bienvenue, paiementRetour }: Props) {
  const [onglet, setOnglet] = useState<IdOnglet>(onglets.some((o) => o.id === ongletInitial) ? (ongletInitial as IdOnglet) : "profil");

  // Le profil et l'agence sont enregistrés ensemble par l'API : on complète avec les valeurs actuelles
  const enregistrerProfil = async (d: FormData) => {
    const valeur = (cle: string, actuelle: string | number | null) => (d.has(cle) ? d.get(cle) : actuelle);
    await apiClient("/auth/moi", {
      methode: "PUT",
      corps: {
        nomComplet: valeur("nom", moi.nomComplet),
        telephone: valeur("telephone", moi.telephone),
        nomStructure: valeur("structure", moi.nomStructure) || null,
        ville: valeur("ville", moi.ville) || null,
        adresse: valeur("adresse", moi.adresse) || null,
        jourEcheance: Number(valeur("jourEcheance", moi.jourEcheance)),
        compteEncaissement: valeur("compteEncaissement", moi.compteEncaissement) || null,
      },
    });
  };

  const changerMotDePasse = async (d: FormData) => {
    if (d.get("nouveauMotDePasse") !== d.get("confirmation"))
      throw new ErreurApi("Les deux nouveaux mots de passe ne sont pas identiques.", 400);
    await apiClient("/auth/mot-de-passe", {
      methode: "PUT",
      corps: { motDePasseActuel: d.get("motDePasseActuel"), nouveauMotDePasse: d.get("nouveauMotDePasse") },
    });
  };

  const contacterSupport = async (d: FormData) => {
    await apiClient("/support", {
      methode: "POST",
      corps: { sujet: d.get("sujet"), message: d.get("message"), priorite: d.get("priorite") },
    });
  };


  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Menu des onglets : horizontal (défile) sur mobile, vertical sur ordinateur */}
      <nav
        aria-label="Sections des paramètres"
        className="-mx-4 px-4 overflow-x-auto lg:mx-0 lg:px-0 lg:overflow-visible lg:w-56 lg:shrink-0"
      >
        <ul className="flex gap-2 lg:flex-col lg:gap-1">
          {onglets.map((o) => {
            const Icone = o.icon;
            const actif = onglet === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOnglet(o.id)}
                  aria-current={actif ? "page" : undefined}
                  className={`w-full flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                    actif ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-blue-600"
                  }`}
                >
                  <Icone className="size-4" />
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 min-w-0 max-w-3xl flex flex-col gap-6">
        {onglet === "profil" && (
          <SectionParametres
            titre="Profil"
            description="Vos informations personnelles, visibles dans l'application."
            onEnregistrer={enregistrerProfil}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="size-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
                {moi.nomComplet.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium text-gray-900">{moi.nomComplet}</p>
                <p className="text-sm text-gray-500">Inscrit le {dateCourte(moi.dateInscription)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="nom" label="Nom complet" defaultValue={moi.nomComplet} required />
              <Input id="telephone" label="Téléphone" type="tel" defaultValue={moi.telephone} required />
              <div className="sm:col-span-2">
                <Input id="email" label="Adresse e-mail (identifiant de connexion)" type="email" defaultValue={moi.email} disabled />
              </div>
            </div>
          </SectionParametres>
        )}

        {onglet === "agence" && (
          <SectionParametres
            titre="Agence"
            description="Informations de votre activité et règles de vos loyers."
            onEnregistrer={enregistrerProfil}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="structure"
                  label="Nom de l'agence ou de la société (facultatif)"
                  defaultValue={moi.nomStructure ?? ""}
                  placeholder="ex : Horizon Immobilier"
                />
              </div>
              <Input id="ville" label="Ville" defaultValue={moi.ville ?? ""} />
              <Input
                id="jourEcheance"
                label="Jour d'échéance des loyers"
                type="number"
                min={1}
                max={28}
                defaultValue={moi.jourEcheance}
                required
              />
              <div className="sm:col-span-2">
                <Input id="adresse" label="Adresse" defaultValue={moi.adresse ?? ""} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Input
                  id="compteEncaissement"
                  label="Numéro Mobile Money de réception des loyers"
                  type="tel"
                  placeholder="ex : 677 12 34 56"
                  defaultValue={moi.compteEncaissement?.replace(/^237/, "") ?? ""}
                  required
                />
                <p className="text-xs text-gray-500">
                  Orange Money ou MTN MoMo : les loyers payés en ligne par vos locataires sont versés sur ce numéro.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Un loyer non réglé après le jour d&apos;échéance apparaît « en retard » dans votre tableau de bord.
            </p>
          </SectionParametres>
        )}

        {onglet === "securite" && (
          <SectionParametres
            titre="Sécurité"
            description="Changez votre mot de passe régulièrement."
            onEnregistrer={changerMotDePasse}
            labelBouton="Changer le mot de passe"
          >
            <div className="flex flex-col gap-4 max-w-md">
              <Password id="motDePasseActuel" label="Mot de passe actuel" autoComplete="current-password" afficherForce={false} required />
              <Password id="nouveauMotDePasse" label="Nouveau mot de passe" autoComplete="new-password" minLength={8} required />
              <Password id="confirmation" label="Confirmer le nouveau mot de passe" autoComplete="new-password" afficherForce={false} minLength={8} required />
            </div>
          </SectionParametres>
        )}

        {onglet === "abonnement" && <OngletAbonnement abonnement={abonnement} moi={moi} formuleInitiale={formuleInitiale} bienvenue={bienvenue} paiementRetour={paiementRetour} />}

        {onglet === "support" && (
          <>
            <SectionParametres
              titre="Contacter le support"
              description="Une question, un problème, un changement de formule ? L'équipe IMMO PILOT vous répond ici."
              onEnregistrer={contacterSupport}
              labelBouton="Envoyer"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input id="sujet" label="Sujet" placeholder="ex : Passer à la formule Pro" required maxLength={200} />
                </div>
                <div className="w-full space-y-2">
                  <label htmlFor="priorite" className="block text-sm font-medium text-gray-700">
                    Urgence
                  </label>
                  <select id="priorite" name="priorite" defaultValue="Moyenne" className={styleChamp}>
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Normale</option>
                    <option value="Haute">Urgente</option>
                  </select>
                </div>
                <div className="sm:col-span-3 w-full space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea id="message" name="message" rows={4} required maxLength={4000} className={styleChamp} />
                </div>
              </div>
            </SectionParametres>

            <div className="rounded-xl bg-white shadow-sm border border-gray-100">
              <h2 className="px-6 pt-5 pb-3 text-lg font-semibold text-gray-900">Mes demandes</h2>
              {tickets.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-gray-500">Vous n&apos;avez envoyé aucune demande.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {tickets.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2 px-6 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-medium text-gray-900">{t.sujet}</p>
                        <Badge {...statutsTicket[t.statut]} />
                      </div>
                      <p className="text-sm text-gray-600">{t.message}</p>
                      <p className="text-xs text-gray-400">Envoyé le {dateCourte(t.dateCreation)}</p>
                      {t.reponse && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
                          <p className="mb-1 flex items-center gap-1.5 font-medium text-blue-800">
                            <Check className="size-4" /> Réponse du support
                            {t.dateReponse && <span className="font-normal text-blue-600">· {dateCourte(t.dateReponse)}</span>}
                          </p>
                          <p className="text-gray-700 whitespace-pre-line">{t.reponse}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
