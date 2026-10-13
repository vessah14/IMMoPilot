import type { Metadata } from "next";
import CadreAuth from "@/components/auth/CadreAuth";
import { FormulaireMotDePasseOublie } from "@/components/auth/FormulairesMotDePasse";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function MotDePasseOublie() {
  return (
    <CadreAuth>
      <FormulaireMotDePasseOublie />
    </CadreAuth>
  );
}
