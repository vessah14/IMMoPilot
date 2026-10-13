"use client";

import { useEffect, useRef, useState } from "react";

type ApparitionProps = {
  children: React.ReactNode;
  delai?: number; // en millisecondes, pour décaler plusieurs éléments
  className?: string;
};

// Fait apparaître son contenu (fondu + glissement vers le haut)
// quand il arrive à l'écran pendant le défilement. Une seule fois.
export default function Apparition({ children, delai = 0, className = "" }: ApparitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // on n'anime qu'une fois
        }
      },
      // Se déclenche quand l'élément dépasse un peu le bas de l'écran
      { rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delai}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
