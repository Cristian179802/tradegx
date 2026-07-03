import type { MetadataRoute } from "next";

// PWA — site instalabil ca aplicație (desktop + iPhone, unde nu avem APK).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeGx — Jurnal de Trading Profesional",
    short_name: "TradeGx",
    description:
      "Jurnal de trading profesional pentru traderi SMC/ICT: analytics, AI coach, backtesting, academie.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "ro",
    categories: ["finance", "productivity", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
