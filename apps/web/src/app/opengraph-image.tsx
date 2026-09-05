import { ImageResponse } from "next/og";

// ── Imaginea care apare când cineva dă linkul mai departe ────────────────────
//
// Metadatele declarau `twitter:card = "summary_large_image"` fără să dea vreo
// imagine. Un card „large image" fără imagine se randează gol pe X, LinkedIn,
// WhatsApp, Discord și Slack — deci fiecare link TradeGx partajat până acum,
// inclusiv paginile publice de tranzacție (`/share/trade/[id]`), arăta ca un
// link stricat exact în momentul în care cineva îl arăta altcuiva.
//
// Generată, nu un fișier: rămâne sincronizată cu numele și culorile produsului
// și nu se poate pierde la un refactor de assets. Next o leagă singur atât la
// `og:image`, cât și la `twitter:image`, pentru toate rutele.

export const alt = "TradeGx — Pro Trading Journal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const S0 = "#09090b"; // fundalul aplicației
const INK1 = "#fafafa";
const INK3 = "#a1a1aa";
const ACCENT = "#6366f1";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: S0,
          // Aceeași grămadă de accent ca marginea șinei de navigație.
          backgroundImage: `radial-gradient(circle at 12% 8%, rgba(99,102,241,0.20), transparent 46%)`,
          padding: "0 84px",
        }}
      >
        {/* Firul de accent: singurul element decorativ, ca în aplicație. */}
        <div style={{ display: "flex", width: 96, height: 5, background: ACCENT, borderRadius: 3 }} />

        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 800,
            color: INK1,
            letterSpacing: "-0.035em",
            marginTop: 36,
          }}
        >
          TradeGx
        </div>

        <div style={{ display: "flex", fontSize: 40, color: INK3, marginTop: 18, letterSpacing: "-0.015em" }}>
          Jurnal de trading profesional
        </div>

        {/* Ce face produsul, în cuvintele cu care îl caută cineva. */}
        <div style={{ display: "flex", gap: 14, marginTop: 46 }}>
          {["Analiză", "Backtesting", "AI Coach", "Prop Firm"].map((eticheta) => (
            <div
              key={eticheta}
              style={{
                display: "flex",
                fontSize: 25,
                color: INK3,
                border: "1px solid rgba(99,102,241,0.34)",
                background: "rgba(99,102,241,0.10)",
                borderRadius: 999,
                padding: "10px 24px",
              }}
            >
              {eticheta}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 27, color: ACCENT, marginTop: 52, fontWeight: 600 }}>
          tradegx.com
        </div>
      </div>
    ),
    size
  );
}
