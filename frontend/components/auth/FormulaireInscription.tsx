"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserRound,
  Building2,
  BadgeCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  House,
  Briefcase,
  Landmark,
  PartyPopper,
  CircleAlert,
} from "lucide-react";
import Input, { styleChamp } from "@/components/ui/Input";
import Password from "@/components/ui/password";
import Button from "@/components/ui/Button";
import IndicateurEtapes from "@/components/ui/IndicateurEtapes";
import { apiClient, ErreurApi } from "@/lib/api-client";
import { fcfa } from "@/lib/format";
import type { Offre, ProfilGestion } from "@/lib/types";

const etapes = [
  { titre: "Votre compte", icon: UserRound },
  { titre: "Votre activité", icon: Building2 },
  { titre: "Votre formule", icon: BadgeCheck },
];

const profils = [
  { valeur: "proprietaire", titre: "Propriétaire", texte: "Je loue mes propres biens", icon: House },
  { valeur: "agence", titre: "Agence immobilière", texte: "Je gère les biens de mes clients", icon: Briefcase },
  { valeur: "sci", titre: "Société / SCI", texte: "Je gère le patrimoine d'une société", icon: Landmark },
];

const tranches = [
  { valeur: "1", label: "1 immeuble", max: 1 },
  { valeur: "2-3", label: "2 à 3", max: 3 },
  { valeur: "4-15", label: "4 à 15", max: 15 },
  { valeur: "16+", label: "Plus de 15", max: Infinity },
];

// Offre par défaut si l'API ne répond pas (mêmes valeurs que les paramètres initiaux du backend)
const offreParDefaut: Offre = {
  inscriptionsOuvertes: true,
  dureeEssaiJours: 14,
  formules: [
    { formule: "Starter", prix: 0, limiteImmeubles: 3, limiteLocataires: 10 },
    { formule: "Pro", prix: 15000, limiteImmeubles: 15, limiteLocataires: 100 },
    { formule: "Enterprise", prix: 45000, limiteImmeubles: null, limiteLocataires: null },
  ],
};

// Cartes de formules construites à partir des prix et limites renvoyés par l'API
const construireFormules = (offre: Offre) =>
  offre.formules.map((f) => ({
    valeur: f.formule,
    nom: f.formule,
    prix: f.prix === 0 ? "Gratuit" : `${fcfa(f.prix)} / mois`,
    limite: f.limiteImmeubles ?? Infinity,
    points: [
      f.limiteImmeubles ? `Jusqu'à ${f.limiteImmeubles} immeubles` : "Immeubles illimités",
      f.limiteLocataires ? `${f.limiteLocataires} locataires` : "Locataires illimités",
      "Loyers, relances et rapports",
    ],
  }));

// Valeurs attendues par l'API pour le profil
const profilsApi: Record<string, ProfilGestion> = { proprietaire: "Proprietaire", agence: "Agence", sci: "Sci" };

const villes = ["Yaoundé", "Douala", "Bafoussam", "Garoua", "Bamenda", "Kribi", "Limbe", "Ngaoundéré", "Bertoua", "Ebolowa", "Autre"];

// Style commun des cartes à cocher (bouton radio caché, la carte entière est cliquable)
const styleCarte =
  "flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 has-checked:border-blue-600 has-checked:bg-blue-50/60 has-checked:ring-1 has-checked:ring-blue-600 has-focus-visible:ring-4 has-focus-visible:ring-blue-100 has-disabled:cursor-not-allowed has-disabled:opacity-50";

export default function FormulaireInscription({ offre: offreApi }: { offre: Offre | null }) {
  const router = useRouter();
  const offre = offreApi ?? offreParDefaut;
  // ?formule=Pro : formule choisie dans la section Tarifs de l'accueil, présélectionnée à l'étape 3
  const formuleDemandee = useSearchParams().get("formule");
  const formuleInitiale = offre.formules.find((f) => f.formule === formuleDemandee)?.formule;
  const formules = construireFormules(offre);
  const formulaire = useRef<HTMLFormElement>(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [etape, setEtape] = useState(0);
  const [profil, setProfil] = useState("");
  const [tranche, setTranche] = useState("");
  const [formule, setFormule] = useState<string>(formuleInitiale ?? "");
  const [termine, setTermine] = useState(false);

  const derniereEtape = etape === etapes.length - 1;
  const maxImmeubles = tranches.find((t) => t.valeur === tranche)?.max ?? 0;
  // Formule proposée : celle choisie dans les Tarifs si elle couvre le nombre d'immeubles,
  // sinon la moins chère qui le couvre
  const choisieValable = formules.some((f) => f.valeur === formuleInitiale && f.limite >= maxImmeubles);
  const conseillee = choisieValable ? formuleInitiale : formules.find((f) => f.limite >= maxImmeubles)?.valeur;

  // Vérifie les champs de l'étape affichée (required, email, minLength...)
  const etapeValide = () => {
    const bloc = formulaire.current?.querySelector(`[data-etape="${etape}"]`);
    if (!bloc) return true;
    const champs = bloc.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select");
    return Array.from(champs).every((c) => c.reportValidity());
  };

  const suivant = () => {
    if (!etapeValide()) return;
    // En arrivant sur le choix de formule, on présélectionne la formule proposée
    if (etape === 1 && !formule && conseillee) setFormule(conseillee);
    setEtape((e) => e + 1);
  };

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!derniereEtape) return suivant(); // Entrée avant la fin : étape suivante
    if (!etapeValide()) return;

    const d = new FormData(e.currentTarget);
    setErreur("");
    setEnvoi(true);
    try {
      // Crée le compte ; l'API pose aussi le cookie de session (connexion directe)
      await apiClient("/auth/inscription", {
        methode: "POST",
        corps: {
          nomComplet: d.get("nom"),
          email: d.get("email"),
          telephone: d.get("telephone"),
          motDePasse: d.get("password"),
          profil: profilsApi[profil],
          nomStructure: d.get("structure") || null,
          ville: d.get("ville"),
          compteEncaissement: d.get("compteEncaissement"),
          formule,
        },
      });
      // Formule payante : on l'amène directement au paiement ; Starter (gratuite) : écran de bienvenue
      if (formule === "Starter") setTermine(true);
      else router.push(`/admin/parametres?onglet=abonnement&formule=${formule}&bienvenue=1`);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  if (!offre.inscriptionsOuvertes) {
    return (
      <div className="w-full max-w-md flex flex-col gap-4" role="status">
        <h1 className="text-3xl font-bold text-gray-900">Inscriptions fermées</h1>
        <p className="text-gray-600">
          Les inscriptions sont momentanément fermées. Revenez un peu plus tard, ou connectez-vous si vous avez déjà un compte.
        </p>
        <Button href="/connexion" variant="outline">
          Se connecter
        </Button>
      </div>
    );
  }

  if (termine) {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4 text-center" role="status">
        <span className="size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <PartyPopper className="size-8" />
        </span>
        <h1 className="text-3xl font-bold text-gray-900">Bienvenue sur IMMO PILOT !</h1>
        <p className="text-gray-600">
          Votre compte est créé. Commencez par ajouter votre premier immeuble depuis votre tableau de bord.
        </p>
        <Button href="/admin/immeubles" icon={ArrowRight} size="lg">
          Accéder à mon tableau de bord
        </Button>
      </div>
    );
  }

  return (
    <form ref={formulaire} onSubmit={envoyer} className="w-full max-w-lg flex flex-col gap-8">
      <div>
        <span className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-1.5 rounded-full">
          Inscription · étape {etape + 1} sur {etapes.length}
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          Créez votre compte <span className="text-blue-600">IMMO PILOT</span>
        </h1>
        <p className="mt-3 text-gray-600">
          {offre.dureeEssaiJours > 0 ? `${offre.dureeEssaiJours} jours d'essai gratuit, sans carte bancaire.` : "Sans carte bancaire."}
        </p>
      </div>

      <IndicateurEtapes etapes={etapes} etape={etape} />

      {/* Étape 1 : le compte */}
      <fieldset data-etape={0} hidden={etape !== 0} className="flex flex-col gap-5">
        <legend className="sr-only">Votre compte</legend>
        <Input id="nom" label="Nom complet" placeholder="ex : Jean Dupont" autoComplete="name" required />
        <div className="flex flex-col sm:flex-row gap-5">
          <Input id="email" label="Adresse e-mail" type="email" placeholder="ex : jean@gmail.com" autoComplete="email" required />
          <Input id="telephone" label="Téléphone" type="tel" placeholder="ex : 677 12 34 56" autoComplete="tel" required />
        </div>
        <Password
          id="password"
          label="Mot de passe"
          placeholder="8 caractères minimum"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </fieldset>

      {/* Étape 2 : l'activité de gestion */}
      <fieldset data-etape={1} hidden={etape !== 1} className="flex flex-col gap-6">
        <legend className="sr-only">Votre activité</legend>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">
            Vous êtes <span className="text-red-500">*</span>
          </p>
          {profils.map((p) => {
            const Icone = p.icon;
            return (
              <label key={p.valeur} className={styleCarte}>
                <input
                  type="radio"
                  name="profil"
                  value={p.valeur}
                  required
                  checked={profil === p.valeur}
                  onChange={() => setProfil(p.valeur)}
                  className="sr-only"
                />
                <span className="size-10 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Icone className="size-5" />
                </span>
                <span>
                  <span className="block font-medium text-gray-900">{p.titre}</span>
                  <span className="block text-sm text-gray-500">{p.texte}</span>
                </span>
              </label>
            );
          })}
        </div>

        {/* Nom de la structure : seulement pour une agence ou une société */}
        {(profil === "agence" || profil === "sci") && (
          <Input
            id="structure"
            label={profil === "agence" ? "Nom de l'agence" : "Nom de la société"}
            placeholder="ex : Horizon Immobilier"
            autoComplete="organization"
            required
          />
        )}

        <div className="w-full space-y-2">
          <label htmlFor="ville" className="block text-sm font-medium text-gray-700">
            Ville principale <span className="text-red-500">*</span>
          </label>
          <select id="ville" name="ville" required defaultValue="" className={styleChamp}>
            <option value="" disabled>
              Choisir une ville
            </option>
            {villes.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="compteEncaissement"
            label="Numéro Mobile Money pour recevoir vos loyers"
            type="tel"
            inputMode="tel"
            placeholder="ex : 677 12 34 56"
            pattern="[\s+0-9]{9,20}"
            required
          />
          <p className="text-xs text-gray-500">
            Orange Money ou MTN MoMo. Les loyers payés en ligne par vos locataires arrivent directement sur ce numéro (modifiable plus tard).
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">
            Combien d&apos;immeubles gérez-vous ? <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tranches.map((t) => (
              <label
                key={t.valeur}
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:border-blue-300 has-checked:border-blue-600 has-checked:bg-blue-600 has-checked:text-white has-focus-visible:ring-4 has-focus-visible:ring-blue-100"
              >
                <input
                  type="radio"
                  name="immeubles"
                  value={t.valeur}
                  required
                  checked={tranche === t.valeur}
                  onChange={() => {
                    setTranche(t.valeur);
                    setFormule(""); // la formule conseillée sera recalculée
                  }}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Étape 3 : la formule */}
      <fieldset data-etape={2} hidden={etape !== 2} className="flex flex-col gap-5">
        <legend className="sr-only">Votre formule</legend>
        <p className="text-sm text-gray-600">
          Vous pourrez changer de formule plus tard en contactant le support.
        </p>

        <div className="flex flex-col gap-3">
          {formules.map((f) => {
            const tropPetite = f.limite < maxImmeubles; // ne couvre pas le nombre d'immeubles
            return (
              <label key={f.valeur} className={`${styleCarte} flex-col sm:flex-row sm:items-start`}>
                <input
                  type="radio"
                  name="formule"
                  value={f.valeur}
                  required
                  disabled={tropPetite}
                  checked={formule === f.valeur}
                  onChange={() => setFormule(f.valeur)}
                  className="sr-only"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{f.nom}</span>
                    {f.valeur === conseillee && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Conseillée</span>
                    )}
                    {tropPetite && <span className="text-xs text-gray-500">(trop limitée pour votre parc)</span>}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {f.points.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1">
                        <Check className="size-3.5 text-green-600" /> {p}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">{f.prix}</span>
              </label>
            );
          })}
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            name="conditions"
            required
            className="mt-0.5 size-4 rounded border-gray-300 accent-blue-600"
          />
          <span>
            J&apos;accepte les{" "}
            <a href="/conditions-utilisation" target="_blank" className="font-medium text-blue-600 hover:underline">
              conditions d&apos;utilisation
            </a>{" "}
            et la{" "}
            <a href="/confidentialite" target="_blank" className="font-medium text-blue-600 hover:underline">
              politique de confidentialité
            </a>
            .
          </span>
        </label>
      </fieldset>

      {/* Erreur renvoyée par l'API (e-mail déjà utilisé, inscriptions fermées…) */}
      {erreur && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erreur}
        </p>
      )}

      {/* Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          {etape > 0 && (
            <Button variant="outline" icon={ArrowLeft} onClick={() => setEtape((e) => e - 1)} className="rounded-full">
              Retour
            </Button>
          )}
          {derniereEtape ? (
            <Button type="submit" icon={Check} fullWidth disabled={envoi} className="rounded-full py-3">
              {envoi ? "Création du compte…" : "Créer mon compte"}
            </Button>
          ) : (
            <Button onClick={suivant} fullWidth className="rounded-full py-3">
              Continuer
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
        <p className="text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-medium text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
}
