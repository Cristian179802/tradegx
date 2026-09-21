import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// ── Foaia de tipar ───────────────────────────────────────────────────────────
//
// PDF-ul se face PE TELEFON, din HTML. Pagina web îl scoate prin dialogul de
// tipărire al browserului — ceva ce pe Android nu există ca gest.
//
// DE CE HTML și nu un desen pas cu pas: un raport e text, tabele și cifre
// aliniate. Într-o bibliotecă de PDF desenat manual, fiecare tabel înseamnă
// socotit lățimi de coloană și rupturi de pagină de mână. În HTML, motorul de
// tipărire al sistemului le face singur, corect, inclusiv pe mai multe pagini.
//
// CIFRELE VIN DE LA SERVER, întotdeauna. Aici nu se calculează nimic — se
// formatează. Un raport care ar recalcula pe telefon ar putea da altceva decât
// arată site-ul, iar pe raportul fiscal asta n-ar fi o nepotrivire de
// interfață.
//
// Stilul e alb pe hârtie, nu tema întunecată a aplicației. Un PDF cu fundal
// negru costă un cartuș de toner și nu se poate citi tipărit.

/** Culorile foii. Separate de tema aplicației, fiindcă hârtia e albă. */
const H = {
  text: "#18181b",
  slab: "#71717a",
  linie: "#e4e4e7",
  accent: "#4f46e5",
  castig: "#059669",
  pierdere: "#e11d48",
};

export interface RandTabel {
  eticheta: string;
  valori: string[];
  /** Colorează prima valoare după semn — pentru coloanele de bani. */
  ton?: "castig" | "pierdere" | null;
}

export interface SectiuneFoaie {
  titlu: string;
  /** Perechi cheie–valoare, afișate pe două coloane. */
  perechi?: { cheie: string; valoare: string; ton?: "castig" | "pierdere" | null }[];
  /** Tabel cu antet. */
  capete?: string[];
  randuri?: RandTabel[];
  nota?: string;
}

export interface Foaie {
  titlu: string;
  subtitlu: string;
  sectiuni: SectiuneFoaie[];
  subsol?: string;
}

/** Scapă textul care ajunge în HTML. Datele vin de la server, dar tot le tratăm ca text. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function culoare(ton?: "castig" | "pierdere" | null): string {
  if (ton === "castig") return H.castig;
  if (ton === "pierdere") return H.pierdere;
  return H.text;
}

export function construiesteHtml(f: Foaie): string {
  const sectiuni = f.sectiuni
    .map((s) => {
      const perechi = s.perechi?.length
        ? `<div class="grila">${s.perechi
            .map(
              (p) =>
                `<div class="pereche"><span class="cheie">${esc(p.cheie)}</span><span class="valoare" style="color:${culoare(p.ton)}">${esc(p.valoare)}</span></div>`,
            )
            .join("")}</div>`
        : "";

      const tabel =
        s.capete && s.randuri?.length
          ? `<table>
              <thead><tr>${s.capete.map((c, i) => `<th${i > 0 ? ' class="dr"' : ""}>${esc(c)}</th>`).join("")}</tr></thead>
              <tbody>${s.randuri
                .map(
                  (r) =>
                    `<tr><td>${esc(r.eticheta)}</td>${r.valori
                      .map(
                        (v, i) =>
                          `<td class="dr"${i === r.valori.length - 1 && r.ton ? ` style="color:${culoare(r.ton)}"` : ""}>${esc(v)}</td>`,
                      )
                      .join("")}</tr>`,
                )
                .join("")}</tbody>
            </table>`
          : "";

      const nota = s.nota ? `<p class="nota">${esc(s.nota)}</p>` : "";
      return `<section><h2>${esc(s.titlu)}</h2>${perechi}${tabel}${nota}</section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ro"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Roboto", "Helvetica Neue", Arial, sans-serif;
    color: ${H.text}; margin: 0; padding: 32px 30px; font-size: 12px; line-height: 1.5;
  }
  header { border-bottom: 2px solid ${H.accent}; padding-bottom: 14px; margin-bottom: 22px; }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: -0.3px; }
  .sub { color: ${H.slab}; font-size: 11px; margin: 0; }
  .marca { color: ${H.accent}; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px; }
  section { margin-bottom: 22px; page-break-inside: avoid; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: ${H.slab}; margin: 0 0 10px; font-weight: 700; }
  .grila { display: flex; flex-wrap: wrap; }
  .pereche { width: 50%; display: flex; justify-content: space-between; padding: 5px 12px 5px 0; border-bottom: 1px solid ${H.linie}; }
  .cheie { color: ${H.slab}; }
  .valoare { font-weight: 700; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: ${H.slab}; padding: 6px 8px; border-bottom: 1px solid ${H.linie}; }
  td { padding: 6px 8px; border-bottom: 1px solid ${H.linie}; font-variant-numeric: tabular-nums; }
  .dr { text-align: right; }
  .nota { color: ${H.slab}; font-size: 10px; margin: 8px 0 0; }
  footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid ${H.linie}; color: ${H.slab}; font-size: 10px; }
</style></head>
<body>
  <header>
    <p class="marca">TradeGx</p>
    <h1>${esc(f.titlu)}</h1>
    <p class="sub">${esc(f.subtitlu)}</p>
  </header>
  ${sectiuni}
  ${f.subsol ? `<footer>${esc(f.subsol)}</footer>` : ""}
</body></html>`;
}

export type RezultatFoaie =
  | { fel: "partajat" }
  | { fel: "salvat"; cale: string }
  | { fel: "eroare"; mesaj: string };

/**
 * Face PDF-ul și deschide foaia de partajare a sistemului.
 *
 * Partajarea e pasul care contează: un fișier scris într-un dosar al aplicației
 * și nimic altceva ar fi fost inutil — omul vrea să-l trimită contabilului, nu
 * să-l aibă undeva pe telefon.
 */
export async function faPdf(f: Foaie, numeFisier: string): Promise<RezultatFoaie> {
  try {
    const { uri } = await Print.printToFileAsync({
      html: construiesteHtml(f),
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: numeFisier,
        UTI: "com.adobe.pdf",
      });
      return { fel: "partajat" };
    }

    // Fără foaie de partajare (rar, dar se întâmplă pe unele ROM-uri) spunem
    // unde e fișierul, în loc să pretindem că s-a întâmplat ceva.
    return { fel: "salvat", cale: uri };
  } catch (e) {
    return {
      fel: "eroare",
      mesaj: e instanceof Error ? e.message : "Nu am putut genera PDF-ul.",
    };
  }
}
