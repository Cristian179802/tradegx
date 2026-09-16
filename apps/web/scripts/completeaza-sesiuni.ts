import { PrismaClient } from "@prisma/client";
import { sesiuneaTranzactiei } from "@tradegx/core";

// ── Completează sesiunea pentru tranzacțiile vechi ───────────────────────────
//
// Reparația din cod prinde tranzacțiile NOI. Cele deja scrise rămân cu
// `sessionType: null`, iar `cross-tab.ts` sare peste ele — deci nu apar în
// matricea Setup × Sesiune oricât de bine ar fi etichetate în rest.
//
// Scriptul deduce sesiunea la fel ca aplicația: din killzone dacă există, altfel
// din ora de intrare. Atinge DOAR rândurile unde `sessionType` e null; nu
// suprascrie niciodată o valoare pusă de om.
//
//   npx tsx scripts/completeaza-sesiuni.ts          → doar raportează
//   npx tsx scripts/completeaza-sesiuni.ts --scrie  → scrie
//
// Implicit nu scrie nimic. Un script care modifică date și pornește direct e un
// script pe care într-o zi îl rulezi din greșeală pe baza greșită.

const prisma = new PrismaClient();

async function main() {
  const scrie = process.argv.includes("--scrie");

  const gazda = (process.env.DATABASE_URL ?? "")
    .replace(/^[a-z]+:\/\/[^@]*@/, "")
    .replace(/[/?].*$/, "");
  console.log(`  baza: ${gazda || "(necunoscută)"}`);
  console.log(`  mod:  ${scrie ? "SCRIU" : "doar raportez (adaugă --scrie ca să modifice)"}\n`);

  const faraSesiune = await prisma.trade.findMany({
    where: { sessionType: null },
    select: { id: true, killzone: true, entryTime: true, setupType: true },
  });

  if (faraSesiune.length === 0) {
    console.log("  Nicio tranzacție fără sesiune. Nimic de făcut.");
    return;
  }

  const peSesiune = new Map<string, number>();
  const actualizari: { id: string; sessionType: "ASIAN" | "LONDON" | "NEW_YORK" | "OVERLAP" }[] = [];
  let cuSetup = 0;

  for (const t of faraSesiune) {
    const s = sesiuneaTranzactiei({ killzone: t.killzone, entryTime: t.entryTime });
    if (!s) continue;
    actualizari.push({ id: t.id, sessionType: s });
    peSesiune.set(s, (peSesiune.get(s) ?? 0) + 1);
    if (t.setupType) cuSetup++;
  }

  console.log(`  tranzacții fără sesiune:        ${faraSesiune.length}`);
  console.log(`  dintre ele, se poate deduce:    ${actualizari.length}`);
  console.log(`  au și setup (apar în matrice):  ${cuSetup}\n`);
  for (const [s, n] of [...peSesiune].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${s.padEnd(10)} ${n}`);
  }

  if (!scrie) {
    console.log("\n  Nimic scris. Rulează cu --scrie dacă asta e ce vrei.");
    return;
  }

  // În loturi: un `updateMany` per sesiune, nu 111 actualizări separate.
  console.log("");
  for (const [s, n] of peSesiune) {
    const ids = actualizari.filter((a) => a.sessionType === s).map((a) => a.id);
    await prisma.trade.updateMany({
      where: { id: { in: ids } },
      data: { sessionType: s as never },
    });
    console.log(`    ${s.padEnd(10)} ${n} actualizate`);
  }
  console.log("\n  Gata.");
}

main()
  .catch((e) => {
    console.error("\n  EROARE:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
