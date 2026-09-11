import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import type { Keyframes } from "./engine";
import { randeazaTexte, type TextDeRandat } from "./texte";

// ── Montajul ─────────────────────────────────────────────────────────────────
//
// Citește `raw.mkv` și `keyframes.json` și scoate livrabilul. Nimic aici nu
// ghicește: fiecare tăietură și fiecare zoom vine dintr-un număr scris de
// regizor în timpul filmării.
//
// Ordinea operațiilor NU e arbitrară:
//
//  1. Găsim markerul de sincronizare în film. Abia el spune unde e t=0 al
//     keyframes-urilor. Ceasul scriptului nu ajută: între „am pornit ffmpeg” și
//     primul cadru chiar scris au fost măsurate 1.3 secunde.
//  2. Tăiem timpul mort ȘI markerul.
//  3. Abia apoi zoom-ul, cu timpii recalculați pe noua axă. Dacă am face
//     invers, am plăti scale+crop pe 37 de secunde care se aruncă.
//  4. Text, grade, sunet, encodare.

// ── Ce se scrie pe ecran ─────────────────────────────────────────────────────
//
// Doar texte care există în specificație. Nu inventez copy: §1 dă hook-ul, §0
// dă fraza money shot-ului, §1 dă CTA-ul („domeniu + logo”).
//
// Timpii sunt în milisecunde pe axa FINALĂ (după tăieturi), ca să fie ușor de
// mutat: la faza 6 se umblă la ritm, iar textele trebuie să-l urmeze.

interface Supratitlu extends TextDeRandat {
  /** ms pe axa finală */
  de: number;
  pana: number;
  /** Poziție verticală ca fracțiune din înălțime. */
  y: number;
  sursa: string;
}

const TEXTE: Supratitlu[] = [
  {
    id: "hook",
    text: "Pierzi. Dar știi exact de ce?",
    de: 400,
    pana: 2900,
    marime: 54,
    y: 0.5,
    font: "titlu",
    sursa: "VIDEO_SPEC §1, rândul Hook",
  },
  {
    id: "money",
    text: "Același setup. Sesiune diferită.",
    de: 18600,
    pana: 21600,
    marime: 42,
    y: 0.12,
    font: "titlu",
    sursa: "VIDEO_SPEC §0",
  },
  {
    id: "cta",
    text: "tradegx.com",
    de: 41400,
    pana: 44800,
    marime: 64,
    y: 0.46,
    font: "titlu",
    sursa: "VIDEO_SPEC §1, rândul CTA",
  },
];

const CFG = {
  intrare: process.env.COMPOSE_IN ?? "out/raw.mkv",
  keyframes: process.env.COMPOSE_KEYFRAMES ?? "out/keyframes.json",
  iesire: process.env.COMPOSE_OUT ?? "out/hero-16x9.mp4",
  // Gol = rezoluția sursei.
  //
  // Specul cere 1080p la ieșire, dar filmul brut e 1280x720 — 1080p pe mașina
  // asta dă ~13 fps și un container corupt, măsurat. A scala 720 la 1920 ar
  // scrie „1080p” în metadate fără să adauge un pixel de detaliu: un livrabil
  // care minte despre ce e. Se pune `COMPOSE_W`/`COMPOSE_H` când filmul brut
  // chiar vine la 1080p, de pe altă mașină.
  latime: Number(process.env.COMPOSE_W ?? 0),
  inaltime: Number(process.env.COMPOSE_H ?? 0),
  /** Calea către muzică. Gol = pistă tăcută, ca livrabilul să aibă totuși sunet. */
  muzica: process.env.COMPOSE_MUSIC ?? "",
  /** Cât durează intrarea și ieșirea din zoom. Specul cere 400ms. */
  zoomMs: Number(process.env.COMPOSE_ZOOM_MS ?? 400),
  /** Fade-ul textelor. Specul cere 250ms. */
  fadeMs: Number(process.env.COMPOSE_FADE_MS ?? 250),
} as const;

// ── Markerul de sincronizare ─────────────────────────────────────────────────

/**
 * În ce secundă a filmului se află markerul magenta.
 *
 * Reducem fiecare cadru la un pixel și căutăm primul care e magenta pur. E
 * ieftin (un pixel pe cadru) și fără ambiguitate: #FF00FF nu există în paleta
 * TradeGX, care e zinc, indigo, violet, emerald și rose.
 */
function gasesteMarker(fisier: string, fps: number): { start: number; cadre: number } {
  const rez = spawnSync(
    "ffmpeg",
    ["-v", "error", "-t", "10", "-i", fisier, "-vf", "scale=1:1", "-f", "rawvideo",
     "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 64 * 1024 * 1024 }
  );
  const px = rez.stdout;
  if (!px || px.length < 3) throw new Error("nu pot citi cadrele din film");

  let prim = -1;
  let ultim = -1;
  for (let i = 0; i + 2 < px.length; i += 3) {
    const r = px[i]!, g = px[i + 1]!, b = px[i + 2]!;
    if (r > 200 && b > 200 && g < 80) {
      if (prim < 0) prim = i / 3;
      ultim = i / 3;
    } else if (prim >= 0) {
      break; // ne oprim la finalul PRIMEI serii; restul filmului nu ne interesează
    }
  }
  if (prim < 0) {
    throw new Error(
      "nu găsesc markerul de sincronizare în primele 10s.\n" +
      "  Fără el nu pot alinia zoom-ul cu clickurile — vezi engine.ts, marcheazaStart()."
    );
  }
  return { start: prim / fps, cadre: ultim - prim + 1 };
}

// ── Axa de timp ──────────────────────────────────────────────────────────────

interface Segment {
  /** secunde în FILMUL BRUT */
  de: number;
  pana: number;
}

/**
 * Ce rămâne după ce scoatem timpul mort și markerul.
 *
 * Intervalele moarte sunt în ms de la t=0 (markerul). Le traducem în secunde de
 * film adunând decalajul găsit mai sus, apoi luăm complementul.
 */
function segmenteVii(kf: Keyframes, decalaj: number, durataMarker: number): Segment[] {
  const moarte = [...kf.morti]
    .map((m) => ({ de: decalaj + m.de / 1000, pana: decalaj + m.pana / 1000 }))
    .sort((a, b) => a.de - b.de);

  // Markerul însuși se taie: e un reper pentru montaj, nu conținut.
  moarte.unshift({ de: 0, pana: decalaj + durataMarker });

  const sfarsit = decalaj + kf.durataMs / 1000;
  const vii: Segment[] = [];
  let cursor = 0;
  for (const m of moarte) {
    if (m.de > cursor) vii.push({ de: cursor, pana: Math.min(m.de, sfarsit) });
    cursor = Math.max(cursor, m.pana);
  }
  if (cursor < sfarsit) vii.push({ de: cursor, pana: sfarsit });
  return vii.filter((s) => s.pana - s.de > 0.04); // sub un cadru și jumătate, nu merită
}

/**
 * Segmentele, exprimate în INDICI DE CADRU, nu în secunde.
 *
 * `select='between(t,a,b)'` compară timpi în virgulă mobilă cu timpul fiecărui
 * cadru, iar la fiecare margine se pierde sau se câștigă un cadru după cum cad
 * rotunjirile. Pe cincisprezece segmente înseamnă o secundă întreagă — și nu
 * uniform, ci acumulat: zoom-urile de la final ajung să cadă pe lângă clickurile
 * lor, exact defectul de care ne temem.
 *
 * Pe indici întregi nu există ambiguitate: `between(n, 100, 249)` păstrează
 * fix 150 de cadre, iar aritmetica mea de aici dă exact același număr.
 */
interface SegmentCadre {
  prim: number;
  ultim: number; // inclusiv
}

function inCadre(vii: Segment[], fps: number, cadreDisponibile: number): SegmentCadre[] {
  return vii
    .map((s) => ({
      prim: Math.round(s.de * fps),
      // Ultimul beat se poate întinde dincolo de finalul filmului: filmarea se
      // oprește imediat după el, iar ffmpeg mai are de scris ce-i rămăsese în
      // coadă. Diferența măsurată a fost de ~1s, adică 29 de cadre cerute care
      // nu există. Fără clamp, durata raportată aici ar fi cu o secundă mai mare
      // decât fișierul — genul de nepotrivire care se propagă în toată faza 7.
      ultim: Math.min(Math.round(s.pana * fps) - 1, cadreDisponibile - 1),
    }))
    .filter((s) => s.ultim >= s.prim);
}

/** Câte cadre are filmul brut, după ce `fps` îl aduce la rată constantă. */
function cadreDinFilm(fisier: string, fps: number): number {
  const durata = Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fisier,
    ]).toString().trim()
  );
  if (!Number.isFinite(durata) || durata <= 0) {
    throw new Error(`nu pot citi durata lui ${fisier}`);
  }
  return Math.floor(durata * fps);
}

/** Unde ajunge un moment din filmul brut pe axa finală. `null` = a fost tăiat. */
function peAxaFinala(tFilm: number, seg: SegmentCadre[], fps: number): number | null {
  const n = Math.round(tFilm * fps);
  let inainte = 0;
  for (const s of seg) {
    if (n < s.prim) return null;
    if (n <= s.ultim) return (inainte + (n - s.prim)) / fps;
    inainte += s.ultim - s.prim + 1;
  }
  return null;
}

// ── Zoom-ul ──────────────────────────────────────────────────────────────────

/**
 * Expresia de zoom, ca funcție de timp, pentru tot filmul.
 *
 * `zoompan` e exclus de spec, și pe bună dreptate: lucrează în pași de pixel
 * întreg și la 400ms de tranziție se vede cum sare. Aici folosim `scale` cu
 * `eval=frame` — recalculează dimensiunea la fiecare cadru — urmat de `crop`
 * la dimensiunea fixă de ieșire. Crop-ul are nevoie de o intrare cel puțin cât
 * ieșirea, ceea ce e mereu adevărat fiindcă zoom-ul pornește de la 1.0.
 *
 * Curba: aceeași rampă lină în ambele capete, prin `sin`. O rampă liniară se
 * simte mecanic exact la început și la sfârșit, unde ochiul e cel mai atent.
 */
interface Zoom {
  /** secunde pe axa finală */
  la: number;
  scala: number;
  /** centrul zoom-ului, în fracțiuni din cadru */
  fx: number;
  fy: number;
  beat: string;
}

function rampa(t: string, de: number, pana: number): string {
  // 0 → 1, lin la ambele capete: (1 - cos(pi * x)) / 2
  const x = `((${t}-${de.toFixed(3)})/${(pana - de).toFixed(3)})`;
  return `((1-cos(PI*min(max(${x},0),1)))/2)`;
}

function expresieZoom(zoomuri: Zoom[], tinuta: number): string {
  // Pornim de la 1 și adunăm, pentru fiecare zoom, cât urcă și cât coboară.
  // Zoom-urile nu se suprapun în timeline, deci suma e sigură.
  const z = CFG.zoomMs / 1000;
  const bucati = zoomuri.map((zo) => {
    const sus = `(${(zo.scala - 1).toFixed(4)}*${rampa("t", zo.la - z, zo.la)})`;
    const jos = `(${(zo.scala - 1).toFixed(4)}*${rampa("t", zo.la + tinuta, zo.la + tinuta + z)})`;
    return `(${sus}-${jos})`;
  });
  return bucati.length ? `(1+${bucati.join("+")})` : "1";
}

function expresieCentru(zoomuri: Zoom[], axa: "x" | "y", tinuta: number): string {
  // Centrul se mută către punctul de click pe aceeași rampă ca scala, ca să nu
  // existe un moment în care imaginea e mărită dar încă centrată aiurea.
  const z = CFG.zoomMs / 1000;
  const bucati = zoomuri.map((zo) => {
    const tinta = (axa === "x" ? zo.fx : zo.fy) - 0.5;
    const sus = `(${tinta.toFixed(4)}*${rampa("t", zo.la - z, zo.la)})`;
    const jos = `(${tinta.toFixed(4)}*${rampa("t", zo.la + tinuta, zo.la + tinuta + z)})`;
    return `(${sus}-${jos})`;
  });
  return bucati.length ? `(0.5+${bucati.join("+")})` : "0.5";
}

// ── Montajul propriu-zis ─────────────────────────────────────────────────────

async function main() {
  if (!existsSync(CFG.intrare)) throw new Error(`nu găsesc ${CFG.intrare}`);
  if (!existsSync(CFG.keyframes)) throw new Error(`nu găsesc ${CFG.keyframes}`);

  const kf: Keyframes = JSON.parse(readFileSync(CFG.keyframes, "utf8"));

  console.log("── montaj ──────────────────────────────────────────");
  console.log(`  sursă      ${CFG.intrare}  (${kf.cadru.latime}x${kf.cadru.inaltime} @ ${kf.fps}fps)`);

  // Textele se randează în browser, cu fonturile produsului. Vezi texte.ts
  // pentru de ce nu merge cu drawtext.
  const pngTexte = await randeazaTexte(TEXTE);

  const marker = gasesteMarker(CFG.intrare, kf.fps);
  console.log(
    `  marker     la ${marker.start.toFixed(3)}s, ${marker.cadre} cadre ` +
    `→ decalajul dintre pornirea lui ffmpeg și primul cadru scris`
  );

  const vii = segmenteVii(kf, marker.start, marker.cadre / kf.fps);
  const disponibile = cadreDinFilm(CFG.intrare, kf.fps);
  const seg = inCadre(vii, kf.fps, disponibile);
  const totalCadre = seg.reduce((s, v) => s + (v.ultim - v.prim + 1), 0);
  const durataFinala = totalCadre / kf.fps;
  const taiat = kf.durataMs / 1000 - durataFinala + marker.start;
  console.log(
    `  tăieturi   ${seg.length} segmente păstrate (${totalCadre} cadre), ${taiat.toFixed(1)}s aruncate ` +
    `(timp mort + marker)`
  );
  console.log(`  durată     ${durataFinala.toFixed(2)}s`);

  // Clickurile devin zoom-uri, cu timpii mutați pe axa finală.
  const tinuta = 1.2; // cât stă zoom-ul sus, înainte să coboare
  const zoomuri: Zoom[] = [];
  for (const e of kf.evenimente) {
    if (e.tip !== "click" || !e.zoom || e.x === undefined || e.y === undefined) continue;
    const tFilm = marker.start + e.t / 1000;
    const tFinal = peAxaFinala(tFilm, seg, kf.fps);
    if (tFinal === null) {
      console.log(`  ! zoom-ul lui ${e.beat} cade într-un interval tăiat — îl sar`);
      continue;
    }
    zoomuri.push({
      la: tFinal,
      scala: e.zoom,
      fx: e.x / kf.cadru.latime,
      fy: e.y / kf.cadru.inaltime,
      beat: e.beat,
    });
  }
  console.log(`  zoom       ${zoomuri.length} clickuri`);
  for (const z of zoomuri) {
    console.log(`             ${z.la.toFixed(2)}s  ×${z.scala}  ${z.beat}`);
  }

  // ── Filter graph ──
  const W = CFG.latime || kf.cadru.latime;
  const H = CFG.inaltime || kf.cadru.inaltime;
  if (W !== kf.cadru.latime || H !== kf.cadru.inaltime) {
    console.log(`  ! ieșirea e ${W}x${H}, sursa e ${kf.cadru.latime}x${kf.cadru.inaltime}`);
  }

  // Tăierea se face într-o SINGURĂ trecere, cu `select`.
  //
  // Varianta evidentă — câte un `trim` pe segment, apoi `concat` — a dărâmat
  // WSL-ul întreg („Catastrophic failure”). Motivul: cele cincisprezece `trim`
  // pornesc toate din aceeași intrare, deci ffmpeg deschide cincisprezece
  // ramuri paralele și ține cadre tamponate pentru fiecare până îi vine rândul.
  // Ultimul segment e la secunda 87, deci ramura lui așteaptă tot filmul. Pe o
  // mașină cu 3.8 GB nu are unde.
  //
  // `select` decide cadru cu cadru dacă îl păstrează, iar `setpts` renumerotează
  // ce a rămas într-o axă continuă. O trecere, memorie constantă.
  const pastreaza = seg.map((s) => `between(n,${s.prim},${s.ultim})`).join("+");

  // `fps` ÎNAINTE de `select`, și e obligatoriu.
  //
  // Captura a prins 92% din cadre, deci `raw.mkv` are goluri: pachetele au
  // timestampuri corecte, dar lipsesc din loc în loc. `setpts=N/FRAME_RATE/TB`
  // renumerotează ce a rămas la 30fps constant — adică împachetează 50 de
  // secunde de conținut în 47.6, și tot filmul rulează cu 5% mai repede.
  //
  // Mai rău: zoom-urile sunt calculate pe axa finală în timp real, deci ar
  // ateriza cu peste o secundă pe lângă clickurile lor spre finalul filmului.
  // Exact „zoom-ul sare” de care ne temem.
  //
  // `fps` duplică cadrele lipsă și reface o axă de 30fps adevărată, pe care
  // `between(t,…)` și timpii zoom-ului înseamnă același lucru.
  const taiere =
    `[0:v]fps=${kf.fps},select='${pastreaza}',setpts=N/FRAME_RATE/TB[taiat]`;

  const Z = expresieZoom(zoomuri, tinuta);
  const CX = expresieCentru(zoomuri, "x", tinuta);
  const CY = expresieCentru(zoomuri, "y", tinuta);

  const pasi = [
    // Scala ține cadrul la dimensiunea de ieșire înmulțită cu zoom-ul. `ceil`
    // la par: x264 refuză dimensiuni impare.
    `[taiat]scale=w='ceil(${W}*${Z}/2)*2':h='ceil(${H}*${Z}/2)*2':eval=frame:flags=bicubic[marit]`,
    // Fereastra decupată e mereu exact cât ieșirea, deci dimensiunea finală e
    // constantă — altfel encoderul s-ar opri.
    // Centrarea: punctul de click trebuie să ajungă în MIJLOCUL cadrului.
    //
    // Prima variantă era `x=(in_w-W)*FX`, care pare corectă și nu e: ea plimbă
    // fereastra între marginea stângă și cea dreaptă proporțional cu FX, în loc
    // să pună punctul în centru. La zoom 1.8 pe o celulă din stânga, ieșea
    // fereastra lipită de marginea stângă, cu bara laterală în cadru și celula
    // pe jumătate afară — verificat pe cadrul de la 29.83s.
    //
    // Corect: punctul în coordonate mărite e FX*in_w, iar fereastra începe cu
    // jumătate de lățime mai la stânga. `min`/`max` o țin în imagine când
    // punctul e prea aproape de o margine.
    `[marit]crop=w=${W}:h=${H}:` +
      `x='max(0,min(in_w-${W},${CX}*in_w-${W}/2))':` +
      `y='max(0,min(in_h-${H},${CY}*in_h-${H}/2))'[cadru]`,
    // Gradare subtilă. Peste 1.1 începe să arate „filtrat”.
    `[cadru]eq=contrast=1.06:saturation=1.08[gradat]`,
  ];

  // ── Sunet ──
  const areMuzica = CFG.muzica !== "" && existsSync(CFG.muzica);
  if (CFG.muzica !== "" && !areMuzica) {
    console.log(`  ! muzica ${CFG.muzica} nu există — pun pistă tăcută`);
  }
  const intrariAudio = areMuzica
    ? ["-i", CFG.muzica]
    : ["-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo`];

  // ── Textele, ca straturi peste imagine ──
  //
  // Fiecare PNG devine o intrare proprie, ținută pe ecran exact cât trebuie.
  // `fade` lucrează pe canalul alfa, deci textul apare și dispare în 250ms fără
  // să atingă imaginea de dedesubt.
  //
  // PNG-urile sunt randate la scară dublă (vezi texte.ts) ca marginile literelor
  // să rămână curate; aici se înjumătățesc la loc.
  const f = CFG.fadeMs / 1000;
  const intrariText: string[] = [];
  let ultim = "gradat";

  TEXTE.forEach((t, i) => {
    const cale = pngTexte.get(t.id);
    if (!cale) return;
    const de = t.de / 1000;
    const pana = t.pana / 1000;
    const durata = pana - de;
    const index = 2 + intrariText.length / 6; // intrarea 0 = filmul, 1 = sunetul

    intrariText.push("-loop", "1", "-t", durata.toFixed(3), "-i", cale);

    pasi.push(
      `[${index}:v]scale=iw/2:-1,format=rgba,` +
      `fade=in:st=0:d=${f.toFixed(3)}:alpha=1,` +
      `fade=out:st=${(durata - f).toFixed(3)}:d=${f.toFixed(3)}:alpha=1,` +
      `setpts=PTS+${de.toFixed(3)}/TB[str${i}]`
    );
    pasi.push(
      `[${ultim}][str${i}]overlay=x='(W-w)/2':y='H*${t.y}-h/2':` +
      `enable='between(t,${de.toFixed(3)},${pana.toFixed(3)})'[txt${i}]`
    );
    ultim = `txt${i}`;
  });

  pasi.push(`[${ultim}]format=yuv420p[vout]`);

  const graf = [taiere, ...pasi].join(";");

  const argumente = [
    "-v", "warning",
    "-stats",
    "-i", CFG.intrare,
    ...intrariAudio,
    ...intrariText,
    "-filter_complex", graf,
    "-map", "[vout]",
    "-map", "1:a",
    "-t", durataFinala.toFixed(3),
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-profile:v", "high",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    "-y", CFG.iesire,
  ];

  console.log("\n  encodez…");
  const t0 = Date.now();
  const rez = spawnSync("ffmpeg", argumente, { stdio: ["ignore", "inherit", "inherit"] });
  if (rez.status !== 0) {
    console.error("\n  ffmpeg a eșuat. Graful e mai jos, dacă e nevoie de el:\n");
    console.error(graf);
    process.exitCode = 1;
    return;
  }

  const octeti = statSync(CFG.iesire).size;
  const durata = Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", CFG.iesire,
    ]).toString().trim()
  );
  const dim = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,nb_frames,r_frame_rate",
    "-of", "csv=p=0", CFG.iesire,
  ]).toString().trim();

  console.log("\n── rezultat ────────────────────────────────────────");
  console.log(`  ${CFG.iesire}`);
  console.log(`  ${(octeti / 1024 / 1024).toFixed(1)} MB · ${durata.toFixed(2)}s · ${dim}`);
  console.log(`  encodat în ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  console.log(`  sunet: ${areMuzica ? CFG.muzica : "pistă tăcută (COMPOSE_MUSIC=<cale> pentru muzică)"}`);
  console.log("────────────────────────────────────────────────────");
}

main().catch((e) => {
  console.error("\n  EROARE:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
