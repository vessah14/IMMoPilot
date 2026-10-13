"use client";

import { useState } from "react";
import SideBarre from "@/components/layout/SideBarre";
import HeaderBarre from "@/components/layout/HeaderBarre";
import type { ConfigEspace } from "@/components/layout/navigation";

// Structure commune des espaces du dashboard : sidebar + barre du haut + contenu.
// Utilisée via un composant client (CoqueAdmin) qui lui fournit sa configuration
// (les icônes du menu ne peuvent pas venir d'un composant serveur).
export default function CoqueDashboard({ config, children }: { config: ConfigEspace; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <SideBarre
        config={config}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Fond sombre derrière la sidebar ouverte — mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
      )}

      {/* Contenu : décalé de la largeur de la sidebar sur ordinateur */}
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <HeaderBarre config={config} onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
