import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ── Utilizatorul pentru baza de filmare ──────────────────────────────────────
//
// `seed-demo-account.ts` populează tranzacții, dar refuză să creeze conturi de
// utilizator — deliberat, ca să nu poată inventa conturi în producție. Baza
// locală de filmare pornește goală, deci utilizatorul trebuie creat o dată.
//
// Parola e chiar cea publică din `demo-bubble.tsx`: e afișată pe site tuturor
// vizitatorilor, deci nu e un secret și n-are rost tratată ca atare. Rolul
// pornește DEMO, exact ca în producție — flip-ul de pe durata filmării trebuie
// să fie aceeași operație în ambele locuri, altfel pipeline-ul nu mai e același.

const GAZDE_PERMISE = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function gazdaBazei(): string {
  const u = process.env.DATABASE_URL;
  if (!u) throw new Error("DATABASE_URL nu e setat.");
  return u.replace(/^[a-z]+:\/\/[^@]*@/, "").replace(/[/?].*$/, "").replace(/:\d+$/, "");
}

const DEMO_EMAIL = "demo@tradegx.com";
const DEMO_PAROLA = "DemoTrader2026!";

/**
 * Abonament PRO, fără Stripe.
 *
 * Contul demo din producție e PRO. Pe baza locală, proaspătă, pornea FREE — iar
 * asta se vedea în cadru: o bandă galbenă peste tot ecranul, „Ești pe planul
 * Standard — semnalele AI, Edge Finder și sincronizarea broker sunt în PRO”. Un
 * îndemn la upgrade în mijlocul propriului material de marketing.
 *
 * Nu se atinge Stripe: abonamentul e scris direct, cu identificatorii de plată
 * lăsați goi. Baza asta e locală și aruncabilă, nu facturează pe nimeni.
 */
async function asiguraAbonament(prisma: PrismaClient, userId: string) {
  const anViitor = new Date();
  anViitor.setFullYear(anViitor.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { userId },
    update: { plan: "PRO", status: "ACTIVE", currentPeriodEnd: anViitor },
    create: {
      userId,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: anViitor,
    },
  });
  console.log("  abonament: PRO activ (ca în producție, fără Stripe)");
}

async function main() {
  const g = gazdaBazei();
  if (!GAZDE_PERMISE.has(g)) {
    console.error(`\n  REFUZ: scriptul creează un utilizator și rulează doar local. Gazda e „${g}”.\n`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existent = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true, role: true },
    });

    if (existent) {
      console.log(`  ${DEMO_EMAIL} există deja (rol ${existent.role})`);
      await asiguraAbonament(prisma, existent.id);
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: "Alex",
        password: await bcrypt.hash(DEMO_PAROLA, 12),
        emailVerified: new Date(),
        role: "DEMO",
        language: "RO",
        currency: "USD",
      },
      select: { id: true },
    });
    console.log(`  ${DEMO_EMAIL} creat (rol DEMO) — ${user.id}`);
    await asiguraAbonament(prisma, user.id);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n  EROARE:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
