import { PrismaClient } from "@prisma/client";
import { pipValue, perecheDeConversie, stopPips, clasificaSimbol } from "@tradegx/core";

// ── Recalculează riscul stocat pe tranzacțiile vechi ─────────────────────────
//
// DE CE. Valoarea unui pip depinde de moneda în care e COTAT instrumentul.
// Codul vechi înmulțea `pip × contractSize` și trata rezultatul ca fiind în
// moneda contului. Pentru EURUSD pe un cont în dolari asta nimerea din
// întâmplare; pentru USDJPY raporta ~150 de ori mai mult decât riscul real.
//
// Fix-ul din cod repară tranzacțiile NOI. Cele deja scrise rămân cu cifra
// greșită — și exact alea se văd în istoric, în statistici și în R-multipli.
//
//   npx tsx scripts/recalculeaza-risc.ts            → arată ce s-ar schimba
//   npx tsx scripts/recalculeaza-risc.ts --scrie    → scrie
//   npx tsx scripts/recalculeaza-risc.ts --scrie --doar-jpy
//
// Implicit NU scrie nimic. Se rulează o dată uscat, se citește raportul, apoi
// se scrie — nu invers.
//
// CURSURILE. Pentru perechi încrucișate (EURGBP pe un cont în dolari) e nevoie
// de un curs pe care nu-l avem din ziua tranzacției. Folosim cursul de AZI și
// o spunem: eroarea rămasă e de câteva procente, față de ~27% cât era înainte.
//
// ── CE NU ATINGE, DELIBERAT ─────────────────────────────────────────────────
//
// 1. INDICI, CRIPTO, METALE, MĂRFURI. Mărimea contractului la astea o decide
//    BROKERUL, nu un standard. Datele existente presupun 10 $ pe punct; valorile
//    implicite din `@tradegx/core` presupun altceva. Amândouă sunt presupuneri,
//    deci a rescrie una cu cealaltă nu repară nimic — doar schimbă cine a
//    ghicit. Se raportează și se lasă în pace, până spune brokerul cât e.
//
// 2. TRANZACȚII FĂRĂ STOP. Unele au `stopLoss = 0` (import MetaAPI care scrie
//    zero în loc de null). Fără stop nu există risc definit, iar zero tratat ca
//    preț ar da o distanță egală cu tot prețul — pe EURUSD, un „risc" de 35.000 $
//    la o poziție de 0,3 loturi. Se sar.
//
// Perechile valutare sunt altceva: acolo 100.000 de unități pe lot e standard
// de piață, nu convenție de broker. Exact acolo era și defectul.

const prisma = new PrismaClient();

const scrie = process.argv.includes("--scrie");
const doarJpy = process.argv.includes("--doar-jpy");

/** Cursuri cerute o singură dată per pereche, ținute cât ține rularea. */
const cursuri: Record<string, number> = {};

async function iaCurs(pereche: string): Promise<number | null> {
  if (pereche in cursuri) return cursuri[pereche]!;
  try {
    const { fetchSpotPrice } = await import("@/lib/price-feed");
    const p = await fetchSpotPrice(pereche);
    if (p != null && p > 0) {
      cursuri[pereche] = p;
      return p;
    }
  } catch {
    // fără preț: tranzacția rămâne neatinsă, nu ghicim
  }
  return null;
}

function procent(vechi: number | null, nou: number | null): string {
  if (vechi == null || nou == null || vechi === 0) return "—";
  return `${(((nou - vechi) / vechi) * 100).toFixed(0)}%`;
}

async function main() {
  const tranzactii = await prisma.trade.findMany({
    where: { stopLoss: { not: null }, riskMoney: { not: null } },
    select: {
      id: true,
      symbol: true,
      entryPrice: true,
      stopLoss: true,
      lotSize: true,
      riskMoney: true,
      riskPercent: true,
      account: { select: { currency: true, balance: true } },
    },
  });

  console.log(`  tranzacții cu risc stocat: ${tranzactii.length}\n`);

  const schimbari: {
    id: string; symbol: string; vechi: number; nou: number; pctCont: number | null;
  }[] = [];
  let neatinse = 0;
  let faraCurs = 0;
  let altInstrument = 0;
  let faraStop = 0;

  for (const t of tranzactii) {
    const simbol = t.symbol.toUpperCase();
    if (doarJpy && !simbol.includes("JPY")) continue;

    // Doar perechi valutare — vezi antetul.
    if (clasificaSimbol(simbol) !== "FOREX") { altInstrument++; continue; }

    const moneda = t.account.currency ?? "USD";
    const entry = Number(t.entryPrice);
    const sl = Number(t.stopLoss);
    const loturi = Number(t.lotSize);

    // Fără stop nu există risc de calculat.
    if (!(sl > 0) || !(entry > 0) || !(loturi > 0)) { faraStop++; continue; }

    // Cursul de conversie, doar dacă perechea chiar are nevoie de el.
    const conv = perecheDeConversie(simbol, moneda);
    if (conv) {
      const c = await iaCurs(conv);
      if (c == null) { faraCurs++; continue; }
    }

    const vp = pipValue({ symbol: simbol, price: entry, accountCurrency: moneda, rates: cursuri });
    if (vp == null) { faraCurs++; continue; }

    const nou = +(stopPips(entry, sl, simbol) * vp * loturi).toFixed(2);
    const vechi = Number(t.riskMoney);

    // Sub un procent diferență nu merită scrisă o linie în baza de date.
    if (vechi > 0 && Math.abs(nou - vechi) / vechi < 0.01) { neatinse++; continue; }

    const sold = Number(t.account.balance);
    schimbari.push({
      id: t.id,
      symbol: simbol,
      vechi,
      nou,
      pctCont: sold > 0 ? +((nou / sold) * 100).toFixed(2) : null,
    });
  }

  // ── Raportul ───────────────────────────────────────────────────────────────
  const peSimbol: Record<string, { n: number; vechi: number; nou: number }> = {};
  for (const s of schimbari) {
    peSimbol[s.symbol] ??= { n: 0, vechi: 0, nou: 0 };
    peSimbol[s.symbol]!.n++;
    peSimbol[s.symbol]!.vechi += s.vechi;
    peSimbol[s.symbol]!.nou += s.nou;
  }

  console.log(`  de schimbat      : ${schimbari.length}`);
  console.log(`  deja corecte     : ${neatinse}`);
  console.log(`  fără stop        : ${faraStop}  (nu au risc definit)`);
  console.log(`  alt instrument   : ${altInstrument}  (indici/cripto/metale — contractul e al brokerului)`);
  console.log(`  fără curs        : ${faraCurs}  (rămân neatinse)\n`);

  if (Object.keys(peSimbol).length > 0) {
    console.log("  simbol      n   risc vechi (total)   risc nou (total)   diferență");
    console.log("  ─────────────────────────────────────────────────────────────────");
    for (const [sim, v] of Object.entries(peSimbol).sort((a, b) => b[1].n - a[1].n)) {
      console.log(
        `  ${sim.padEnd(10)} ${String(v.n).padStart(3)}   ` +
        `${v.vechi.toFixed(2).padStart(16)}   ${v.nou.toFixed(2).padStart(16)}   ` +
        `${procent(v.vechi, v.nou).padStart(8)}`,
      );
    }
    console.log();

    console.log("  primele cinci, una câte una:");
    for (const s of schimbari.slice(0, 5)) {
      console.log(`    ${s.symbol.padEnd(9)} ${s.vechi.toFixed(2).padStart(12)} → ${s.nou.toFixed(2).padStart(10)}` +
        (s.pctCont != null ? `  (${s.pctCont}% din cont)` : ""));
    }
    console.log();
  }

  if (!scrie) {
    console.log("  Nimic scris. Adaugă --scrie ca să aplici.\n");
    return;
  }

  // Plasa de siguranță: valorile vechi se scriu pe disc ÎNAINTE de prima
  // modificare. O migrare de date fără cale de întoarcere e o migrare pe care
  // n-ai voie s-o rulezi — indiferent cât de sigur ești pe calcul.
  const { writeFileSync } = await import("node:fs");
  const inapoi = `risc-inainte-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.json`;
  writeFileSync(
    inapoi,
    JSON.stringify(
      schimbari.map((s) => {
        const t = tranzactii.find((x) => x.id === s.id)!;
        return {
          id: s.id,
          symbol: s.symbol,
          riskMoney: t.riskMoney == null ? null : Number(t.riskMoney),
          riskPercent: t.riskPercent == null ? null : Number(t.riskPercent),
        };
      }),
      null,
      2,
    ),
    "utf8",
  );
  console.log(`  valorile vechi salvate în ${inapoi}\n`);

  let scrise = 0;
  for (const s of schimbari) {
    const t = tranzactii.find((x) => x.id === s.id)!;
    const sold = Number(t.account.balance);
    await prisma.trade.update({
      where: { id: s.id },
      data: {
        riskMoney: s.nou,
        riskPercent: sold > 0 ? +((s.nou / sold) * 100).toFixed(2) : null,
      },
    });
    scrise++;
    if (scrise % 25 === 0) process.stdout.write(`    ${scrise}/${schimbari.length}\r`);
  }
  console.log(`\n  ${scrise} tranzacții actualizate.\n`);
}

main()
  .catch((e) => {
    console.error("\n  EROARE:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
