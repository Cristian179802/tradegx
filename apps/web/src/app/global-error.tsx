"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// ── Ultima plasă ─────────────────────────────────────────────────────────────
//
// Asta prinde ce se strică în LAYOUT-UL RĂDĂCINĂ. E singurul caz în care
// `ClientErrorReporter` nu ne ajută cu nimic: el se montează în layout, deci
// dacă layout-ul a crăpat, ascultătorul n-a apucat să existe. Cea mai gravă
// defecțiune ar fi fost exact cea despre care n-am fi aflat niciodată.
//
// Fără `global-error.tsx`, Next.js afișează aici o pagină albă generică, fără
// nimic din site — și nu ne spune nouă nimic.
//
// DE CE STILURI ÎN LINIE, nu clase: dacă am ajuns aici, presupunerea sănătoasă
// e că nimic nu s-a încărcat cum trebuie. Pagina asta nu depinde de fișierul de
// stiluri, de fonturi, de providere sau de vreo bibliotecă de iconițe — doar de
// React. Cu cât depinde de mai puțin, cu atât are șanse mai mari să apară.
//
// Randează propriul <html>/<body> pentru că ÎNLOCUIEȘTE layout-ul rădăcină.

const T = {
  ro: {
    title: "Ceva s-a stricat",
    desc: "Nu am putut încărca pagina. Am fost anunțați automat și ne uităm peste asta.",
    tryAgain: "Reîncarcă",
  },
  en: {
    title: "Something broke",
    desc: "We couldn't load the page. We've been notified automatically and we're looking into it.",
    tryAgain: "Reload",
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportClientError(error, { route: "layout-radacina" });
  }, [error]);

  const locale =
    typeof document !== "undefined" && /(?:^|;\s*)locale=en\b/.test(document.cookie) ? "en" : "ro";
  const t = T[locale as "ro" | "en"];

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#09090b",
          color: "#e4e4e7",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 24px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(244,63,94,0.10)",
              border: "1px solid rgba(244,63,94,0.20)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fb7185"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>{t.title}</h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#71717a", margin: "0 0 24px" }}>
            {t.desc}
          </p>

          <button
            onClick={reset}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(to right, #4f46e5, #7c3aed)",
            }}
          >
            {t.tryAgain}
          </button>

          {/* Codul cererii: dacă omul ne scrie, îl leagă direct de rândul din jurnal. */}
          {error.digest ? (
            <p style={{ fontSize: "11px", color: "#3f3f46", marginTop: "24px" }}>
              cod: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
