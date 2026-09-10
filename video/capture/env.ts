import type { Page } from "playwright";

// ── Verificarea mediului ─────────────────────────────────────────────────────
//
// Cele cinci constrângeri din FAZA_3 au ceva în comun: fiecare strică filmul
// TĂCUT. Nu dau eroare, nu opresc nimic — descoperi la montaj că numerele sar
// sau că scrie în dreptunghiuri, după ce ai filmat.
//
// De aceea nu le presupunem: le întrebăm pe browserul care chiar filmează, și
// oprim înainte de prima secundă dacă nu răspunde cum trebuie.

export interface RezultatVerificare {
  ce: string;
  ok: boolean;
  detaliu: string;
  /** false = doar avertisment, filmarea continuă */
  critic: boolean;
}

export async function verificaMediul(page: Page): Promise<RezultatVerificare[]> {
  const rezultate: RezultatVerificare[] = [];

  // ── 1. Reduced motion ──────────────────────────────────────────────────────
  // Componenta de statistici respectă `prefers-reduced-motion` și oprește
  // rostogolirea cifrelor. Corect pentru utilizator, dezastruos pentru film:
  // exact animația de recalculare e cadrul de la secunda 17.
  const reduce = await page.evaluate(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  rezultate.push({
    ce: "prefers-reduced-motion",
    ok: reduce === false,
    detaliu: reduce ? "reduce ACTIV — numerele vor sări, nu se vor anima" : "no-preference",
    critic: true,
  });

  // ── 2. Fonturi ─────────────────────────────────────────────────────────────
  // `document.fonts.check` întoarce true și pentru un fallback ales de browser,
  // deci nu e o dovadă. Măsurăm LĂȚIMEA aceluiași text în fontul de brand și
  // într-unul inexistent: dacă ies identice, fontul n-a fost aplicat, ci
  // înlocuit tăcut.
  //
  // Măsurarea trebuie să vină DUPĂ ce fonturile chiar s-au încărcat, altfel
  // verificarea devine o cursă: la `domcontentloaded` fișierele pot fi încă pe
  // drum, canvas-ul cade pe fallback, și primești „Inter ÎNLOCUIT" pe un mediu
  // perfect sănătos. S-a întâmplat: aceeași mașină, aceeași pagină, două
  // rezultate diferite la două rulări consecutive.
  //
  // `document.fonts.ready` singur nu ajunge — el așteaptă fonturile pe care
  // pagina le-a CERUT deja. Le cerem explicit, apoi așteptăm.
  const fonturi = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('32px "Space Grotesk"'),
      document.fonts.load('32px "Inter"'),
    ]).catch(() => {});
    await document.fonts.ready;

    const masoara = (family: string) => {
      const c = document.createElement("canvas").getContext("2d")!;
      c.font = `32px ${family}`;
      return c.measureText("Setup × Sesiune 61% · →").width;
    };
    const referinta = masoara("__nu_exista_fontul_asta__, monospace");
    return {
      spaceGrotesk: masoara('"Space Grotesk", __nu_exista_fontul_asta__, monospace'),
      inter: masoara('"Inter", __nu_exista_fontul_asta__, monospace'),
      referinta,
      // Simbolurile din interfață. Dacă lipsesc, apar dreptunghiuri.
      simboluri: masoara("sans-serif") > 0,
    };
  });
  const groteskOk = Math.abs(fonturi.spaceGrotesk - fonturi.referinta) > 1;
  const interOk = Math.abs(fonturi.inter - fonturi.referinta) > 1;
  rezultate.push({
    ce: "fonturile de brand",
    ok: groteskOk && interOk,
    detaliu: `Space Grotesk ${groteskOk ? "aplicat" : "ÎNLOCUIT"}, Inter ${interOk ? "aplicat" : "ÎNLOCUIT"} (lățimi: ${fonturi.spaceGrotesk.toFixed(1)} / ${fonturi.inter.toFixed(1)} vs ${fonturi.referinta.toFixed(1)} referință)`,
    critic: false,
  });

  // ── 3. Fus orar și limbă ───────────────────────────────────────────────────
  // Un container pe UTC afișează alte ore de sesiune și alt format de dată
  // decât vezi tu în browser — iar orele de sesiune sunt chiar subiectul.
  const local = await page.evaluate(() => {
    const d = new Intl.DateTimeFormat();
    return {
      timezone: d.resolvedOptions().timeZone,
      locale: d.resolvedOptions().locale,
      exemplu: new Date("2026-09-10T14:30:00Z").toLocaleString(),
    };
  });
  rezultate.push({
    ce: "fus orar / limbă",
    ok: true,
    detaliu: `${local.timezone} · ${local.locale} · 14:30 UTC se vede ca „${local.exemplu}"`,
    critic: false,
  });

  // ── 4. Scrollbar ───────────────────────────────────────────────────────────
  // Cu `--hide-scrollbars`, lățimea barei e 0. E singura verificare directă:
  // altfel afli din cadru.
  const scrollbar = await page.evaluate(() => {
    const d = document.createElement("div");
    d.style.cssText = "width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px";
    document.body.appendChild(d);
    const w = d.offsetWidth - d.clientWidth;
    d.remove();
    return w;
  });
  rezultate.push({
    ce: "scrollbar",
    ok: scrollbar === 0,
    detaliu: scrollbar === 0 ? "ascuns" : `${scrollbar}px VIZIBIL în cadru`,
    critic: false,
  });

  // ── 5. Randare ─────────────────────────────────────────────────────────────
  // În Xvfb nu există GPU. Nu e o problemă în sine — compoziția CSS merge și
  // software — dar merită știut ce randează, ca să nu cauți vinovatul altundeva
  // dacă animația sacadează.
  const randare = await page.evaluate(() => {
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (!gl) return "fără WebGL";
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "renderer necunoscut";
    } catch {
      return "indisponibil";
    }
  });
  rezultate.push({ ce: "randare", ok: true, detaliu: randare, critic: false });

  return rezultate;
}

export function raporteaza(rezultate: RezultatVerificare[]): { opreste: boolean } {
  console.log("── verificarea mediului ────────────────────────────");
  for (const r of rezultate) {
    const semn = r.ok ? "✓" : r.critic ? "✗" : "!";
    console.log(`  ${semn} ${r.ce.padEnd(24)} ${r.detaliu}`);
  }
  const criticeRatate = rezultate.filter((r) => !r.ok && r.critic);
  if (criticeRatate.length) {
    console.error(
      `\n  ${criticeRatate.length} constrângere critică nerespectată. NU filmez —` +
        ` un film greșit se descoperă abia la montaj.`
    );
  }
  console.log("────────────────────────────────────────────────────\n");
  return { opreste: criticeRatate.length > 0 };
}
