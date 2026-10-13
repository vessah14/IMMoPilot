"use client";

import { Download } from "lucide-react";
import Button from "@/components/ui/Button";

type Props = {
  nomFichier: string; // sans extension, ex : "immeubles"
  entetes: string[];
  lignes: (string | number | null)[][];
  label?: string;
};

// Télécharge les données sous forme de fichier CSV (s'ouvre dans Excel ou LibreOffice)
export default function BoutonExport({ nomFichier, entetes, lignes, label = "Exporter" }: Props) {
  const exporter = () => {
    // Point-virgule : séparateur attendu par Excel en français ; guillemets doublés dans les valeurs
    const cellule = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const contenu = [entetes, ...lignes].map((ligne) => ligne.map(cellule).join(";")).join("\r\n");

    // "﻿" : indique l'UTF-8 à Excel pour que les accents s'affichent correctement
    const fichier = new Blob(["﻿" + contenu], { type: "text/csv;charset=utf-8" });
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(fichier);
    lien.download = `${nomFichier}-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  };

  return (
    <Button variant="outline" icon={Download} onClick={exporter} disabled={lignes.length === 0}>
      {label}
    </Button>
  );
}
