import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { getAccountScope } from "@/lib/account-scope";
import { prisma } from "@/lib/prisma";

// ── Raportul de performanță, ca date ─────────────────────────────────────────
//
// Pagina web (`/report`) e o componentă de server care calculează totul și
// randează o foaie pentru tipărit. Aplicația nu poate ajunge la ea, iar PDF-ul
// se face acolo cu dialogul de print al browserului — ceva ce pe telefon nu
// există.
//
// Deci aici sunt CIFRELE, calculate exact la fel, iar aplicația le pune într-o
// foaie și o transformă în PDF pe telefon. Împărțirea e aceeași ca peste tot în
// proiect: serverul socotește, aplicația desenează.
//
// Etichetele de instrument și de setup vin traduse de aici, ca să nu existe un
// al doilea dicționar în aplicație care să se depărteze de primul.

export const dynamic = "force-dynamic";

const SETUP_LABEL: Record<string, string> = {
  ORDER_BLOCK: "Order Block", FAIR_VALUE_GAP: "Fair Value Gap", LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure", CHOCH: "Change of Character", BREAKER: "Breaker",
  MITIGATION: "Mitigation", REJECTION: "Rejection", TREND_FOLLOW: "Trend Follow",
  SCALP: "Scalp",
};

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const t = await getTranslations({ locale: "ro", namespace: "reportPage" });
  const INSTRUMENT_LABEL: Record<string, string> = {
    FOREX: t("instrForex"), CRYPTO: t("instrCrypto"), METALS: t("instrMetals"),
    INDICES: t("instrIndices"), COMMODITIES: t("instrCommodities"),
    STOCKS: t("instrStocks"), CFD: t("instrCfd"),
  };

  const scope = await getAccountScope(userId);

  const [conturi, tranzactii] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { currency: true, initialBalance: true, balance: true },
    }),
    prisma.trade.findMany({
      where: { ...scope.where, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      select: {
        symbol: true, instrumentType: true, setupType: true,
        pnlMoney: true, riskMoney: true, entryTime: true, exitTime: true,
      },
      orderBy: { entryTime: "asc" },
    }),
  ]);

  const moneda = conturi[0]?.currency ?? "USD";
  const soldInitial = conturi.reduce((s, a) => s + Number(a.initialBalance), 0);
  const soldCurent = conturi.reduce((s, a) => s + Number(a.balance), 0);
  const cand = (x: { exitTime: Date | null; entryTime: Date }) => x.exitTime ?? x.entryTime;

  const valori = tranzactii.map((x) => Number(x.pnlMoney ?? 0));
  const castiguri = valori.filter((p) => p > 0);
  const pierderi = valori.filter((p) => p < 0);
  const profitBrut = castiguri.reduce((s, p) => s + p, 0);
  const pierdereBruta = Math.abs(pierderi.reduce((s, p) => s + p, 0));

  const cuRisc = tranzactii.filter(
    (x) => x.riskMoney && Number(x.riskMoney) > 0 && Number(x.pnlMoney ?? 0) > 0,
  );

  let varf = soldInitial;
  let sold = soldInitial;
  let drawdown = 0;
  for (const x of tranzactii) {
    sold += Number(x.pnlMoney ?? 0);
    if (sold > varf) varf = sold;
    const dd = varf > 0 ? ((varf - sold) / varf) * 100 : 0;
    if (dd > drawdown) drawdown = dd;
  }

  const peLuna = new Map<string, { pnl: number; trades: number }>();
  for (const x of tranzactii) {
    const k = new Date(cand(x)).toISOString().slice(0, 7);
    const e = peLuna.get(k) ?? { pnl: 0, trades: 0 };
    e.pnl += Number(x.pnlMoney ?? 0);
    e.trades++;
    peLuna.set(k, e);
  }

  const grupeaza = (
    cheie: (x: (typeof tranzactii)[number]) => string | null,
    eticheta: (k: string) => string,
  ) => {
    const m = new Map<string, { wins: number; total: number; pnl: number }>();
    for (const x of tranzactii) {
      const k = cheie(x);
      if (!k) continue;
      const e = m.get(k) ?? { wins: 0, total: 0, pnl: 0 };
      e.total++;
      const p = Number(x.pnlMoney ?? 0);
      e.pnl += p;
      if (p > 0) e.wins++;
      m.set(k, e);
    }
    return [...m.entries()]
      .map(([k, v]) => ({
        label: eticheta(k),
        winRate: +((v.wins / v.total) * 100).toFixed(1),
        total: v.total,
        pnl: +v.pnl.toFixed(2),
      }))
      .sort((a, b) => b.pnl - a.pnl);
  };

  return NextResponse.json({
    currency: moneda,
    generatedAt: new Date().toISOString(),
    initialBalance: +soldInitial.toFixed(2),
    finalBalance: +soldCurent.toFixed(2),
    empty: tranzactii.length === 0,
    summary: {
      totalTrades: tranzactii.length,
      wins: castiguri.length,
      losses: pierderi.length,
      winRate: tranzactii.length > 0 ? +((castiguri.length / tranzactii.length) * 100).toFixed(1) : 0,
      totalPnl: +valori.reduce((s, p) => s + p, 0).toFixed(2),
      grossProfit: +profitBrut.toFixed(2),
      grossLoss: +pierdereBruta.toFixed(2),
      profitFactor: pierdereBruta > 0 ? +(profitBrut / pierdereBruta).toFixed(2) : null,
      avgWin: castiguri.length > 0 ? +(profitBrut / castiguri.length).toFixed(2) : 0,
      avgLoss: pierderi.length > 0 ? +(pierdereBruta / pierderi.length).toFixed(2) : 0,
      bestTrade: valori.length > 0 ? +Math.max(...valori).toFixed(2) : 0,
      worstTrade: valori.length > 0 ? +Math.min(...valori).toFixed(2) : 0,
      avgRR:
        cuRisc.length > 0
          ? +(
              cuRisc.reduce(
                (s, x) => s + Math.abs(Number(x.pnlMoney!) / Number(x.riskMoney!)),
                0,
              ) / cuRisc.length
            ).toFixed(2)
          : 0,
      maxDrawdown: +drawdown.toFixed(2),
    },
    monthly: [...peLuna.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, pnl: +v.pnl.toFixed(2), trades: v.trades })),
    byInstrument: grupeaza((x) => x.instrumentType, (k) => INSTRUMENT_LABEL[k] ?? k),
    bySetup: grupeaza(
      (x) => x.setupType,
      (k) => (k === "OTHER" ? t("setupOther") : (SETUP_LABEL[k] ?? k)),
    ),
  });
}
