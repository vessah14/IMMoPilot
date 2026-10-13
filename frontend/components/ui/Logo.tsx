import Image from "next/image";

type LogoProps = {
  texte?: boolean; // afficher "IMMO PILOT" à côté du symbole
  sombre?: boolean; // version pour fond foncé (sidebar)
  className?: string; // hauteur du symbole, ex : "h-10"
};

export default function Logo({ texte = true, sombre = false, className = "h-9" }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* Sur fond foncé, le symbole (bleu marine) est posé sur une pastille blanche pour rester visible */}
      <span className={sombre ? "shrink-0 rounded-lg bg-white p-1.5" : "shrink-0"}>
        <Image
          src="/logo-icone.svg"
          alt={texte ? "" : "IMMO PILOT"}
          width={572}
          height={479}
          unoptimized
          priority
          className={`w-auto ${className}`}
        />
      </span>
      {texte && (
        <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
          <span className={sombre ? "text-white" : "text-blue-950"}>IMMO </span>
          <span className={sombre ? "text-blue-400" : "text-blue-600"}>PILOT</span>
        </span>
      )}
    </span>
  );
}
