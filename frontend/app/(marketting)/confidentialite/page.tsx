import type { Metadata } from "next";
import Link from "next/link";
import PageLegale, { type SectionLegale } from "@/components/ui/PageLegale";
import { editeur } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment IMMO PILOT collecte, utilise et protège vos données personnelles.",
};

const sections: SectionLegale[] = [
  {
    id: "responsable",
    titre: "Qui est responsable de vos données ?",
    contenu: (
      <>
        <p>
          <strong>{editeur.nom}</strong> ({editeur.adresse}) est responsable des données de ses clients : les bailleurs et
          gestionnaires qui créent un compte.
        </p>
        <p>
          Pour les données des <strong>locataires</strong> saisies par un bailleur, c&apos;est le bailleur qui est
          responsable : IMMO PILOT agit uniquement pour son compte, comme sous-traitant.
        </p>
        <p>
          Contact pour toute question sur vos données : <a href={`mailto:${editeur.email}`}>{editeur.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: "donnees",
    titre: "Données collectées",
    contenu: (
      <>
        <p><strong>Votre compte :</strong></p>
        <ul>
          <li>nom complet, e-mail, téléphone, ville, adresse, nom de votre agence ou structure ;</li>
          <li>mot de passe, conservé uniquement sous forme chiffrée (hachée) : personne, même chez nous, ne peut le lire ;</li>
          <li>formule choisie, dates d&apos;abonnement, date d&apos;inscription et de dernière connexion.</li>
        </ul>
        <p><strong>Vos données de gestion :</strong></p>
        <ul>
          <li>immeubles (adresse, photo), logements, loyers et paiements enregistrés ;</li>
          <li>locataires : nom, téléphone, e-mail, dates de bail, loyer, caution, historique des paiements et relances ;</li>
          <li>vos échanges avec le support.</li>
        </ul>
        <p><strong>Vos paiements d&apos;abonnement :</strong></p>
        <ul>
          <li>
            numéro Mobile Money utilisé, montant, opérateur et référence de la transaction. Nous ne recevons
            <strong> jamais votre code secret</strong> Orange Money ou MTN MoMo : la validation se fait sur votre téléphone.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "finalites",
    titre: "Pourquoi nous les utilisons",
    contenu: (
      <ul>
        <li>fournir le service : gestion de vos biens, suivi des loyers, relances, rapports et notifications ;</li>
        <li>gérer votre compte, votre abonnement, vos paiements et vos factures ;</li>
        <li>répondre à vos demandes de support ;</li>
        <li>assurer la sécurité de la plateforme (connexion, prévention des fraudes et des abus) ;</li>
        <li>respecter nos obligations légales, notamment comptables et fiscales.</li>
      </ul>
    ),
  },
  {
    id: "partage",
    titre: "Avec qui elles sont partagées",
    contenu: (
      <>
        <p>
          <strong>Nous ne vendons ni ne louons vos données</strong> et nous ne les utilisons pas pour de la publicité. Elles
          sont transmises uniquement aux prestataires nécessaires au service :
        </p>
        <ul>
          <li><strong>CamPay</strong>, ainsi qu&apos;Orange et MTN, pour le traitement des paiements Mobile Money ;</li>
          <li><strong>Cloudinary</strong>, pour l&apos;hébergement des photos d&apos;immeubles ;</li>
          <li>notre hébergeur, pour le stockage sécurisé de la base de données.</li>
        </ul>
        <p>
          Certains de ces prestataires peuvent héberger des données hors du Cameroun ; nous choisissons des prestataires
          offrant des garanties de sécurité adaptées. Vos données peuvent aussi être communiquées aux autorités lorsque la loi
          l&apos;exige.
        </p>
      </>
    ),
  },
  {
    id: "conservation",
    titre: "Combien de temps nous les gardons",
    contenu: (
      <ul>
        <li>données du compte et de gestion : tant que le compte est ouvert, puis supprimées dans un délai de 3 mois après sa fermeture ;</li>
        <li>factures et paiements d&apos;abonnement : 10 ans, durée imposée par les obligations comptables ;</li>
        <li>demandes de support : 2 ans après leur clôture.</li>
      </ul>
    ),
  },
  {
    id: "securite",
    titre: "Comment nous les protégeons",
    contenu: (
      <ul>
        <li>mots de passe hachés et jamais stockés en clair ;</li>
        <li>session protégée par un cookie sécurisé, inaccessible aux scripts de la page ;</li>
        <li>chaque bailleur n&apos;accède qu&apos;à ses propres données ;</li>
        <li>limitation des tentatives de connexion pour bloquer les attaques par essais successifs ;</li>
        <li>paiements vérifiés directement auprès de CamPay avant d&apos;activer un abonnement.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    titre: "Cookies",
    contenu: (
      <p>
        IMMO PILOT utilise uniquement un <strong>cookie de session</strong>, indispensable pour vous garder connecté. Il ne
        sert ni à la publicité ni au suivi de votre navigation, et il est supprimé à la déconnexion. Aucun cookie publicitaire
        ou de mesure d&apos;audience tiers n&apos;est utilisé.
      </p>
    ),
  },
  {
    id: "droits",
    titre: "Vos droits",
    contenu: (
      <>
        <p>Conformément à la réglementation camerounaise sur la protection des données personnelles, vous pouvez :</p>
        <ul>
          <li>accéder à vos données et en obtenir une copie ;</li>
          <li>les faire corriger si elles sont inexactes (la plupart sont modifiables dans <strong>Paramètres</strong>) ;</li>
          <li>demander leur suppression, sous réserve des données que la loi nous oblige à conserver ;</li>
          <li>vous opposer à certains traitements ou en demander la limitation.</li>
        </ul>
        <p>
          Écrivez-nous à <a href={`mailto:${editeur.email}`}>{editeur.email}</a> ou utilisez l&apos;onglet Support de votre
          espace. Nous répondons dans un délai d&apos;un mois. Un locataire qui souhaite exercer ses droits doit s&apos;adresser
          à son bailleur ; nous l&apos;aiderons à y répondre.
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    titre: "Modifications de cette politique",
    contenu: (
      <p>
        Nous pouvons mettre à jour cette politique, par exemple en cas de nouveau prestataire ou de nouvelle fonctionnalité.
        La date de mise à jour figure en haut de la page, et toute modification importante vous est signalée dans votre
        espace. Voir aussi nos <Link href="/conditions-utilisation">conditions d&apos;utilisation</Link>.
      </p>
    ),
  },
];

export default function Confidentialite() {
  return (
    <PageLegale
      titre="Politique de confidentialité"
      introduction={
        <p>
          La confiance de nos clients et de leurs locataires est essentielle. Cette page explique simplement quelles données
          IMMO PILOT collecte, pourquoi, avec qui elles sont partagées et comment exercer vos droits.
        </p>
      }
      sections={sections}
      autrePage={{ href: "/conditions-utilisation", label: "Conditions d'utilisation" }}
    />
  );
}
