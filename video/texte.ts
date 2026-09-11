import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// ── Textele de pe ecran, randate în browser ──────────────────────────────────
//
// `drawtext` din ffmpeg nu poate scrie textele astea. Nu e o limitare a lui, ci
// a felului în care ajung fonturile la noi: `next/font` descarcă fontul de la
// Google tăiat pe intervale unicode și scrie câte un `.woff2` pentru fiecare.
// Browserul le lipește la loc prin `unicode-range`; drawtext deschide un singur
// fișier.
//
// Am încercat, în ordine:
//
//   1. cel mai mare subset        → „Pierzi. Dar ?tii exact de ce?”
//   2. subsetul cu diacriticele   → toate literele ASCII ca pătrățele
//   3. reunirea subseturilor cu fontTools → Space Grotesk e font VARIABIL, iar
//      `Merger` nu știe tabelele de variație (`VarStore has no mergeMap`)
//
// Niciun fișier nu conține și ASCII, și `ș`. Așa că textul se randează unde
// fontul e deja întreg și corect configurat: în pagină. Ies PNG-uri cu fundal
// transparent, pe care montajul le suprapune.
//
// Bonus, nu compromis: kerning și shaping reale, aceleași greutăți și aceeași
// interliniere ca în produs — iar la faza 6 se poate schimba stilul din CSS, nu
// din parametri de filtru.

export interface TextDeRandat {
  id: string;
  text: string;
  marime: number;
  /** `titlu` = Space Grotesk, `corp` = Inter — variabilele din design system. */
  font: "titlu" | "corp";
}

const CFG = {
  url: process.env.APP_URL ?? "http://localhost:3000",
  dir: process.env.TEXTE_OUT ?? "out/texte",
  latime: Number(process.env.TEXTE_W ?? 1280),
} as const;

/**
 * Randează fiecare text într-un PNG transparent și întoarce căile.
 *
 * Pagina aplicației e încărcată ca să avem `@font-face`-urile ei; textul se
 * injectează peste, într-un strat propriu. Nu contează ce pagină e — contează
 * doar că fonturile de brand sunt declarate în ea.
 */
export async function randeazaTexte(texte: TextDeRandat[]): Promise<Map<string, string>> {
  mkdirSync(CFG.dir, { recursive: true });
  const cai = new Map<string, string>();

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: CFG.latime, height: 400 },
      deviceScaleFactor: 2, // marginile literelor rămân curate la suprapunere
      colorScheme: "dark",
    });
    const page = await context.newPage();
    await page.goto(`${CFG.url}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);

    for (const t of texte) {
      const cale = join(CFG.dir, `${t.id}.png`);
      await page.evaluate(
        (d) => {
          document.getElementById("__tgx_text")?.remove();

          // Pagina se ascunde, elementul nostru rămâne vizibil.
          //
          // `omitBackground` face transparent fundalul PAGINII, nu conținutul
          // ei. Caseta noastră are fundal semitransparent, deci prin ea se
          // vedea formularul de login: în primul PNG se citea „TradeGx” și
          // „AUTH” pe sub literele hook-ului.
          document.body.style.visibility = "hidden";

          const el = document.createElement("div");
          el.id = "__tgx_text";
          el.style.visibility = "visible";
          // Stilul e al produsului: aceleași variabile de font ca în aplicație.
          el.style.cssText = [
            "position:fixed",
            "visibility:visible",
            "left:0",
            "top:0",
            "z-index:2147483647",
            "display:inline-block",
            "padding:18px 34px",
            "white-space:nowrap",
            "color:#fff",
            "background:rgba(9,9,11,0.52)",
            "border-radius:14px",
            "text-shadow:0 2px 6px rgba(0,0,0,0.6)",
            "letter-spacing:-0.01em",
            `font-size:${d.marime}px`,
            "font-weight:700",
            `font-family:var(${d.font === "titlu" ? "--font-display" : "--font-sans"}), system-ui, sans-serif`,
          ].join(";");
          el.textContent = d.text;
          document.body.appendChild(el);
        },
        { text: t.text, marime: t.marime, font: t.font }
      );
      // Fonturile se pot încărca abia acum, dacă textul cere un subset neatins
      // până aici. Fără așteptarea asta, primul PNG iese cu fontul de rezervă.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);

      const el = page.locator("#__tgx_text");
      await el.screenshot({ path: cale, omitBackground: true });
      cai.set(t.id, cale);
      console.log(`  text       ${t.id}.png  „${t.text}”`);
    }
    await context.close();
  } finally {
    await browser.close();
  }
  return cai;
}
