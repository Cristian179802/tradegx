// ── Monte Carlo: mii de vieți alternative ale contului ───────────────────────
//
// Se reeșantionează randamentele REALE ale utilizatorului, cu înlocuire. Nu se
// presupune nicio distribuție — nici normală, nici altceva. Singura ipoteză e
// că tranzacțiile viitoare seamănă cu cele trecute, iar asta e deja destul de
// tare cât s-o spunem în interfață.
//
// Funcția stătea DUBLAT, în pagina web. Mutarea ei aici nu e curățenie: e o
// calculație pe care omul o citește ca „am 12% șanse să-mi ard contul". Două
// copii care se depărtează una de alta ar da două cifre diferite pentru
// aceeași întrebare, pe același cont, în aceeași zi.
//
// `aleator` e injectabil ca să poată fi testată. Cu un generator determinist,
// rezultatul e verificabil; cu `Math.random`, nu se poate afirma nimic despre
// corectitudine, doar că „pare rezonabil".

export interface ParamMonteCarlo {
  /** Randamentele istorice, în procente per tranzacție (ex. −1.2, +0.8). */
  randamente: number[];
  /** Câte tranzacții se simulează înainte. */
  tranzactii: number;
  /** Câte vieți alternative. Mai multe = margini mai stabile, mai lent. */
  simulari: number;
  /** Ținta de profit, % peste start. */
  tintaPct: number;
  /** Pragul de ruină: drawdown maxim acceptat, %. */
  drawdownPct: number;
  /** Generator uniform [0,1). Implicit `Math.random`. */
  aleator?: () => number;
}

export interface RezultatMonteCarlo {
  /** Probabilitatea de a atinge ținta, %. */
  pTinta: number;
  /** Probabilitatea de a atinge pragul de ruină, %. */
  pRuina: number;
  /** Nici una, nici alta — %. */
  pNiciuna: number;
  /** Echitatea finală a fiecărei simulări (100 = start). */
  finale: number[];
  percentile: { p5: number; p25: number; p50: number; p75: number; p95: number };
  /** Câteva trasee, pentru desen. */
  trasee: number[][];
  /** Media drawdown-ului maxim, %. */
  ddMediu: number;
  /** Percentilele echității la FIECARE pas — conul. */
  con: { p5: number[]; p25: number[]; p50: number[]; p75: number[]; p95: number[] };
}

/** Câte trasee se păstrează pentru desen. Peste șase, graficul devine pâclă. */
const TRASEE_PASTRATE = 6;

export function monteCarlo(p: ParamMonteCarlo): RezultatMonteCarlo | null {
  const { randamente, tintaPct, drawdownPct } = p;
  const nT = Math.max(1, Math.floor(p.tranzactii));
  const nS = Math.max(1, Math.floor(p.simulari));
  const aleator = p.aleator ?? Math.random;

  // Fără istoric nu se simulează nimic. A întoarce un rezultat gol ar fi mai
  // rău decât a nu întoarce nimic: interfața ar afișa „0% șanse de ruină".
  if (randamente.length === 0) return null;

  const finale: number[] = [];
  const trasee: number[][] = [];
  let atinsTinta = 0;
  let atinsRuina = 0;
  let sumaDD = 0;

  // Echitatea tuturor simulărilor, la fiecare pas. De aici iese conul.
  // `Float64Array` în loc de `number[]`: la zeci de mii de valori, diferența
  // de alocare se simte pe un telefon.
  const laPas: Float64Array[] = Array.from(
    { length: nT + 1 },
    () => new Float64Array(nS),
  );
  laPas[0]!.fill(100);

  for (let s = 0; s < nS; s++) {
    let echitate = 100;
    let varf = 100;
    let ddMaxim = 0;
    let deznodamant: "tinta" | "ruina" | null = null;
    const traseu: number[] = [100];

    for (let i = 0; i < nT; i++) {
      const r = randamente[(aleator() * randamente.length) | 0] ?? 0;
      // Randament compus pe echitatea curentă, nu adunat: două pierderi de 10%
      // nu fac 20%, fac 19%. Pe cincizeci de tranzacții, diferența e mare.
      echitate *= 1 + r / 100;
      if (echitate > varf) varf = echitate;
      const dd = ((varf - echitate) / varf) * 100;
      if (dd > ddMaxim) ddMaxim = dd;

      laPas[i + 1]![s] = echitate;
      if (s < TRASEE_PASTRATE) traseu.push(echitate);

      // Primul prag atins decide. Un cont care a trecut prin ruină și apoi și-a
      // revenit tot a fost ars — contul real ar fi fost închis acolo.
      if (deznodamant === null) {
        if (echitate >= 100 + tintaPct) deznodamant = "tinta";
        else if (dd >= drawdownPct) deznodamant = "ruina";
      }
    }

    if (deznodamant === "tinta") atinsTinta++;
    else if (deznodamant === "ruina") atinsRuina++;
    sumaDD += ddMaxim;
    finale.push(echitate);
    if (s < TRASEE_PASTRATE) trasee.push(traseu);
  }

  const sortate = [...finale].sort((a, b) => a - b);
  const q = (x: number) =>
    sortate[Math.min(sortate.length - 1, Math.floor(x * sortate.length))]!;

  const con = {
    p5: [] as number[], p25: [] as number[], p50: [] as number[],
    p75: [] as number[], p95: [] as number[],
  };
  for (const pas of laPas) {
    // `TypedArray.sort()` e numeric implicit — spre deosebire de `Array.sort()`,
    // care ar compara ca text și ar pune 100 înaintea lui 9.
    const v = pas.slice().sort();
    const la = (x: number) => v[Math.min(v.length - 1, Math.floor(x * v.length))]!;
    con.p5.push(la(0.05));
    con.p25.push(la(0.25));
    con.p50.push(la(0.5));
    con.p75.push(la(0.75));
    con.p95.push(la(0.95));
  }

  return {
    pTinta: (atinsTinta / nS) * 100,
    pRuina: (atinsRuina / nS) * 100,
    pNiciuna: ((nS - atinsTinta - atinsRuina) / nS) * 100,
    finale,
    percentile: { p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) },
    trasee,
    ddMediu: sumaDD / nS,
    con,
  };
}
