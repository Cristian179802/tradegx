import { chromium, type Browser, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import { Inregistrare } from "./recorder";
import { raporteaza, verificaMediul } from "./env";

// ── Scriptul de validare a mediului ──────────────────────────────────────────
//
// Nu e videoul. E cel mai scurt drum care atinge TOT ce poate strica videoul:
// login, o pagină cu grafic, un filtru, și animația de recalculare. Dacă
// secvența asta iese fluidă în raw.mkv, mediul e bun pentru restul.
//
// Ordinea e importantă și e singurul motiv pentru care browserul și ffmpeg sunt
// pornite din ACELAȘI proces: ffmpeg trebuie să înceapă când pagina e gata, iar
// „gata" e ceva ce doar browserul știe.

const CFG = {
  url: process.env.APP_URL ?? "https://www.tradegx.com",
  email: process.env.DEMO_EMAIL ?? "demo@tradegx.com",
  parola: process.env.DEMO_PASSWORD ?? "DemoTrader2026!",
  display: process.env.DISPLAY ?? ":99",
  latime: Number(process.env.CAPTURE_WIDTH ?? 1920),
  inaltime: Number(process.env.CAPTURE_HEIGHT ?? 1080),
  fps: Number(process.env.CAPTURE_FPS ?? 60),
  // Fusul și limba trebuie să fie ALE TALE, nu ale containerului: orele de
  // sesiune sunt chiar subiectul videoului.
  timezone: process.env.CAPTURE_TZ ?? "Europe/Bucharest",
  locale: process.env.CAPTURE_LOCALE ?? "ro-RO",
  // Relative la directorul de lucru, deci corecte și în container (WORKDIR
  // /studio) și rulate nativ din video/. Fără ramuri per mediu.
  iesire: process.env.CAPTURE_OUT ?? "out/raw.mkv",
  capturi: process.env.CAPTURE_SHOTS ?? "out",
  // Trebuie sa fie ACEEASI valoare ca in entrypoint.sh, altfel fereastra si
  // ecranul nu se potrivesc.
  rezervaCrom: Number(process.env.CAPTURE_CHROME_RESERVE ?? 140),
} as const;

/** Așteptare care nu depinde de rețea — doar pentru ritm, nu pentru încărcări. */
const respira = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function deschideBrowser(): Promise<Browser> {
  return chromium.launch({
    // HEADED, pe ecranul virtual: headless randează altfel fonturile și nu
    // există nimic de filmat cu x11grab.
    headless: false,
    env: { ...process.env, DISPLAY: CFG.display } as Record<string, string>,
    args: [
      // Fără sandbox: în container nu există user namespaces.
      "--no-sandbox",
      "--disable-dev-shm-usage",
      // Constrângerea 4: un scrollbar în cadru arată amatoricesc.
      "--hide-scrollbars",
      // Fereastra ocupă exact ecranul, fără decorații — altfel apare o bordură
      // de window manager în captură.
      // Fereastra ocupa tot ecranul, inclusiv rezerva de crom: asa pagina de sub
      // bara de adrese are exact inaltimea ceruta.
      `--window-size=${CFG.latime},${CFG.inaltime + CFG.rezervaCrom}`,
      "--window-position=0,0",
      "--start-fullscreen",
      "--kiosk",
      // Fără GPU în Xvfb. SwiftShader dă un randator software consistent, în
      // loc să lase Chromium să cadă pe căi diferite de la o rulare la alta.
      "--use-gl=swiftshader",
      "--enable-unsafe-swiftshader",
      // Zgomot vizual care n-are ce căuta într-un cadru de marketing.
      "--disable-infobars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-features=Translate,MediaRouter",
      // NU pasăm --force-prefers-reduced-motion: ar opri exact animația pe care
      // o filmăm. Menționat explicit ca nimeni să nu-l adauge „pentru
      // stabilitate".
    ],
  });
}

async function autentifica(page: Page): Promise<void> {
  await page.goto(`${CFG.url}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(CFG.email);
  await page.locator('input[type="password"]').first().fill(CFG.parola);
  await page.locator('button[type="submit"]').first().click();
  // Așteptăm PLECAREA de pe /login, nu un timp fix: autentificarea poate dura
  // 400 ms sau 4 s, și amândouă sunt normale.
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45_000 });
}

async function main() {
  mkdirSync(CFG.capturi, { recursive: true });

  const browser = await deschideBrowser();
  const context = await browser.newContext({
    viewport: { width: CFG.latime, height: CFG.inaltime },
    // Constrângerea 1, explicit. Fără asta, componenta de statistici oprește
    // rostogolirea cifrelor și filmăm salturi.
    reducedMotion: "no-preference",
    // Constrângerea 3.
    timezoneId: CFG.timezone,
    locale: CFG.locale,
    // deviceScaleFactor rămâne 1: ecranul Xvfb are exact 1920x1080 pixeli
    // fizici. La 2, o fereastră de 1920 CSS ar cere 3840 fizici și n-ar încăpea
    // — vezi nota din README despre captura la 4K.
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });

  // `tsx` compilează prin esbuild, care injectează un ajutor numit `__name`
  // pentru a păstra numele funcțiilor. Când o funcție ajunge în browser prin
  // `page.evaluate`, i se trimite SURSA transformată — care cheamă `__name`,
  // inexistent acolo. Rezultatul e „ReferenceError: __name is not defined" la
  // prima evaluare, un mesaj care nu spune nimic despre cauza reală.
  //
  // Îl definim ca funcție identitate în fiecare pagină. Scris ca șir, nu ca
  // funcție: o funcție ar trece prin aceeași transformare și ar avea aceeași
  // problemă.
  await context.addInitScript({ content: "globalThis.__name = globalThis.__name || ((f) => f);" });

  const page = await context.newPage();
  // Prima pagină se deschide înainte de orice `goto`, deci scriptul de mai sus
  // se aplică; dar `addInitScript` prinde doar navigările următoare, iar pagina
  // curentă e încă `about:blank`. Nimic de făcut aici — primul `goto` vine
  // imediat.
  // Recorder-ul primeste decalajul abia dupa ce masuram cromul in browser —
  // vezi mai jos. Pana atunci, 0.
  const rec = new Inregistrare({
    display: CFG.display,
    latime: CFG.latime,
    inaltime: CFG.inaltime,
    fps: CFG.fps,
    iesire: CFG.iesire,
  });

  try {
    // ── Verificarea mediului, ÎNAINTE de orice filmare ──
    await page.goto(CFG.url, { waitUntil: "domcontentloaded" });
    const verificari = await verificaMediul(page);
    if (raporteaza(verificari).opreste) {
      process.exitCode = 1;
      return;
    }

    // ── Pregătirea, NEFILMATĂ ──
    console.log("  autentificare…");
    await autentifica(page);

    console.log("  deschid analytics…");
    await page.goto(`${CFG.url}/analytics`, { waitUntil: "domcontentloaded" });

    // Semnalul real: curba nu se mai schimbă. Fără el am filma spinnere.
    await page.waitForSelector("[data-chart-ready]", { timeout: 60_000 });
    await page.locator('[data-testid="setup-session-matrix"]').scrollIntoViewIfNeeded();
    await respira(400); // derularea are inerție proprie

    await page.screenshot({ path: `${CFG.capturi}/inainte-de-filmare.png` });

    // Cât ocupă taburile și bara de adrese, MĂSURAT — nu ghicit. Diferă între
    // versiuni de Chromium, iar o valoare greșită fie lasă bara în cadru, fie
    // taie din pagină.
    const crom = await page.evaluate(() => window.outerHeight - window.innerHeight);

    // Rezerva de pe ecran e finită. Dacă acest Chromium are cromul mai înalt
    // decât ea (altă versiune, o bară de marcaje apărută de undeva), decupajul
    // ar depăși marginea de jos a ecranului: ffmpeg fie refuză, fie umple cu
    // negru. Mai bine se oprește aici, cu numărul de care are nevoie.
    if (crom > CFG.rezervaCrom) {
      throw new Error(
        `cromul browserului are ${crom}px, dar rezerva de pe ecran e ${CFG.rezervaCrom}px. ` +
        `Repornește cu CAPTURE_CHROME_RESERVE=${Math.ceil(crom / 10) * 10}.`
      );
    }
    rec.seteazaDecalaj(crom);
    console.log(`  cromul browserului: ${crom}px din ${CFG.rezervaCrom}px rezervă — filmez de sub el`);

    // ── De aici încolo se filmează ──
    console.log("  pornesc înregistrarea…");
    rec.porneste();
    await respira(700); // primele cadre: un moment de așezare, nu o tăietură

    console.log(`  [${rec.msDeLaStart}ms] filtru: FVG`);
    await page.locator('[data-testid="setup-filter-fair_value_gap"]').click();
    await respira(1600); // cifrele se rostogolesc ~620ms; lăsăm să se așeze

    console.log(`  [${rec.msDeLaStart}ms] filtru: FVG · Asia`);
    await page.locator('[data-testid="cell-fair_value_gap-asian"]').click();
    // Constrângerea din spec: 3 secunde cât se recalculează statistica. Ăsta e
    // cadrul care contează — dacă cifrele sar aici, mediul e greșit.
    await respira(3000);

    const citite = await page.evaluate(() => {
      const val = (id: string) =>
        document.querySelector(`[data-testid="${id}"]`)?.getAttribute("data-value") ?? "?";
      return {
        tranzactii: val("stat-trades"),
        winRate: val("stat-winrate"),
        expectanta: val("stat-expectancy"),
        net: val("stat-net"),
      };
    });

    await page.screenshot({ path: `${CFG.capturi}/dupa-filtrare.png` });

    const { secunde, octeti, cadre, fpsReal } = await rec.opreste();

    console.log("\n── rezultat ────────────────────────────────────────");
    console.log(`  raw.mkv         ${(octeti / 1024 / 1024).toFixed(1)} MB · ${secunde.toFixed(1)}s`);
    // Cadrele REALE, nu cele cerute. Vezi masoaraCadre() din recorder.ts:
    // antetul fisierului scrie mereu framerate-ul cerut, deci fara masuratoarea
    // asta o captura la 25fps arata identic cu una la 60.
    const procent = CFG.fps > 0 ? (fpsReal / CFG.fps) * 100 : 0;
    console.log(
      `  cadre           ${cadre} → ${fpsReal.toFixed(1)} fps reali din ${CFG.fps} ceruti ` +
      `(${procent.toFixed(0)}%)`
    );
    if (procent < 85) {
      console.warn(
        `
  ATENTIE: s-au prins doar ${procent.toFixed(0)}% din cadre. Animatiile vor` +
        ` sacada.
  Incearca o rezolutie mai mica (CAPTURE_WIDTH=1280 CAPTURE_HEIGHT=720)` +
        ` sau o masina mai puternica.`
      );
    }
    console.log(`  cifrele filmate FVG · Asia → ${citite.tranzactii} tranzacții, ` +
      `${citite.winRate}, ${citite.expectanta}, ${citite.net}`);
    console.log(`  capturi         ${CFG.capturi}/inainte-de-filmare.png, dupa-filtrare.png`);
    console.log("────────────────────────────────────────────────────");

    // Un fișier suspect de mic înseamnă că x11grab n-a prins ecranul — se vede
    // aici, nu peste zece minute când îl deschizi.
    if (octeti < 200_000) {
      console.error("\n  raw.mkv e prea mic. Verifică DISPLAY și dacă fereastra e pe ecran.");
      process.exitCode = 1;
    }
  } catch (e) {
    await rec.opreste().catch(() => {});
    await page.screenshot({ path: `${CFG.capturi}/eroare.png` }).catch(() => {});
    console.error("\n  EROARE:", e instanceof Error ? e.message : e);
    console.error(`  captură la ${CFG.capturi}/eroare.png`);
    process.exitCode = 1;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

void main();
