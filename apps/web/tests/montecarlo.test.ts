import { describe, it, expect } from "vitest";
import { monteCarlo } from "@tradegx/core";

// ── Monte Carlo ──────────────────────────────────────────────────────────────
//
// Simularea răspunde la „ce șanse am să-mi ard contul". Cine citește 8% în loc
// de 38% pariază altfel. Deci nu ajunge ca funcția să pară rezonabilă — trebuie
// să dea cifra CORECTĂ pe cazuri pe care le putem verifica cu mâna.
//
// Toate testele injectează un generator determinist. Cu `Math.random` nu se
// poate afirma nimic: același test ar trece azi și ar pica mâine din noroc.

/** Generator determinist: aceeași secvență la fiecare rulare. */
function aleatorFix(samanta = 1): () => number {
  let x = samanta >>> 0;
  return () => {
    // xorshift32 — suficient de uniform pentru teste, complet reproductibil.
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

/** Un singur randament posibil: simularea devine complet previzibilă. */
const doar = (r: number) => [r];

describe("monteCarlo — cazuri cu răspuns cunoscut", () => {
  it("fără istoric nu întoarce nimic", () => {
    // Un rezultat gol ar fi afișat ca „0% șanse de ruină" — mai rău decât nimic.
    expect(
      monteCarlo({ randamente: [], tranzactii: 10, simulari: 10, tintaPct: 10, drawdownPct: 10 }),
    ).toBeNull();
  });

  it("compune randamentele, nu le adună", () => {
    // Două tranzacții de +10% din 100: 100 → 110 → 121. NU 120.
    const r = monteCarlo({
      randamente: doar(10),
      tranzactii: 2,
      simulari: 5,
      tintaPct: 1000, // nu se atinge
      drawdownPct: 100,
      aleator: aleatorFix(),
    })!;
    for (const f of r.finale) expect(f).toBeCloseTo(121, 10);
  });

  it("o serie numai câștigătoare atinge ținta în toate simulările", () => {
    const r = monteCarlo({
      randamente: doar(1),
      tranzactii: 50, // 1.01^50 ≈ 1.64, deci +10% se atinge sigur
      simulari: 200,
      tintaPct: 10,
      drawdownPct: 10,
      aleator: aleatorFix(),
    })!;
    expect(r.pTinta).toBe(100);
    expect(r.pRuina).toBe(0);
    expect(r.ddMediu).toBeCloseTo(0, 10);
  });

  it("o serie numai pierzătoare atinge ruina în toate simulările", () => {
    const r = monteCarlo({
      randamente: doar(-1),
      tranzactii: 50, // 0.99^50 ≈ 0.605 → drawdown ~39%
      simulari: 200,
      tintaPct: 10,
      drawdownPct: 5,
      aleator: aleatorFix(),
    })!;
    expect(r.pRuina).toBe(100);
    expect(r.pTinta).toBe(0);
  });

  it("primul prag atins decide: ruina nu se anulează prin revenire", () => {
    // −30% apoi +100%: contul termină peste start, dar a trecut prin −30%.
    // Un cont real ar fi fost închis acolo, deci simularea trebuie s-o spună.
    const r = monteCarlo({
      randamente: [-30, 100],
      tranzactii: 2,
      simulari: 300,
      tintaPct: 20,
      drawdownPct: 25,
      aleator: aleatorFix(),
    })!;
    expect(r.pRuina).toBeGreaterThan(0);
  });

  it("cele trei probabilități însumează exact 100", () => {
    const r = monteCarlo({
      randamente: [-2.4, 1.1, -0.7, 3.2, 0.4, -1.8, 2.6],
      tranzactii: 40,
      simulari: 1000,
      tintaPct: 10,
      drawdownPct: 10,
      aleator: aleatorFix(7),
    })!;
    expect(r.pTinta + r.pRuina + r.pNiciuna).toBeCloseTo(100, 10);
  });
});

describe("monteCarlo — forma rezultatului", () => {
  const r = monteCarlo({
    randamente: [-2.4, 1.1, -0.7, 3.2, 0.4, -1.8, 2.6, -0.3, 1.9],
    tranzactii: 30,
    simulari: 800,
    tintaPct: 10,
    drawdownPct: 12,
    aleator: aleatorFix(42),
  })!;

  it("întoarce câte o valoare finală per simulare", () => {
    expect(r.finale).toHaveLength(800);
  });

  it("percentilele sunt în ordine crescătoare", () => {
    const { p5, p25, p50, p75, p95 } = r.percentile;
    expect(p5).toBeLessThanOrEqual(p25);
    expect(p25).toBeLessThanOrEqual(p50);
    expect(p50).toBeLessThanOrEqual(p75);
    expect(p75).toBeLessThanOrEqual(p95);
  });

  it("conul are un punct pentru fiecare pas, plus startul", () => {
    expect(r.con.p50).toHaveLength(31);
    expect(r.con.p5[0]).toBe(100);
    expect(r.con.p95[0]).toBe(100);
  });

  it("conul nu se încrucișează la niciun pas", () => {
    // Dacă sortarea per pas ar fi textuală (greșeala clasică la `Array.sort`),
    // 100 ar veni înaintea lui 9 și marginile s-ar inversa pe undeva.
    for (let i = 0; i < r.con.p50.length; i++) {
      expect(r.con.p5[i]!).toBeLessThanOrEqual(r.con.p25[i]!);
      expect(r.con.p25[i]!).toBeLessThanOrEqual(r.con.p50[i]!);
      expect(r.con.p50[i]!).toBeLessThanOrEqual(r.con.p75[i]!);
      expect(r.con.p75[i]!).toBeLessThanOrEqual(r.con.p95[i]!);
    }
  });

  it("păstrează cel mult șase trasee pentru desen", () => {
    expect(r.trasee.length).toBeLessThanOrEqual(6);
    for (const t of r.trasee) expect(t).toHaveLength(31);
  });

  it("e reproductibil cu același generator", () => {
    const din = (s: number) =>
      monteCarlo({
        randamente: [1, -1, 2, -2],
        tranzactii: 10,
        simulari: 100,
        tintaPct: 5,
        drawdownPct: 5,
        aleator: aleatorFix(s),
      })!;
    expect(din(3).pTinta).toBe(din(3).pTinta);
    expect(din(3).finale).toEqual(din(3).finale);
  });
});
