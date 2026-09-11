import { PrismaClient } from "@prisma/client";

// ── Rolul contului demo ──────────────────────────────────────────────────────
//
// Contul demo are `role: DEMO`, iar middleware-ul refuză orice cerere care nu e
// GET pe /api/. Corect: credențialele lui sunt publice, oricine se poate loga.
//
// Filmarea are nevoie să scrie o dată — închide o tranzacție prin fluxul real —
// deci rolul se ridică pe durata capturii și se pune la loc după. Flip-ul e
// făcut de `video/film.sh`, care îl restaurează și dacă filmarea crapă.
//
// ── De ce refuză să ruleze pe altă gazdă decât localhost ──
//
// Fiindcă exact asta era gata să se întâmple: filmam pe baza de PRODUCȚIE fără
// să-mi dau seama — `apps/web/.env` are DATABASE_URL-ul de Supabase, cu 6
// utilizatori reali și 387 de tranzacții. Un flip de rol acolo ar fi deschis,
// pentru zeci de secunde, scrierea pe un cont cu parolă publică, pe un produs cu
// clienți plătitori.
//
// Poarta de mai jos face greșeala aia imposibilă, nu improbabilă. Dacă cineva
// pornește vreodată pipeline-ul cu alt DATABASE_URL, scriptul se oprește.

const GAZDE_PERMISE = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function gazdaBazei(): string {
  const u = process.env.DATABASE_URL;
  if (!u) throw new Error("DATABASE_URL nu e setat.");
  const fara = u.replace(/^[a-z]+:\/\/[^@]*@/, "");
  return fara.replace(/[/?].*$/, "").replace(/:\d+$/, "");
}

function pretindeLocal(): void {
  const g = gazdaBazei();
  if (!GAZDE_PERMISE.has(g)) {
    console.error(
      `\n  REFUZ. Scriptul ăsta schimbă rolul contului demo și rulează DOAR pe o\n` +
      `  bază locală. DATABASE_URL arată spre „${g}”.\n\n` +
      `  Dacă aia e baza de producție, un rol ridicat acolo înseamnă scriere\n` +
      `  deschisă pe un cont cu parolă publică. Nu se întâmplă din greșeală.\n`
    );
    process.exit(1);
  }
}

const DEMO_EMAIL = "demo@tradegx.com";

async function main() {
  pretindeLocal();

  const comanda = process.argv[2];
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true, role: true },
    });
    if (!user) throw new Error(`${DEMO_EMAIL} nu există în baza asta.`);

    if (comanda === "arata") {
      // Doar rolul, pe stdout curat: `film.sh` îl citește ca să știe ce
      // restaurează. Orice altceva merge pe stderr.
      process.stdout.write(user.role + "\n");
      return;
    }

    if (comanda === "seteaza") {
      const rol = process.argv[3];
      if (rol !== "DEMO" && rol !== "USER") {
        throw new Error(`rol necunoscut „${rol}”. Doar DEMO sau USER.`);
      }
      if (user.role === rol) {
        console.error(`  rolul e deja ${rol}`);
        return;
      }
      await prisma.user.update({ where: { id: user.id }, data: { role: rol } });
      console.error(`  rol: ${user.role} → ${rol}`);
      return;
    }

    throw new Error("folosire: rol-demo.ts arata | seteaza <DEMO|USER>");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n  EROARE:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
