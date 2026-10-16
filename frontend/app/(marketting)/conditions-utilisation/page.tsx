import type { Metadata } from "next";
import Link from "next/link";
import PageLegale, { type SectionLegale } from "@/components/ui/PageLegale";
import LienContact from "@/components/ui/LienContact";
import { editeur } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation et de vente de la plateforme IMMO PILOT.",
};

const sections: SectionLegale[] = [
  {
    id: "objet",
    titre: "Objet",
    contenu: (
      <>
        <p>
          Les présentes conditions générales d&apos;utilisation et de vente (les « Conditions ») encadrent l&apos;accès et
          l&apos;utilisation de la plateforme <strong>IMMO PILOT</strong>, un logiciel en ligne de gestion locative
          (immeubles, logements, locataires, loyers, paiements et relances) destiné aux propriétaires et gestionnaires de biens.
        </p>
        <p>
          En créant un compte, vous déclarez avoir lu et accepté ces Conditions ainsi que notre{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </>
    ),
  },
  {
    id: "editeur",
    titre: "Éditeur de la plateforme",
    contenu: (
      <ul>
        <li><strong>Nom :</strong> {editeur.nom}</li>
        <li><strong>Statut :</strong> {editeur.statut}</li>
        {editeur.formeJuridique && <li><strong>Forme juridique :</strong> {editeur.formeJuridique}</li>}
        {editeur.rccm && <li><strong>RCCM :</strong> {editeur.rccm}</li>}
        {editeur.niu && <li><strong>NIU :</strong> {editeur.niu}</li>}
        {editeur.adresse && <li><strong>Adresse :</strong> {editeur.adresse}</li>}
        <li><strong>Contact :</strong> <LienContact /></li>
        {editeur.telephone && <li><strong>Téléphone :</strong> {editeur.telephone}</li>}
      </ul>
    ),
  },
  {
    id: "compte",
    titre: "Création et sécurité du compte",
    contenu: (
      <>
        <p>
          L&apos;inscription est réservée aux personnes majeures et aux structures légalement constituées. Vous vous engagez
          à fournir des informations exactes et à les tenir à jour.
        </p>
        <p>
          Vous êtes responsable de la confidentialité de votre mot de passe et de toute action réalisée depuis votre
          compte. En cas d&apos;utilisation non autorisée, prévenez-nous sans délai à{" "}
          <LienContact />.
        </p>
      </>
    ),
  },
  {
    id: "formules",
    titre: "Formules et essai gratuit",
    contenu: (
      <>
        <p>IMMO PILOT propose plusieurs formules, dont le détail et les prix à jour figurent sur la page d&apos;accueil :</p>
        <ul>
          <li><strong>Starter :</strong> gratuite, avec un nombre limité d&apos;immeubles et de locataires ;</li>
          <li><strong>Pro</strong> et <strong>Enterprise :</strong> payantes, avec des limites plus élevées ou illimitées.</li>
        </ul>
        <p>
          Les formules payantes commencent par une période d&apos;essai gratuite, sans engagement et sans moyen de paiement
          à fournir. À la fin de l&apos;essai, l&apos;abonnement doit être payé pour continuer à ajouter ou modifier des données.
        </p>
      </>
    ),
  },
  {
    id: "paiement",
    titre: "Prix, paiement et renouvellement",
    contenu: (
      <>
        <p>
          Les prix sont indiqués en francs CFA (FCFA). L&apos;abonnement se paie d&apos;avance, pour 1, 3 ou 12 mois, par
          Orange Money ou MTN Mobile Money via notre prestataire de paiement <strong>SasPay</strong>. Le paiement de 12 mois
          bénéficie d&apos;une réduction indiquée au moment du paiement.
        </p>
        <p>
          Le paiement doit être validé depuis votre téléphone ou sur la page de paiement sécurisée de SasPay. Une facture
          est émise pour chaque paiement réussi et reste consultable dans <strong>Paramètres → Abonnement</strong>.
        </p>
        <p>
          <strong>Il n&apos;y a pas de renouvellement automatique</strong> : aucun montant n&apos;est prélevé sans une
          nouvelle validation de votre part. Un rappel vous est envoyé avant la date d&apos;échéance.
        </p>
        <p>
          Les sommes versées pour une période commencée ne sont pas remboursables, sauf erreur de facturation ou double
          paiement, qui sont remboursés sur demande.
        </p>
      </>
    ),
  },
  {
    id: "loyers-en-ligne",
    titre: "Paiement des loyers en ligne",
    contenu: (
      <>
        <p>
          Chaque locataire peut payer son loyer depuis son lien personnel, par Orange Money ou MTN Mobile Money via SasPay.
          Le locataire paie le montant exact du loyer. La somme est encaissée par IMMO PILOT puis{" "}
          <strong>reversée automatiquement</strong> sur le compte Mobile Money de réception indiqué pour le logement
          (propriétaire du logement, de l&apos;immeuble ou, à défaut, le bailleur).
        </p>
        <p>
          Les frais du prestataire de paiement (encaissement et reversement) sont <strong>déduits du montant reversé</strong> ;
          le montant reçu est indiqué pour chaque loyer dans la page Paiements. Le bailleur est responsable de
          l&apos;exactitude des numéros de réception qu&apos;il renseigne. Si un reversement n&apos;aboutit pas, le bailleur
          en est averti et la somme lui est reversée après vérification par le support.
        </p>
      </>
    ),
  },
  {
    id: "echeance",
    titre: "Fin d'abonnement et délai de grâce",
    contenu: (
      <>
        <p>
          Si l&apos;abonnement n&apos;est pas renouvelé à l&apos;échéance, vous bénéficiez d&apos;un délai de grâce de quelques
          jours pendant lequel le service reste pleinement utilisable.
        </p>
        <p>
          Passé ce délai, le compte passe en <strong>lecture seule</strong> : vos données restent consultables et
          exportables, mais vous ne pouvez plus en ajouter ni en modifier jusqu&apos;au paiement. Vos données ne sont pas
          supprimées du fait de l&apos;expiration.
        </p>
      </>
    ),
  },
  {
    id: "utilisation",
    titre: "Règles d'utilisation",
    contenu: (
      <>
        <p>Vous vous engagez à ne pas :</p>
        <ul>
          <li>enregistrer des informations fausses, illicites ou portant atteinte aux droits d&apos;autrui ;</li>
          <li>utiliser la plateforme pour harceler vos locataires ou leur adresser des relances abusives ;</li>
          <li>tenter d&apos;accéder aux comptes ou aux données d&apos;autres utilisateurs ;</li>
          <li>perturber le fonctionnement du service (attaques, envois automatisés massifs, contournement des limites).</li>
        </ul>
      </>
    ),
  },
  {
    id: "donnees-locataires",
    titre: "Données de vos locataires",
    contenu: (
      <>
        <p>
          Les informations que vous saisissez sur vos locataires (nom, téléphone, e-mail, bail, paiements) vous
          appartiennent. Vous restez responsable de leur collecte : vous devez informer vos locataires que leurs données sont
          enregistrées dans un outil de gestion et ne collecter que ce qui est nécessaire à la location.
        </p>
        <p>
          IMMO PILOT traite ces données uniquement pour votre compte, afin de fournir le service, et ne les utilise jamais à
          d&apos;autres fins. Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </>
    ),
  },
  {
    id: "disponibilite",
    titre: "Disponibilité et responsabilité",
    contenu: (
      <>
        <p>
          Nous faisons notre possible pour que la plateforme soit accessible en permanence, mais des interruptions peuvent
          survenir (maintenance, panne, problème réseau ou d&apos;opérateur mobile). Les opérations de maintenance sont
          annoncées lorsque c&apos;est possible.
        </p>
        <p>
          IMMO PILOT est un outil d&apos;aide à la gestion : les calculs, relances et rapports ne remplacent pas un conseil
          juridique ou comptable. Notre responsabilité ne peut être engagée pour les décisions prises sur la base des
          informations saisies par l&apos;utilisateur, ni pour les dommages indirects. Pour tout dommage direct, elle est
          limitée aux sommes versées au cours des 12 derniers mois.
        </p>
      </>
    ),
  },
  {
    id: "resiliation",
    titre: "Suspension et résiliation",
    contenu: (
      <>
        <p>
          Vous pouvez cesser d&apos;utiliser le service à tout moment et demander la suppression de votre compte depuis
          l&apos;onglet Support ou par e-mail. Nous vous conseillons d&apos;exporter vos données auparavant.
        </p>
        <p>
          En cas de manquement grave aux présentes Conditions, nous pouvons suspendre votre compte, après vous en avoir
          informé sauf urgence (fraude, atteinte à la sécurité).
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    titre: "Modification des conditions",
    contenu: (
      <p>
        Nous pouvons faire évoluer ces Conditions et nos tarifs. Toute modification importante vous est annoncée au moins
        15 jours à l&apos;avance par notification ou e-mail. Un nouveau tarif ne s&apos;applique qu&apos;au paiement suivant, jamais
        à une période déjà payée.
      </p>
    ),
  },
  {
    id: "droit",
    titre: "Droit applicable et litiges",
    contenu: (
      <p>
        Les présentes Conditions sont soumises au droit camerounais. En cas de désaccord, écrivez-nous d&apos;abord à{" "}
        <LienContact /> afin de trouver une solution amiable. À défaut, le litige
        sera porté devant les juridictions compétentes du ressort du siège de l&apos;éditeur.
      </p>
    ),
  },
];

export default function ConditionsUtilisation() {
  return (
    <PageLegale
      titre="Conditions d'utilisation"
      introduction={
        <p>
          Merci de lire attentivement ces conditions : elles expliquent ce que vous pouvez attendre d&apos;IMMO PILOT, comment
          fonctionnent les abonnements et quelles sont vos obligations en tant qu&apos;utilisateur.
        </p>
      }
      sections={sections}
      autrePage={{ href: "/confidentialite", label: "Politique de confidentialité" }}
    />
  );
}
