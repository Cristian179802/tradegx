import { describe, it, expect } from "vitest";
import {
  agregaCelule,
  construiesteCrossTab,
  esantionMic,
  PRAG_ESANTION,
  type TranzactieCrossTab,
} from "@/lib/analytics/cross-tab";

// ── Analiza pe două dimensiuni ───────────────────────────────────────────────
//
// Toată funcția stă pe o singură promisiune: suma celulelor filtrate dă EXACT
// aceeași cifră ca filtrarea tranzacțiilor brute. Dacă promisiunea cade,
// utilizatorul vede un win rate care nu se potrivește cu lista lui de
// tranzacții — și de acolo nu mai are încredere în nicio cifră din aplicație.
//
// Testele de aici compară agregarea pe celule cu numărarea directă, pe aceleași
// date. E singurul fel de a verifica ceva ce e, prin construcție, o optimizare.

function t(
  setup: string | null,
  sesiune: string | null,
  pnl: number | null,
  risc: number | null = 100
): TranzactieCrossTab {
  return { setupType: setup, sessionType: sesiune, pnlMoney: pnl, riskMoney: risc };
}

/** Adevărul de referință: filtrare directă, fără celule. */
function directa(
  tr: TranzactieCrossTab[],
  setupuri?: string[],
  sesiuni?: string[]
) {
  const x = tr.filter(
    (v) =>
      v.setupType &&
      v.sessionType &&
      v.pnlMoney != null &&
      (!setupuri?.length || setupuri.includes(v.setupType)) &&
      (!sesiuni?.length || sesiuni.includes(v.sessionType))
  );
  const castiguri = x.filter((v) => v.pnlMoney! > 0).length;
  return {
    tranzactii: x.length,
    castiguri,
    winRate: x.length ? (castiguri / x.length) * 100 : null,
    net: x.reduce((s, v) => s + v.pnlMoney!, 0),
  };
}

const ESANTION: TranzactieCrossTab[] = [
  t("FAIR_VALUE_GAP", "LONDON", 260),
  t("FAIR_VALUE_GAP", "LONDON", 180),
  t("FAIR_VALUE_GAP", "LONDON", -100),
  t("FAIR_VALUE_GAP", "ASIAN", -100),
  t("FAIR_VALUE_GAP", "ASIAN", -100),
  t("FAIR_VALUE_GAP", "ASIAN", 90),
  t("ORDER_BLOCK", "LONDON", 300),
  t("ORDER_BLOCK", "NEW_YORK", -100),
  t("ORDER_BLOCK", "NEW_YORK", 150),
];

describe("celulele reconstituie exact filtrarea directă", () => {
  const celule = construiesteCrossTab(ESANTION);

  it.each([
    ["fără filtru", undefined, undefined],
    ["un setup", ["FAIR_VALUE_GAP"], undefined],
    ["o sesiune", undefined, ["LONDON"]],
    ["setup × sesiune", ["FAIR_VALUE_GAP"], ["ASIAN"]],
    ["mai multe setup-uri", ["FAIR_VALUE_GAP", "ORDER_BLOCK"], undefined],
    ["mai multe sesiuni", undefined, ["LONDON", "NEW_YORK"]],
    ["combinație fără date", ["ORDER_BLOCK"], ["ASIAN"]],
  ])("%s", (_nume, setupuri, sesiuni) => {
    const prin = agregaCelule(celule, { setupuri, sesiuni });
    const ref = directa(ESANTION, setupuri, sesiuni);

    expect(prin.tranzactii).toBe(ref.tranzactii);
    expect(prin.castiguri).toBe(ref.castiguri);
    expect(prin.net).toBeCloseTo(ref.net, 6);
    if (ref.winRate == null) expect(prin.winRate).toBeNull();
    else expect(prin.winRate!).toBeCloseTo(ref.winRate, 6);
  });

  it("găsește contrastul care e tot rostul funcției", () => {
    // FVG pe total: 3 din 6 = 50%. Împărțit pe sesiuni: 67% și 33%. Cifra pe o
    // singură dimensiune ascunde exact diferența pe care o cauți.
    const total = agregaCelule(celule, { setupuri: ["FAIR_VALUE_GAP"] });
    const london = agregaCelule(celule, { setupuri: ["FAIR_VALUE_GAP"], sesiuni: ["LONDON"] });
    const asia = agregaCelule(celule, { setupuri: ["FAIR_VALUE_GAP"], sesiuni: ["ASIAN"] });

    expect(total.winRate).toBeCloseTo(50, 6);
    expect(london.winRate).toBeCloseTo(66.667, 2);
    expect(asia.winRate).toBeCloseTo(33.333, 2);
    expect(london.tranzactii + asia.tranzactii).toBe(total.tranzactii);
  });
});

describe("ce se lasă deoparte", () => {
  it("ignoră tranzacțiile fără setup sau fără sesiune", () => {
    // Puse la „altele", ar umfla totalurile și procentele n-ar mai da aceleași
    // cifre ca restul paginii.
    const celule = construiesteCrossTab([
      t("FAIR_VALUE_GAP", "LONDON", 100),
      t(null, "LONDON", 500),
      t("FAIR_VALUE_GAP", null, 500),
      t(null, null, 500),
    ]);
    const a = agregaCelule(celule);
    expect(a.tranzactii).toBe(1);
    expect(a.net).toBe(100);
  });

  it("ignoră tranzacțiile fără P&L (încă deschise)", () => {
    const celule = construiesteCrossTab([
      t("BOS", "LONDON", 100),
      t("BOS", "LONDON", null),
    ]);
    expect(agregaCelule(celule).tranzactii).toBe(1);
  });

  it("R-ul se calculează DOAR unde există riscul înregistrat", () => {
    // Importurile de la broker adesea n-au riscul. A presupune unul ar produce
    // o expectanță inventată — mai rău decât una absentă.
    const celule = construiesteCrossTab([
      t("BOS", "LONDON", 200, 100), // +2R
      t("BOS", "LONDON", -100, 100), // −1R
      t("BOS", "LONDON", 900, null), // fără risc: nu intră în medie
      t("BOS", "LONDON", 500, 0), // risc zero: la fel
    ]);
    const a = agregaCelule(celule);
    expect(a.tranzactii).toBe(4);
    expect(a.expectancyR).toBeCloseTo(0.5, 6); // (2 − 1) / 2
  });

  it("nu inventează un profit factor infinit", () => {
    const celule = construiesteCrossTab([t("BOS", "LONDON", 100)]);
    // Fără nicio pierdere, raportul e infinit. „—" spune adevărul; „999" nu.
    expect(agregaCelule(celule).profitFactor).toBeNull();
  });

  it("o combinație fără date întoarce zero, nu NaN", () => {
    const celule = construiesteCrossTab([t("BOS", "LONDON", 100)]);
    const gol = agregaCelule(celule, { setupuri: ["CHOCH"] });
    expect(gol.tranzactii).toBe(0);
    expect(gol.winRate).toBeNull();
    expect(gol.expectancyR).toBeNull();
    expect(gol.net).toBe(0);
    expect(Number.isNaN(gol.net)).toBe(false);
  });
});

describe("eșantionul mic e marcat", () => {
  it("sub prag e mic, de la prag în sus nu", () => {
    expect(esantionMic(PRAG_ESANTION - 1)).toBe(true);
    expect(esantionMic(PRAG_ESANTION)).toBe(false);
  });

  it("celula goală nu e „eșantion mic”, e goală", () => {
    // Altfel ar primi avertismentul de precizie o celulă care n-are ce spune.
    expect(esantionMic(0)).toBe(false);
  });
});
