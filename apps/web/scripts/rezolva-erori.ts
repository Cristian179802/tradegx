import { PrismaClient } from "@prisma/client";

// ── Marchează erori ca rezolvate ─────────────────────────────────────────────
//
// Jurnalul de erori ține fiecare defect până cineva spune explicit că s-a
// reparat. Nu se șterge nimic: rămâne `resolvedAt`, ca să se vadă cât a trăit
// problema și dacă se întoarce.
//
//   npx tsx scripts/rezolva-erori.ts                    → arată ce e deschis
//   npx tsx scripts/rezolva-erori.ts --toate --scrie    → le marchează
//
// Implicit nu scrie. O eroare marcată rezolvată din greșeală dispare din
// atenția tuturor, iar asta e mai rău decât una care mai stă o zi deschisă.

const prisma = new PrismaClient();

async function main() {
  const scrie = process.argv.includes("--scrie");
  const toate = process.argv.includes("--toate");

  const deschise = await prisma.errorLog.findMany({
    where: { resolvedAt: null },
    orderBy: { lastSeen: "desc" },
    select: { id: true, label: true, message: true, count: true, lastSeen: true },
  });

  if (deschise.length === 0) {
    console.log("  Nicio eroare deschisă.");
    return;
  }

  console.log(`  erori deschise: ${deschise.length}\n`);
  for (const e of deschise) {
    const zile = Math.round((Date.now() - e.lastSeen.getTime()) / 86400000);
    console.log(`    [${String(e.count).padStart(3)}x, acum ${zile}z]  ${e.label}`);
    console.log(`           ${e.message.slice(0, 100)}`);
  }

  if (!scrie || !toate) {
    console.log("\n  Nimic scris. Adaugă --toate --scrie ca să le marchezi rezolvate.");
    return;
  }

  const r = await prisma.errorLog.updateMany({
    where: { resolvedAt: null },
    data: { resolvedAt: new Date() },
  });
  console.log(`\n  ${r.count} marcate rezolvate.`);
}

main()
  .catch((e) => {
    console.error("\n  EROARE:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
