import { ImageResponse } from "next/og";

// Image affichée quand le site est partagé (WhatsApp, LinkedIn, Facebook…)
export const alt = "IMMO PILOT : la gestion locative simplifiée";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0f2a43 0%, #1d4ed8 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>
          IMMO&nbsp;<span style={{ color: "#93c5fd" }}>PILOT</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#dbeafe" }}>Gérez vos immeubles. Gardez le contrôle.</div>
        <div style={{ marginTop: 48, display: "flex", gap: 24, fontSize: 28, color: "#bfdbfe" }}>
          <span>Immeubles</span>·<span>Locataires</span>·<span>Loyers</span>·<span>Orange Money / MTN MoMo</span>
        </div>
      </div>
    ),
    size,
  );
}
