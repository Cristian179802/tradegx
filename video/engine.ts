import type { Page } from "playwright";

// ── Motorul regizoral ────────────────────────────────────────────────────────
//
// Fișierul ăsta NU se mai atinge după faza 4. Ritmul se schimbă în
// `timeline.ts`, care e doar date. Separarea nu e estetică: faza 6 înseamnă 15+
// treceri peste ritm, iar dacă fiecare ajustare de 200ms cere editat același
// fișier cu logica de sincronizare, se strică motorul din greșeală.
//
// Trei lucruri fac aici toată munca, și toate trei sunt despre timp:
//
//  1. Cursorul fals și mouse-ul real merg pe ACEEAȘI traiectorie. Nu „aproape”.
//     Literal aceleași puncte, calculate o dată.
//  2. Markerul de sincronizare la t=0 dă montajului un reper vizibil în film,
//     nu un timestamp din afara lui.
//  3. Fiecare așteptare de rețea e măsurată și marcată „moartă”, ca faza 5 să o
//     poată tăia fără să ghicească.

// ── Tipurile ─────────────────────────────────────────────────────────────────

/**
 * Cele șapte secțiuni narative din specificație. Un `Beat` e o singură acțiune;
 * o scenă e grupul de acțiuni care spun aceeași bucată de poveste. `--dry`
 * raportează pe amândouă, fiindcă ritmul se judecă pe scene, iar erorile se
 * găsesc pe beats.
 */
export type Scena =
  | "hook"
  | "sync"
  | "jurnal"
  | "money"
  | "context"
  | "scale"
  | "cta";

export type ActiuneBeat =
  | "goto"
  | "move"
  | "click"
  | "type"
  | "scroll"
  | "hold"
  /** Beat fără acțiune, care doar rezervă durată. Vezi `nota`. */
  | "rezervat";

export interface Beat {
  id: string;
  scena: Scena;
  action: ActiuneBeat;
  /** `data-testid` (fără paranteze) sau selector CSS complet dacă începe cu `.`, `#` sau `[`. */
  target?: string;
  /** Pentru `type`. */
  text?: string;
  /** Pentru `goto`, relativ la rădăcina aplicației: „/analytics”. */
  url?: string;
  /** Cât durează acțiunea în sine. Pentru `hold`/`rezervat`, cât se stă. */
  duration: number;
  /** Cât se stă NEMIȘCAT după acțiune. Aici se lasă animația să se așeze. */
  hold: number;
  /** Selector așteptat înainte de acțiune. Timpul petrecut aici e „mort”. */
  waitFor?: string;
  /** Consumat de faza 5 pentru zoom automat. Doar pe `click`. */
  zoom?: { scale: number; easing: string };
  /** Explicație pentru beats care nu fac ce zice specul. Apare în `--dry`. */
  nota?: string;
}

export interface EvenimentCheie {
  t: number;
  tip: "click" | "type" | "scroll" | "marker";
  x?: number;
  y?: number;
  zoom?: number;
  easing?: string;
  beat: string;
  scena: Scena;
}

export interface IntervalMort {
  de: number;
  pana: number;
  motiv: string;
}

export interface Keyframes {
  versiune: number;
  fps: number;
  cadru: { latime: number; inaltime: number };
  marker: { culoare: string; cadre: number };
  evenimente: EvenimentCheie[];
  morti: IntervalMort[];
  scene: { scena: Scena; start: number; sfarsit: number }[];
  beats: { id: string; scena: Scena; start: number; sfarsit: number }[];
  durataMs: number;
}

export interface OptiuniRegizor {
  page: Page;
  urlBaza: string;
  fps: number;
  latime: number;
  inaltime: number;
  /**
   * Câte CADRE stă pe ecran markerul de sincronizare.
   *
   * Specul cere 2. Am pus 6 și explic de ce: la 60fps, 2 cadre înseamnă 33ms,
   * iar captura prinde 91% din cadre pe mașina asta — deci un marker de 2 cadre
   * poate cădea ÎNTREG între două cadre filmate și să nu apară deloc în
   * `raw.mkv`. Faza 5 n-ar mai avea ce calibra, și ar afla abia la montaj.
   * 6 cadre (100ms) rezistă la pierderi și tot se taie la montaj.
   */
  cadreMarker: number;
  seed: number;
}

// ── Interpolarea ─────────────────────────────────────────────────────────────

/**
 * `cubic-bezier(x1, y1, x2, y2)` rezolvat prin căutare binară pe x.
 *
 * Liniar arată robotic — e prima notă din spec. Curba asta e chiar cea din
 * Material („standard easing”): pornește repede, frânează lung, exact cum mișcă
 * un om mouse-ul.
 */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cb = (a: number, b: number, t: number) => {
    const u = 1 - t;
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
  };
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let jos = 0;
    let sus = 1;
    let t = x;
    for (let i = 0; i < 24; i++) {
      const v = cb(x1, x2, t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) jos = t;
      else sus = t;
      t = (jos + sus) / 2;
    }
    return cb(y1, y2, t);
  };
}

const USOR = bezier(0.4, 0.0, 0.2, 1);
const ASEZARE = bezier(0.25, 0.1, 0.25, 1);

export interface Punct {
  t: number;
  x: number;
  y: number;
}

/**
 * Traiectoria completă, în puncte cu timp. Se calculează O SINGURĂ DATĂ și se
 * folosește de amândouă: cursorul desenat o parcurge cu requestAnimationFrame,
 * mouse-ul real o parcurge cu `mouse.move`.
 *
 * Asta e tot secretul sincronizării. Dacă fiecare și-ar calcula drumul, ar
 * ieși aproape la fel — iar „aproape” înseamnă că hover-ul se aprinde înainte
 * ca săgeata să ajungă, și se vede.
 */
export function traiectorie(
  de: { x: number; y: number },
  la: { x: number; y: number },
  durata: number,
  overshoot: number
): Punct[] {
  const dx = la.x - de.x;
  const dy = la.y - de.y;
  const dist = Math.hypot(dx, dy) || 1;

  // Micro-overshoot pe direcția de mers, apoi așezare înapoi. Un om nu
  // oprește fix pe țintă din prima; oprește puțin peste și revine.
  const ox = la.x + (dx / dist) * overshoot;
  const oy = la.y + (dy / dist) * overshoot;
  const PRAG = 0.86;

  const puncte: Punct[] = [];
  const pas = 1000 / 120; // eșantionăm mai des decât filmăm, ca să nu limităm noi
  for (let t = 0; t < durata; t += pas) {
    const p = t / durata;
    if (p <= PRAG) {
      const e = USOR(p / PRAG);
      puncte.push({ t, x: de.x + (ox - de.x) * e, y: de.y + (oy - de.y) * e });
    } else {
      const e = ASEZARE((p - PRAG) / (1 - PRAG));
      puncte.push({ t, x: ox + (la.x - ox) * e, y: oy + (la.y - oy) * e });
    }
  }
  puncte.push({ t: durata, x: la.x, y: la.y });
  return puncte;
}

/**
 * Cât durează mișcarea, după distanță.
 *
 * „Un om nu traversează ecranul în 200ms” — nota din faza 4. Formula e liniară
 * pe distanță, cu praguri: sub 260ms arată teleportat, peste 900ms arată
 * plictisitor.
 */
export function durataMiscarii(dist: number): number {
  return Math.min(900, Math.max(260, Math.round(200 + dist * 0.62)));
}

/**
 * Cât stă între două caractere tastate. Exportate fiindcă `--dry` trebuie să
 * estimeze durata tastării fără să tasteze: altfel un beat de `type` ar apărea
 * mult mai scurt în raport decât e în film.
 */
export const MS_PER_CARACTER_MIN = 58;
export const MS_PER_CARACTER_VAR = 74;
/** Media, pentru estimarea din `--dry`. */
export const MS_PER_CARACTER = MS_PER_CARACTER_MIN + MS_PER_CARACTER_VAR / 2;

/** Generator determinist — aceeași variație de tastare la fiecare rulare. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Ce se injectează în pagină ───────────────────────────────────────────────
//
// Scris ca ȘIR, nu ca funcție. O funcție ar trece prin transformarea esbuild a
// lui tsx și ar chema `__name` în browser — vezi nota din capture/run.ts.
const SCRIPT_CURSOR = String.raw`
(() => {
  if (window.__tgx) return;

  const strat = document.createElement("div");
  strat.id = "__tgx_strat";
  strat.style.cssText =
    "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483647";
  document.documentElement.appendChild(strat);

  // Sageata. Desenata inline ca sa nu depinda de nicio resursa externa: o
  // imagine care nu se incarca ar lasa cadrul fara cursor, si s-ar vedea abia
  // in film.
  const sageata = document.createElement("div");
  sageata.style.cssText =
    "position:absolute;left:0;top:0;width:24px;height:24px;will-change:transform;" +
    "transform:translate(-100px,-100px);filter:drop-shadow(0 2px 4px rgba(0,0,0,.55))";
  sageata.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
    '<path d="M5.5 3.2 L18.4 12.6 L12.2 13.1 L15.0 19.6 L12.3 20.8 L9.5 14.2 L5.5 18.1 Z" ' +
    'fill="#fff" stroke="rgba(9,9,11,.85)" stroke-width="1.1" stroke-linejoin="round"/></svg>';
  strat.appendChild(sageata);

  let x = -100, y = -100;
  const pune = (nx, ny) => { x = nx; y = ny; sageata.style.transform = "translate(" + nx + "px," + ny + "px)"; };

  const api = {
    pozitie: () => ({ x, y }),
    aseaza: pune,

    // Parcurge EXACT punctele primite, dupa ceasul propriu. Nu recalculeaza
    // nimic: traiectoria vine gata facuta, aceeasi pe care merge si mouse-ul
    // real al lui Playwright.
    parcurge(puncte) {
      return new Promise((gata) => {
        if (!puncte.length) return gata();
        const t0 = performance.now();
        let i = 0;
        const pas = () => {
          const t = performance.now() - t0;
          while (i < puncte.length - 1 && puncte[i + 1].t <= t) i++;
          const a = puncte[i];
          const b = puncte[Math.min(i + 1, puncte.length - 1)];
          const dt = b.t - a.t;
          const f = dt > 0 ? Math.min(1, (t - a.t) / dt) : 1;
          pune(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
          if (t >= puncte[puncte.length - 1].t) {
            const u = puncte[puncte.length - 1];
            pune(u.x, u.y);
            return gata();
          }
          requestAnimationFrame(pas);
        };
        requestAnimationFrame(pas);
      });
    },

    // Unda de click. 300ms, ca in spec.
    unda(cx, cy) {
      const d = document.createElement("div");
      d.style.cssText =
        "position:absolute;left:" + cx + "px;top:" + cy + "px;width:14px;height:14px;margin:-7px 0 0 -7px;" +
        "border-radius:50%;border:2px solid rgba(129,140,248,.95);background:rgba(129,140,248,.22)";
      strat.appendChild(d);
      const an = d.animate(
        [
          { transform: "scale(0.35)", opacity: 1 },
          { transform: "scale(3.1)", opacity: 0 },
        ],
        { duration: 300, easing: "cubic-bezier(0.4,0,0.2,1)" }
      );
      an.onfinish = () => d.remove();
    },

    // Derulare animata de noi, nu cu behavior:smooth — acolo durata o alege
    // browserul si nu se poate potrivi cu ritmul din timeline.
    // (Fara accente grave in blocul asta: e un template literal, iar un accent
    //  grav il inchide in mijlocul scriptului injectat.)
    deruleaza(tinta, durata) {
      return new Promise((gata) => {
        const de = window.scrollY;
        const dx = tinta - de;
        if (Math.abs(dx) < 1) return gata();
        const t0 = performance.now();
        const cb = (p) => {
          // aceeasi curba ca la cursor: cubic-bezier(0.4, 0, 0.2, 1)
          let jos = 0, sus = 1, t = p;
          const f = (a, b, u) => { const v = 1 - u; return 3*v*v*u*a + 3*v*u*u*b + u*u*u; };
          for (let i = 0; i < 24; i++) {
            const v = f(0.4, 0.2, t);
            if (Math.abs(v - p) < 1e-5) break;
            if (v < p) jos = t; else sus = t;
            t = (jos + sus) / 2;
          }
          return f(0.0, 1.0, t);
        };
        const pas = () => {
          const p = Math.min(1, (performance.now() - t0) / durata);
          window.scrollTo(0, de + dx * cb(p));
          if (p >= 1) return gata();
          requestAnimationFrame(pas);
        };
        requestAnimationFrame(pas);
      });
    },

    // Markerul de sincronizare: culoare plata pe tot ecranul, exact N cadre.
    // Numaram cadre reale cu requestAnimationFrame, nu milisecunde — asa
    // numarul din keyframes.json inseamna acelasi lucru ca in film.
    marker(culoare, cadre) {
      return new Promise((gata) => {
        const d = document.createElement("div");
        d.id = "__tgx_marker";
        d.style.cssText =
          "position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483647;background:" + culoare;
        document.documentElement.appendChild(d);
        let n = 0;
        const pas = () => {
          n++;
          if (n >= cadre) { d.remove(); return gata(); }
          requestAnimationFrame(pas);
        };
        requestAnimationFrame(pas);
      });
    },
  };

  window.__tgx = api;
})();
`;

// ── Regizorul ────────────────────────────────────────────────────────────────

export class Regizor {
  private t0 = 0;
  private evenimente: EvenimentCheie[] = [];
  private morti: IntervalMort[] = [];
  private beats: Keyframes["beats"] = [];
  private pozitie = { x: 0, y: 0 };
  private rnd: () => number;

  constructor(private readonly opt: OptiuniRegizor) {
    this.rnd = mulberry32(opt.seed);
    // Cursorul pornește din centru-jos, de unde ar veni mâna, nu din colț.
    this.pozitie = { x: Math.round(opt.latime / 2), y: Math.round(opt.inaltime * 0.78) };
  }

  /** Milisecunde de la markerul de sincronizare. Baza de timp a tot ce urmează. */
  get t(): number {
    return this.t0 ? Date.now() - this.t0 : 0;
  }

  async instaleaza(): Promise<void> {
    await this.opt.page.addInitScript({ content: SCRIPT_CURSOR });
    await this.opt.page.evaluate(SCRIPT_CURSOR);
    await this.opt.page.evaluate(
      (p) => (window as unknown as TgxWindow).__tgx.aseaza(p.x, p.y),
      this.pozitie
    );
    await this.opt.page.mouse.move(this.pozitie.x, this.pozitie.y);
  }

  /**
   * Markerul de sincronizare. Se cheamă O SINGURĂ DATĂ, imediat după ce ffmpeg
   * a pornit, și fixează t=0.
   *
   * Fără el, timestamp-urile din keyframes.json ar fi raportate la pornirea
   * scriptului, iar între „am pornit ffmpeg” și „primul cadru chiar scris” sunt
   * sute de milisecunde. La montaj, zoom-ul ar sări cu un sfert de secundă față
   * de click — destul cât să se vadă.
   */
  async marcheazaStart(culoare: string): Promise<void> {
    this.t0 = Date.now();
    this.evenimente.push({
      t: 0,
      tip: "marker",
      beat: "__marker",
      scena: "hook",
    });
    await this.opt.page.evaluate(
      (a) => (window as unknown as TgxWindow).__tgx.marker(a.culoare, a.cadre),
      { culoare, cadre: this.opt.cadreMarker }
    );
  }

  /** Timp în care nu se întâmplă nimic vizual — faza 5 îl taie. */
  private async faraCadre<T>(motiv: string, treaba: () => Promise<T>): Promise<T> {
    const de = this.t;
    const rez = await treaba();
    const pana = this.t;
    // Sub 150ms nu merită tăiat: tăietura însăși se vede mai mult decât pauza.
    if (pana - de >= 150) this.morti.push({ de, pana, motiv });
    return rez;
  }

  private selector(target: string): string {
    return /^[.#[]/.test(target) ? target : `[data-testid="${target}"]`;
  }

  private async centru(target: string): Promise<{ x: number; y: number }> {
    const el = this.opt.page.locator(this.selector(target)).first();
    const box = await el.boundingBox();
    if (!box) throw new Error(`nu găsesc „${target}” pe ecran`);
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  }

  /**
   * Mișcarea. Cursorul desenat și mouse-ul real pleacă în aceeași clipă, pe
   * aceleași puncte.
   *
   * Mouse-ul real merge pe un pas mai rar (fiecare `mouse.move` e un drum dus-
   * întors prin CDP, iar la 120Hz s-ar îneca) și sare peste puncte dacă rămâne
   * în urmă. Ordinea contează: mai bine ajunge mouse-ul exact la timp și trece
   * peste puncte intermediare, decât să rămână în spatele săgeții desenate — un
   * hover care se aprinde înainte ca săgeata să ajungă se vede imediat.
   */
  private async mergiLa(la: { x: number; y: number }, durataCeruta?: number): Promise<void> {
    const de = this.pozitie;
    const dist = Math.hypot(la.x - de.x, la.y - de.y);
    if (dist < 1) return;
    const durata = durataCeruta && durataCeruta > 0 ? durataCeruta : durataMiscarii(dist);
    const puncte = traiectorie(de, la, durata, 3 + this.rnd());

    const desenat = this.opt.page.evaluate(
      (p) => (window as unknown as TgxWindow).__tgx.parcurge(p),
      puncte
    );

    const start = Date.now();
    let i = 0;
    const PAS_REAL = 24; // ms între mișcările mouse-ului real
    for (let tinta = PAS_REAL; tinta <= durata; tinta += PAS_REAL) {
      let urm = puncte[i + 1];
      while (urm && urm.t <= tinta) {
        i++;
        urm = puncte[i + 1];
      }
      const p = puncte[i];
      if (!p) break;
      const ramas = tinta - (Date.now() - start);
      if (ramas > 0) await new Promise((r) => setTimeout(r, ramas));
      await this.opt.page.mouse.move(p.x, p.y);
    }
    await this.opt.page.mouse.move(la.x, la.y);
    await desenat;
    this.pozitie = la;
  }

  private async asteapta(beat: Beat): Promise<void> {
    if (!beat.waitFor) return;
    await this.faraCadre(`aștept ${beat.waitFor}`, async () => {
      await this.opt.page
        .locator(this.selector(beat.waitFor!))
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
    });
  }

  private async pauza(ms: number): Promise<void> {
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  }

  /** Execută un singur beat și îi înregistrează intervalul. */
  async executa(beat: Beat): Promise<void> {
    const start = this.t;
    const page = this.opt.page;

    await this.asteapta(beat);

    switch (beat.action) {
      case "goto": {
        await this.faraCadre(`încarc ${beat.url}`, async () => {
          await page.goto(`${this.opt.urlBaza}${beat.url ?? "/"}`, {
            waitUntil: "domcontentloaded",
          });
          // Pagina nouă = strat nou. `addInitScript` îl pune la loc, dar
          // cursorul trebuie repus unde era, altfel sare în colț.
          await page.evaluate(
            (p) => (window as unknown as TgxWindow).__tgx?.aseaza(p.x, p.y),
            this.pozitie
          );
        });
        break;
      }

      case "move": {
        if (!beat.target) throw new Error(`beat „${beat.id}”: move fără target`);
        await this.mergiLa(await this.centru(beat.target), beat.duration);
        break;
      }

      case "click": {
        if (!beat.target) throw new Error(`beat „${beat.id}”: click fără target`);
        const p = await this.centru(beat.target);
        await this.mergiLa(p, beat.duration);
        await page.evaluate(
          (c) => (window as unknown as TgxWindow).__tgx.unda(c.x, c.y),
          p
        );
        this.evenimente.push({
          t: this.t,
          tip: "click",
          x: p.x,
          y: p.y,
          zoom: beat.zoom?.scale,
          easing: beat.zoom?.easing,
          beat: beat.id,
          scena: beat.scena,
        });
        await page.mouse.click(p.x, p.y);
        break;
      }

      case "type": {
        if (!beat.target || beat.text === undefined) {
          throw new Error(`beat „${beat.id}”: type fără target sau text`);
        }
        const p = await this.centru(beat.target);
        await this.mergiLa(p, beat.duration);
        await page.mouse.click(p.x, p.y);
        this.evenimente.push({
          t: this.t,
          tip: "type",
          x: p.x,
          y: p.y,
          beat: beat.id,
          scena: beat.scena,
        });
        // Golim câmpul întâi. Fără asta, un input care are deja o valoare —
        // cum are cel de stop loss din calculator — primește textul lipit la
        // coadă și iese „2035” în loc de „35”.
        const el = page.locator(this.selector(beat.target)).first();
        await el.fill("");
        // Intervalul între caractere variază, dar e SEED-UIT: la interval fix
        // tastarea arată robotic, la interval aleator nu se poate reproduce
        // aceeași filmare de două ori.
        for (const ch of beat.text) {
          await el.pressSequentially(ch, { delay: 0 });
          await this.pauza(Math.round(MS_PER_CARACTER_MIN + this.rnd() * MS_PER_CARACTER_VAR));
        }
        break;
      }

      case "scroll": {
        if (!beat.target) throw new Error(`beat „${beat.id}”: scroll fără target`);
        const y = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          // Ținta se așază în treimea de sus: e locul în care se uită omul.
          return Math.max(0, window.scrollY + r.top - window.innerHeight * 0.18);
        }, this.selector(beat.target));
        if (y === null) throw new Error(`nu găsesc „${beat.target}” pentru derulare`);
        this.evenimente.push({
          t: this.t,
          tip: "scroll",
          y,
          beat: beat.id,
          scena: beat.scena,
        });
        await page.evaluate(
          (a) => (window as unknown as TgxWindow).__tgx.deruleaza(a.y, a.durata),
          { y, durata: beat.duration }
        );
        break;
      }

      case "hold":
      case "rezervat": {
        await this.pauza(beat.duration);
        break;
      }
    }

    await this.pauza(beat.hold);
    this.beats.push({ id: beat.id, scena: beat.scena, start, sfarsit: this.t });
  }

  keyframes(): Keyframes {
    const scene: Keyframes["scene"] = [];
    for (const b of this.beats) {
      const ultima = scene[scene.length - 1];
      if (ultima && ultima.scena === b.scena) ultima.sfarsit = b.sfarsit;
      else scene.push({ scena: b.scena, start: b.start, sfarsit: b.sfarsit });
    }
    return {
      versiune: 1,
      fps: this.opt.fps,
      cadru: { latime: this.opt.latime, inaltime: this.opt.inaltime },
      marker: { culoare: CULOARE_MARKER, cadre: this.opt.cadreMarker },
      evenimente: this.evenimente,
      morti: this.morti,
      scene,
      beats: this.beats,
      durataMs: this.beats[this.beats.length - 1]?.sfarsit ?? 0,
    };
  }
}

/**
 * Magenta pur. Nu apare nicăieri în paleta TradeGX — care e zinc, indigo,
 * violet, emerald, rose — deci faza 5 poate căuta „cadrul în care media
 * canalelor e exact asta" fără nicio ambiguitate.
 */
export const CULOARE_MARKER = "#FF00FF";

interface TgxWindow {
  __tgx: {
    pozitie(): { x: number; y: number };
    aseaza(x: number, y: number): void;
    parcurge(puncte: Punct[]): Promise<void>;
    unda(x: number, y: number): void;
    deruleaza(y: number, durata: number): Promise<void>;
    marker(culoare: string, cadre: number): Promise<void>;
  };
}
