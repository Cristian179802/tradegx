import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

// ── Roadmap, ca date ─────────────────────────────────────────────────────────
//
// Listele de mai jos sunt ACELEAȘI ca în pagina web (`/roadmap`) și reflectă ce
// e în cod, nu ce ne-am propus. Textele vin din același dicționar, deci o
// corectură ajunge și pe site, și în aplicație — copiate în aplicație, ar fi
// rămas în urmă exact la prima livrare nouă.
//
// Nu cere autentificare: cineva care tocmai a instalat aplicația trebuie să
// poată vedea încotro merge produsul înainte să-și facă un cont. Intră în
// `publicPrefixes` din middleware.

export const dynamic = "force-dynamic";

const LIVRATE = ["sh1","sh2","sh3","sh4","sh5","sh6","sh7","sh8","sh9","sh10","sh11","sh12","sh13","sh14","sh15","sh16","sh17","sh18","sh19","sh20","sh21","sh22","sh23","sh24","sh25","sh26"];
const IN_LUCRU = ["ip2"];
const PLANIFICATE = ["pl8","pl17","pl15","pl10","pl11","pl12","pl14","pl13","pl3","pl4","pl1","pl5","pl16","pl7"];
const VIZIUNE = ["vs25","vs2","vs3","vs15","vs10","vs11","vs12","vs4","vs5","vs6","vs13","vs7","vs8","vs9"];

export async function GET(req: Request) {
  const limba = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "ro";
  const t = await getTranslations({ locale: limba, namespace: "roadmap" });

  return NextResponse.json({
    titlu: t("title"),
    actualizat: t("updated"),
    // `intro` conține un link către contact în varianta web; aici îl scoatem,
    // fiindcă în aplicație contactul e alt ecran, nu o ancoră în text.
    intro: t("intro").replace(/<\/?contact>/g, ""),
    sectiuni: [
      { id: "livrate", titlu: t("shippedH"), stare: "gata", elemente: LIVRATE.map((k) => t(k)) },
      { id: "inLucru", titlu: t("progressH"), stare: "lucru", elemente: IN_LUCRU.map((k) => t(k)) },
      { id: "planificate", titlu: t("plannedH"), stare: "planificat", elemente: PLANIFICATE.map((k) => t(k)) },
      { id: "viziune", titlu: t("visionH"), stare: "viziune", nota: t("visionIntro"), elemente: VIZIUNE.map((k) => t(k)) },
    ],
  });
}
