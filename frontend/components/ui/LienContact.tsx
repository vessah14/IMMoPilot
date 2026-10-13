import Link from "next/link";
import { editeur } from "@/lib/legal";

// Moyen de contact affiché dans les pages légales : l'e-mail s'il est configuré, sinon le formulaire Support
export default function LienContact() {
  return editeur.email ? (
    <a href={`mailto:${editeur.email}`}>{editeur.email}</a>
  ) : (
    <Link href="/admin/parametres?onglet=support">le formulaire Support de votre espace</Link>
  );
}
