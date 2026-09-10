import { chromium, type Browser, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { Inregistrare } from "./capture/recorder";
import { raporteaza, verificaMediul } from "./capture/env";
import {
  CULOARE_MARKER,
  MS_PER_CARACTER,
  Regizor,
  type Beat,
  type Scena,
} from "./engine";
import { BUGET, TIMELINE } from "./timeline";

// ── Regizorul ────────────────────────────────────────────────────────────────
//
// Leagă cele trei bucăți: mediul (verificările din faza 3), motorul (engine.ts)
// și ritmul (timeline.ts). Nu conține nici logică de animație, nici ritm — doar
// ordinea în care se întâmplă lucrurile și cele trei moduri de rulare.
//
// Modurile există fiindcă faza 6 e iterație: o rulare completă durează minute,
// iar 90% din greșeli se văd fără să filmezi nimic.
//
//   --dry           parcurge timeline-ul fără browser. Structura și duratele.
//   --beat=<id>     filmează un singur beat, cu pregătirea lui.
//   (nimic)         rulare completă.

const CFG = {
  url: process.env.APP_URL ?? "https://www.tradegx.com",
  email: process.env.DEMO_EMAIL ?? "demo@tradegx.com",
  parola: process.env.DEMO_PASSWORD ?? "DemoTrader2026!",
  display: process.env.DISPLAY ?? ":99",
  latime: Number(process.env.CAPTURE_WIDTH ?? 1920),
  inaltime: Number(process.env.CAPTURE_HEIGHT ?? 1080),
  fps: Number(process.env.CAPTURE_FPS ?? 60),
  timezone: process.env.CAPTURE_TZ ?? "Europe/Bucharest",
  locale: process.env.CAPTURE_LOCALE ?? "ro-RO",
  iesire: process.env.CAPTURE_OUT ?? "out/raw.mkv",
  keyframes: process.env.CAPTURE_KEYFRAMES ?? "out/keyframes.json",
  capturi: process.env.CAPTURE_SHOTS ?? "out",
  rezervaCrom: Number(process.env.CAPTURE_CHROME_RESERVE ?? 140),
  cadreMarker: Number(process.env.CAPTURE_MARKER_FRAMES ?? 6),
  seed: Number(process.env.CAPTURE_SEED ?? 0x7ade6c),
} as const;

const respira = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Modul uscat ──────────────────────────────────────────────────────────────

/**
 * Durata unui beat AȘA CUM VA IEȘI ÎN FILM, fără timpul mort.
 *
 * Tastarea e singura care nu se citește direct din `duration`: acolo `duration`
 * e cât durează mișcarea până la câmp, iar scrisul propriu-zis vine din
 * lungimea textului. Fără corecția asta, un beat de tastare ar apărea în raport
 * de trei ori mai scurt decât e.
 */
function durataBeat(b: Beat): number {
  const tastare = b.action === "type" ? (b.text?.length ?? 0) * MS_PER_CARACTER : 0;
  return b.duration + tastare + b.hold;
}

function uscat(beats: Beat[]): void {
  console.log("── timeline ────────────────────────────────────────────────────");

  const peScena = new Map<Scena, number>();
  let total = 0;

  let scenaCurenta: Scena | null = null;
  for (const b of beats) {
    if (b.scena !== scenaCurenta) {
      if (scenaCurenta !== null) console.log("");
      scenaCurenta = b.scena;
      console.log(`  ${b.scena.toUpperCase()}`);
    }
    const d = durataBeat(b);
    peScena.set(b.scena, (peScena.get(b.scena) ?? 0) + d);
    total += d;

    const inceput = total - d;
    const eticheta = b.action === "type" ? `type „${b.text}”` : b.action;
    console.log(
      `    ${fmtSec(inceput).padStart(6)} +${String(d).padStart(5)}ms  ` +
      `${b.id.padEnd(22)} ${eticheta.padEnd(16)} ${b.target ?? b.url ?? ""}`
    );
    if (b.nota) console.log(`             └─ ${b.nota}`);
  }

  console.log("\n── distribuția pe scene ────────────────────────────────────────");
  let acum = 0;
  for (const [scena, ms] of peScena) {
    const buget = BUGET[scena] ?? 0;
    const delta = ms - buget;
    const semn = delta === 0 ? "exact" : delta > 0 ? `+${delta}ms peste` : `${-delta}ms sub`;
    console.log(
      `  ${scena.padEnd(9)} ${fmtSec(acum)} → ${fmtSec(acum + ms)}  ` +
      `${String(ms).padStart(6)}ms  (buget ${buget}ms, ${semn})`
    );
    acum += ms;
  }

  const bugetTotal = Object.values(BUGET).reduce((a, b) => a + b, 0);
  console.log("────────────────────────────────────────────────────────────────");
  console.log(
    `  TOTAL     ${fmtSec(total)}  (${total}ms din ${bugetTotal}ms — ` +
    `${total > bugetTotal ? `+${total - bugetTotal}` : `${total - bugetTotal}`}ms)`
  );
  console.log(
    "  Timpul de încărcare și așteptare NU e inclus: e marcat „mort” în\n" +
    "  keyframes.json și se taie la montaj."
  );
  console.log("────────────────────────────────────────────────────────────────");
}

function fmtSec(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

// ── Browserul ────────────────────────────────────────────────────────────────

async function deschideBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: false,
    env: { ...process.env, DISPLAY: CFG.display } as Record<string, string>,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      `--window-size=${CFG.latime},${CFG.inaltime + CFG.rezervaCrom}`,
      "--window-position=0,0",
      "--start-fullscreen",
      "--kiosk",
      "--use-gl=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-infobars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-features=Translate,MediaRouter",
    ],
  });
}

async function autentifica(page: Page): Promise<void> {
  await page.goto(`${CFG.url}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(CFG.email);
  await page.locator('input[type="password"]').first().fill(CFG.parola);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45_000 });
}

/**
 * Ce trebuie rulat înainte de un beat ca pagina să fie unde trebuie.
 *
 * `--beat=money-asia` n-are sens pe pagina de login. Luăm ultimul `goto` de
 * dinaintea lui — atât, nu tot ce e înainte: scopul modului e să fie RAPID.
 */
function pregatirePentru(id: string): Beat[] {
  const i = TIMELINE.findIndex((b) => b.id === id);
  if (i < 0) {
    const ids = TIMELINE.map((b) => b.id).join(", ");
    throw new Error(`beat necunoscut „${id}”. Există: ${ids}`);
  }
  const tinta = TIMELINE[i];
  if (!tinta) throw new Error(`beat necunoscut „${id}”`);

  const pregatire: Beat[] = [];
  for (let j = i - 1; j >= 0; j--) {
    const b = TIMELINE[j];
    if (b && b.action === "goto") {
      pregatire.push({ ...b, hold: 0 });
      break;
    }
  }
  return [...pregatire, tinta];
}

// ── Rularea ──────────────────────────────────────────────────────────────────

async function filmeaza(beats: Beat[], singur: string | null): Promise<void> {
  mkdirSync(CFG.capturi, { recursive: true });

  const browser = await deschideBrowser();
  const context = await browser.newContext({
    viewport: { width: CFG.latime, height: CFG.inaltime },
    reducedMotion: "no-preference",
    timezoneId: CFG.timezone,
    locale: CFG.locale,
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  await context.addInitScript({
    content: "globalThis.__name = globalThis.__name || ((f) => f);",
  });

  const page = await context.newPage();
  const rec = new Inregistrare({
    display: CFG.display,
    latime: CFG.latime,
    inaltime: CFG.inaltime,
    fps: CFG.fps,
    iesire: CFG.iesire,
  });

  const regizor = new Regizor({
    page,
    urlBaza: CFG.url,
    fps: CFG.fps,
    latime: CFG.latime,
    inaltime: CFG.inaltime,
    cadreMarker: CFG.cadreMarker,
    seed: CFG.seed,
  });

  try {
    await page.goto(CFG.url, { waitUntil: "domcontentloaded" });
    const verificari = await verificaMediul(page);
    if (raporteaza(verificari).opreste) {
      process.exitCode = 1;
      return;
    }

    console.log("  autentificare…");
    await autentifica(page);
    await regizor.instaleaza();

    const crom = await page.evaluate(() => window.outerHeight - window.innerHeight);
    if (crom > CFG.rezervaCrom) {
      throw new Error(
        `cromul browserului are ${crom}px, dar rezerva de pe ecran e ${CFG.rezervaCrom}px. ` +
        `Repornește cu CAPTURE_CHROME_RESERVE=${Math.ceil(crom / 10) * 10}.`
      );
    }
    rec.seteazaDecalaj(crom);
    console.log(`  cromul browserului: ${crom}px din ${CFG.rezervaCrom}px rezervă`);

    console.log(singur ? `  filmez doar „${singur}”…` : "  filmez timeline-ul întreg…");
    rec.porneste();
    // Un moment de așezare înainte de marker: primele cadre ale lui ffmpeg sunt
    // uneori neregulate, iar markerul trebuie să cadă pe unele bune.
    await respira(500);

    await regizor.marcheazaStart(CULOARE_MARKER);

    for (const b of beats) {
      const t = regizor.t;
      console.log(`  [${String(t).padStart(6)}ms] ${b.scena}/${b.id}`);
      await regizor.executa(b);
    }

    await page.screenshot({ path: `${CFG.capturi}/ultimul-cadru.png` });
    const { secunde, octeti, cadre, fpsReal } = await rec.opreste();

    const kf = regizor.keyframes();
    writeFileSync(CFG.keyframes, JSON.stringify(kf, null, 2), "utf8");

    console.log("\n── rezultat ────────────────────────────────────────────────────");
    console.log(`  raw.mkv         ${(octeti / 1024 / 1024).toFixed(1)} MB · ${secunde.toFixed(1)}s`);
    const procent = CFG.fps > 0 ? (fpsReal / CFG.fps) * 100 : 0;
    console.log(
      `  cadre           ${cadre} → ${fpsReal.toFixed(1)} fps reali din ${CFG.fps} ceruti ` +
      `(${procent.toFixed(0)}%)`
    );
    if (procent < 85) {
      console.warn(
        `\n  ATENTIE: s-au prins doar ${procent.toFixed(0)}% din cadre. Animatiile vor sacada.` +
        `\n  Incearca CAPTURE_WIDTH=1280 CAPTURE_HEIGHT=720.`
      );
    }
    console.log(`  keyframes.json  ${kf.evenimente.length} evenimente, ${kf.morti.length} intervale moarte`);
    console.log(`  timeline        ${fmtSec(kf.durataMs)} filmat, ${kf.scene.length} scene`);
    const mort = kf.morti.reduce((s, m) => s + (m.pana - m.de), 0);
    console.log(`  din care mort   ${fmtSec(mort)} (se taie la montaj)`);
    console.log("────────────────────────────────────────────────────────────────");

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

async function main() {
  const argumente = process.argv.slice(2);
  const dry = argumente.includes("--dry");
  const beatArg = argumente.find((a) => a.startsWith("--beat="));
  const singur = beatArg ? beatArg.slice("--beat=".length) : null;

  if (dry) {
    uscat(singur ? pregatirePentru(singur) : TIMELINE);
    return;
  }

  await filmeaza(singur ? pregatirePentru(singur) : TIMELINE, singur);
}

void main();
