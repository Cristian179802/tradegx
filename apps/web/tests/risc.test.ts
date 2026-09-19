import { describe, it, expect } from "vitest";
import {
  pipSize, pipValue, contractSizeImplicit, clasificaSimbol, monedePereche, curs,
  positionSize, calcRiskMoney, riskReward, stopPips, expectancyR, riskOfRuin,
  maxDrawdown, edgeMetrics, sharpe, sortino, cagr, calmar,
} from "@tradegx/core";

// ── Matematica pe care omul pariază bani ─────────────────────────────────────
//
// DE CE EXISTĂ FIȘIERUL ĂSTA. `positionSize`, `calcRiskMoney`, `maxDrawdown` și
// `edgeMetrics` n-aveau NICIUN test. Sunt exact cifrele după care cineva decide
// cât pune pe o tranzacție. O regresie acolo nu dă eroare, nu apare în jurnal,
// nu se vede la review — se vede pe extrasul de cont, mai târziu.
//
// Testele de mai jos sunt scrise pe cazuri verificabile cu mâna, nu pe ce
// întoarce codul azi. Dacă unul pică, întâi verifici calculul din comentariu.

describe("clasificarea instrumentelor", () => {
  it("recunoaște felul simbolului", () => {
    expect(clasificaSimbol("EURUSD")).toBe("FOREX");
    expect(clasificaSimbol("USDJPY")).toBe("FOREX");
    expect(clasificaSimbol("XAUUSD")).toBe("METAL");
    expect(clasificaSimbol("NAS100")).toBe("INDICE");
    expect(clasificaSimbol("BTCUSD")).toBe("CRIPTO");
    expect(clasificaSimbol("BRENT")).toBe("MARFA");
  });

  it("nu se încurcă în separatoare sau litere mici", () => {
    expect(clasificaSimbol("eur/usd")).toBe("FOREX");
    expect(clasificaSimbol("XAU_USD")).toBe("METAL");
  });

  it("desface perechile valutare, și numai pe ele", () => {
    expect(monedePereche("GBPJPY")).toEqual({ baza: "GBP", cotata: "JPY" });
    expect(monedePereche("XAUUSD")).toBeNull();
    expect(monedePereche("NAS100")).toBeNull();
  });
});

describe("pipSize", () => {
  it("perechile cu JPY au pipul de o sută de ori mai mare", () => {
    expect(pipSize("EURUSD")).toBe(0.0001);
    expect(pipSize("USDJPY")).toBe(0.01);
    expect(pipSize("GBPJPY")).toBe(0.01);
  });

  it("indicii se mișcă în puncte întregi", () => {
    expect(pipSize("NAS100")).toBe(1);
    expect(pipSize("GER40")).toBe(1);
  });

  it("metale, cripto și mărfuri: 0,01", () => {
    expect(pipSize("XAUUSD")).toBe(0.01);
    expect(pipSize("BTCUSD")).toBe(0.01);
    expect(pipSize("BRENT")).toBe(0.01);
  });
});

describe("curs", () => {
  it("aceeași monedă înseamnă 1", () => {
    expect(curs("USD", "USD")).toBe(1);
  });

  it("găsește perechea directă", () => {
    expect(curs("GBP", "USD", { GBPUSD: 1.27 })).toBe(1.27);
  });

  it("întoarce perechea inversă", () => {
    // Avem USDJPY = 150 ⇒ JPY→USD e 1/150.
    expect(curs("JPY", "USD", { USDJPY: 150 })).toBeCloseTo(1 / 150, 10);
  });

  it("nu inventează când nu știe", () => {
    expect(curs("HUF", "USD", { GBPUSD: 1.27 })).toBeNull();
    expect(curs("GBP", "USD", { GBPUSD: 0 })).toBeNull();
  });
});

describe("pipValue — greșeala care a stat ascunsă", () => {
  it("EURUSD pe cont în dolari: un pip la lot face 10 $", () => {
    // 0,0001 × 100.000 = 10 USD, iar USD e chiar moneda contului.
    expect(pipValue({ symbol: "EURUSD", price: 1.1 })).toBe(10);
  });

  it("USDJPY pe cont în dolari: ~6,7 $, NU 1.000 $", () => {
    // 0,01 × 100.000 = 1.000 JPY. La 149,50 JPY/USD ⇒ 1000/149,5 = 6,689…
    // Varianta veche trata cele 1.000 de JPY drept 1.000 de dolari, deci
    // dădea o poziție de ~150 de ori prea mică.
    const v = pipValue({ symbol: "USDJPY", price: 149.5 });
    expect(v).toBeCloseTo(6.689, 2);
  });

  it("USDCAD și USDCHF se calculează la fel, din preț", () => {
    expect(pipValue({ symbol: "USDCAD", price: 1.3 })).toBeCloseTo(10 / 1.3, 4);
    expect(pipValue({ symbol: "USDCHF", price: 0.92 })).toBeCloseTo(10 / 0.92, 4);
  });

  it("EURGBP pe cont în dolari are nevoie de cursul GBP→USD", () => {
    // 0,0001 × 100.000 = 10 GBP. La 1,27 USD/GBP ⇒ 12,70 USD.
    expect(pipValue({ symbol: "EURGBP", price: 0.85, rates: { GBPUSD: 1.27 } }))
      .toBeCloseTo(12.7, 6);
  });

  it("fără cursul necesar spune „nu știu”, nu zero", () => {
    expect(pipValue({ symbol: "EURGBP", price: 0.85 })).toBeNull();
    // Contul e în moneda de bază, dar prețul lipsește ⇒ nu se poate.
    expect(pipValue({ symbol: "USDJPY" })).toBeNull();
  });

  it("aurul: 100 de uncii pe lot, pip 0,01 ⇒ 1 $ pe pip", () => {
    expect(pipValue({ symbol: "XAUUSD", price: 2400 })).toBe(1);
    expect(contractSizeImplicit("XAUUSD")).toBe(100);
  });

  it("acceptă mărimea de contract a brokerului tău", () => {
    expect(pipValue({ symbol: "EURUSD", price: 1.1, contractSize: 10_000 })).toBe(1);
  });

  it("cont în euro, pereche în dolari: conversie prin curs", () => {
    // 10 USD la EURUSD 1,10 ⇒ 10 × (1/1,10) = 9,0909… EUR
    const v = pipValue({ symbol: "GBPUSD", price: 1.27, accountCurrency: "EUR", rates: { EURUSD: 1.1 } });
    expect(v).toBeCloseTo(10 / 1.1, 4);
  });
});

describe("stopPips", () => {
  it("50 de pips pe EURUSD", () => {
    expect(stopPips(1.1, 1.095, "EURUSD")).toBeCloseTo(50, 6);
  });

  it("50 de pips pe USDJPY înseamnă 0,50 în preț", () => {
    expect(stopPips(150.0, 149.5, "USDJPY")).toBeCloseTo(50, 6);
  });
});

describe("positionSize", () => {
  it("cazul-școală: 10.000 $, risc 1%, stop 50 pips ⇒ 0,20 loturi", () => {
    // 100 $ risc / (50 pips × 10 $/pip) = 0,2
    expect(positionSize({ balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.095, symbol: "EURUSD" }))
      .toBe(0.2);
  });

  it("pe USDJPY dă ~0,30 loturi, nu 0,002", () => {
    // 100 $ / (50 pips × 6,689 $) = 0,299 ⇒ 0,30
    const lot = positionSize({ balance: 10_000, riskPct: 1, entryPrice: 149.5, stopLoss: 149.0, symbol: "USDJPY" });
    expect(lot).toBeCloseTo(0.3, 2);
  });

  it("dublarea riscului dublează poziția", () => {
    const a = positionSize({ balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.095, symbol: "EURUSD" })!;
    const b = positionSize({ balance: 10_000, riskPct: 2, entryPrice: 1.1, stopLoss: 1.095, symbol: "EURUSD" })!;
    expect(b).toBeCloseTo(a * 2, 6);
  });

  it("stopul de două ori mai larg înjumătățește poziția", () => {
    const strans = positionSize({ balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.095, symbol: "EURUSD" })!;
    const larg = positionSize({ balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.09, symbol: "EURUSD" })!;
    expect(larg).toBeCloseTo(strans / 2, 6);
  });

  it("stop zero nu dă poziție infinită, ci nimic", () => {
    expect(positionSize({ balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.1, symbol: "EURUSD" }))
      .toBeNull();
  });

  it("fără curs pentru pereche încrucișată nu inventează o mărime", () => {
    expect(positionSize({ balance: 10_000, riskPct: 1, entryPrice: 0.85, stopLoss: 0.845, symbol: "EURGBP" }))
      .toBeNull();
  });

  it("valoarea pipului de la broker are prioritate", () => {
    // 100 $ / (50 × 8) = 0,25
    expect(positionSize({
      balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.095,
      symbol: "EURUSD", pipValuePerLot: 8,
    })).toBe(0.25);
  });
});

describe("calcRiskMoney", () => {
  it("un lot, 50 pips pe EURUSD ⇒ 500 $", () => {
    expect(calcRiskMoney({ entryPrice: 1.1, stopLoss: 1.095, lotSize: 1, symbol: "EURUSD" })).toBe(500);
  });

  it("e inversul lui positionSize", () => {
    const lot = positionSize({ balance: 10_000, riskPct: 1, entryPrice: 1.1, stopLoss: 1.095, symbol: "EURUSD" })!;
    const bani = calcRiskMoney({ entryPrice: 1.1, stopLoss: 1.095, lotSize: lot, symbol: "EURUSD" })!;
    expect(bani).toBeCloseTo(100, 6);
  });

  it("pe USDJPY nu mai raportează zeci de mii de dolari", () => {
    // Varianta veche: 0,50 × 1 × 100.000 = 50.000 „dolari” (erau JPY).
    const bani = calcRiskMoney({ entryPrice: 149.5, stopLoss: 149.0, lotSize: 1, symbol: "USDJPY" })!;
    expect(bani).toBeCloseTo(334.45, 1);
  });
});

describe("riskReward", () => {
  it("2:1 înseamnă 2", () => {
    expect(riskReward(1.1, 1.09, 1.12)).toBe(2);
  });

  it("merge și pe short", () => {
    expect(riskReward(1.1, 1.11, 1.08)).toBe(2);
  });

  it("fără risc nu există raport", () => {
    expect(riskReward(1.1, 1.1, 1.12)).toBeNull();
  });
});

describe("expectancyR", () => {
  it("50% win rate la 1:1 e fix pe zero", () => {
    expect(expectancyR(50, 1)).toBe(0);
  });

  it("40% la 2:1 iese pozitiv", () => {
    // 0,4 × 2 − 0,6 = 0,2
    expect(expectancyR(40, 2)).toBeCloseTo(0.2, 6);
  });

  it("60% la 0,5:1 iese negativ — win rate-ul singur nu spune nimic", () => {
    // 0,6 × 0,5 − 0,4 = −0,1
    expect(expectancyR(60, 0.5)).toBeCloseTo(-0.1, 6);
  });
});

describe("riskOfRuin", () => {
  const mereuCastig = () => 0;   // sub orice winFrac > 0 ⇒ câștig
  const mereuPierd = () => 1;    // niciodată sub winFrac ⇒ pierdere

  it("cine nu pierde niciodată nu se ruinează", () => {
    expect(riskOfRuin({
      winRatePct: 50, riskPct: 2, rr: 2, drawdownPct: 20, trades: 200,
      simulations: 50, aleator: mereuCastig,
    })).toBe(0);
  });

  it("cine pierde mereu se ruinează în toate scenariile", () => {
    expect(riskOfRuin({
      winRatePct: 50, riskPct: 5, rr: 2, drawdownPct: 20, trades: 200,
      simulations: 50, aleator: mereuPierd,
    })).toBe(100);
  });

  it("riscul mai mare pe tranzacție crește riscul de ruină", () => {
    const comun = { winRatePct: 45, rr: 1.5, drawdownPct: 25, trades: 150, simulations: 3000 };
    const mic = riskOfRuin({ ...comun, riskPct: 0.5 });
    const mare = riskOfRuin({ ...comun, riskPct: 5 });
    expect(mare).toBeGreaterThan(mic);
  });
});

describe("maxDrawdown", () => {
  it("o curbă care doar urcă n-are drawdown", () => {
    expect(maxDrawdown([100, 110, 120]).maxDrawdownPct).toBe(0);
  });

  it("de la 120 la 90 înseamnă 25%", () => {
    const d = maxDrawdown([100, 120, 90, 110]);
    expect(d.maxDrawdownPct).toBeCloseTo(0.25, 6);
    expect(d.peak).toBe(120);
    expect(d.trough).toBe(90);
  });

  it("ține cel mai adânc puț, nu ultimul", () => {
    // 100 → 50 e 50%; apoi 200 → 150 e doar 25%.
    expect(maxDrawdown([100, 50, 200, 150]).maxDrawdownPct).toBeCloseTo(0.5, 6);
  });

  it("o curbă goală nu aruncă", () => {
    expect(maxDrawdown([]).maxDrawdownPct).toBe(0);
  });
});

describe("edgeMetrics", () => {
  const t = [
    { pnl: 100, rMultiple: 2 },
    { pnl: -50, rMultiple: -1 },
    { pnl: 200, rMultiple: 4 },
    { pnl: -50, rMultiple: -1 },
  ];

  it("numără corect și scoate factorul de profit", () => {
    const m = edgeMetrics(t);
    expect(m.totalTrades).toBe(4);
    expect(m.wins).toBe(2);
    expect(m.losses).toBe(2);
    expect(m.winRatePct).toBe(50);
    expect(m.grossWin).toBe(300);
    expect(m.grossLoss).toBe(100);
    expect(m.netPnl).toBe(200);
    expect(m.profitFactor).toBe(3);
    expect(m.expectancyMoney).toBe(50);
    expect(m.expectancyR).toBeCloseTo(1, 6);
    expect(m.bestTrade).toBe(200);
    expect(m.worstTrade).toBe(-50);
  });

  it("fără pierderi, factorul de profit e infinit — și îl spunem ca `null`", () => {
    expect(edgeMetrics([{ pnl: 10 }]).profitFactor).toBeNull();
  });

  it("lista goală nu aruncă și nu inventează", () => {
    const m = edgeMetrics([]);
    expect(m.totalTrades).toBe(0);
    expect(m.winRatePct).toBe(0);
    expect(m.expectancyR).toBeNull();
  });

  it("tranzacțiile pe zero nu se numără nici ca profit, nici ca pierdere", () => {
    const m = edgeMetrics([{ pnl: 0 }, { pnl: 100 }]);
    expect(m.wins).toBe(1);
    expect(m.losses).toBe(0);
    expect(m.totalTrades).toBe(2);
  });
});

describe("sharpe / sortino / cagr / calmar", () => {
  it("fără variație nu există Sharpe", () => {
    expect(sharpe([0.01, 0.01, 0.01])).toBeNull();
  });

  it("Sortino pedepsește doar pierderile", () => {
    // Aceeași medie, dar a doua serie are volatilitate doar în sus.
    const cuMinus = sortino([0.02, -0.01, 0.02, -0.01]);
    const faraMinus = sortino([0.005, 0.005, 0.005, 0.005]);
    expect(cuMinus).not.toBeNull();
    // O serie fără randamente sub prag n-are deviație negativă ⇒ null.
    expect(faraMinus).toBeNull();
  });

  it("CAGR: dublare în exact un an înseamnă 100%", () => {
    expect(cagr(1000, 2000, 365)).toBeCloseTo(1, 6);
  });

  it("CAGR nu se calculează din nimic", () => {
    expect(cagr(0, 2000, 365)).toBeNull();
    expect(cagr(1000, 2000, 0)).toBeNull();
  });

  it("Calmar are nevoie de un drawdown real", () => {
    expect(calmar(0.4, 0.2)).toBeCloseTo(2, 6);
    expect(calmar(0.4, 0)).toBeNull();
    expect(calmar(null, 0.2)).toBeNull();
  });
});
