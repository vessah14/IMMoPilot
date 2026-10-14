import Image from "next/image";
import fond from "@/public/images/Fond.png";

type ImageFondProps = {
  sizes?: string; // largeur affichée, pour que Next envoie une image à la bonne taille
  prioritaire?: boolean; // image visible dès l'ouverture de la page : chargée en premier
  className?: string;
};

// Image de fond (immeuble) optimisée par Next : WebP/AVIF à la taille de l'écran au lieu du PNG de 1,6 Mo,
// avec un aperçu flou affiché tout de suite pendant le chargement
export default function ImageFond({ sizes = "100vw", prioritaire = false, className = "" }: ImageFondProps) {
  return (
    <Image
      src={fond}
      alt=""
      fill
      sizes={sizes}
      placeholder="blur"
      fetchPriority={prioritaire ? "high" : undefined}
      loading={prioritaire ? "eager" : undefined}
      className={`object-cover object-center ${className}`}
    />
  );
}
