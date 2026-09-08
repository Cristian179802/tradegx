import { describe, it, expect } from "vitest";
import { compactMoney } from "@/lib/use-nav-pulse";
import { priceDigits } from "@/lib/price-format";

// ── Formatarea cifrelor pe care le vede traderul ─────────────────────────────
//
// Cazurile de aici nu sunt inventate: fiecare a fost un defect real, prins pe
// producție. Un jurnal de tranzacționare care afișează greșit o sumă sau un preț
// e mai rău decât unul care nu le afișează deloc — pe primul îl crezi.

describe("compactMoney — sume în spațiile mici din navigație", () => {
  it("păstrează bănuții sub o mie", () => {
    // A afișat „960" pentru 959,82. La scara asta, cele două nu sunt același
    // lucru pentru cineva care își urmărește contul.
    expect(compactMoney(959.82)).toBe("+959.82");
  });

  it("nu pierde zeroul din față", () => {
    // A afișat „.00" în loc de „0.00" — arăta a defect, nu a sold.
    expect(compactMoney(0)).toBe("0.00");
  });

  it("nu pune plus pe zero", () => {
    expect(compactMoney(0)).not.toContain("+");
  });

  it("păstrează MEREU minusul, chiar cu plusul dezactivat", () => {
    // Un P&L negativ afișat fără semn e o minciună, indiferent de context.
    expect(compactMoney(-42.5, { plus: false })).toBe("-42.50");
    expect(compactMoney(-1500, { plus: false })).toBe("-1.50k");
  });

  it("prescurtează miile și milioanele", () => {
    expect(compactMoney(1500)).toBe("+1.50k");
    expect(compactMoney(12400)).toBe("+12.4k");
    expect(compactMoney(1_300_000)).toBe("+1.3M");
  });

  it("plusul se poate dezactiva fără să afecteze negativele", () => {
    expect(compactMoney(100, { plus: false })).toBe("100.00");
    expect(compactMoney(100)).toBe("+100.00");
  });
});

describe("priceDigits — câte zecimale are un preț", () => {
  it("perechile forex au cinci zecimale", () => {
    // Graficul afișa 1.17 în loc de 1.16495. Pentru cineva care intră pe pip,
    // asta face prețul inutilizabil.
    expect(priceDigits("EURUSD", 1.16495)).toBe(5);
    expect(priceDigits("GBPUSD", 1.2734)).toBe(5);
  });

  it("perechile cu yen au trei", () => {
    expect(priceDigits("USDJPY", 149.235)).toBe(3);
  });

  it("metalele au două", () => {
    expect(priceDigits("XAUUSD", 2650.5)).toBe(2);
  });

  it("cripto se formatează după mărime, pe praguri", () => {
    // Sub un dolar, mărimea e singurul indiciu: o monedă la 0,08 și una la
    // 0,0000004 nu pot avea aceeași formatare. Pragurile sunt cele din cod.
    expect(priceDigits("HEMIUSDT", 0.083412)).toBe(4);
    expect(priceDigits("PEPEUSDT", 0.0034)).toBe(6);
    expect(priceDigits("SHIBUSDT", 0.00000042)).toBe(8);
  });

  it("cripto scump nu are zecimale inutile", () => {
    expect(priceDigits("BTCUSDT", 68933.69)).toBeLessThanOrEqual(2);
  });

  it("nu crapă fără preț", () => {
    expect(() => priceDigits("EURUSD")).not.toThrow();
    expect(() => priceDigits("EURUSD", null)).not.toThrow();
  });
});
