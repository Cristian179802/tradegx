import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { getGamification } from "@/lib/gamification";

// GET /api/gamification — streak + realizări (gratuit pentru toți: motivează
// jurnalizarea, care e inima produsului pe orice plan).
//
// `?lang=en` — titlurile și descrierile în engleză. `getGamification` le
// produce în română; site-ul le traduce în pagină, după id, din cheile
// `achievements.sv.<id>` din `messages/en.json`. Aplicația de telefon n-are
// acces la dicționarul ăla, așa că le traducem aici, DIN ACELEAȘI CHEI — nu
// dintr-o a treia copie, care s-ar dezlipi la prima realizare nouă.
//
// O realizare fără cheie de traducere rămâne în română, exact ca pe site.
export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const data = await getGamification(userId);

  const limba = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "ro";
  if (limba === "ro") return NextResponse.json(data);

  const t = await getTranslations({ locale: limba, namespace: "achievements" });
  return NextResponse.json({
    ...data,
    achievements: data.achievements.map((a) =>
      t.has(`sv.${a.id}.title`)
        ? { ...a, title: t(`sv.${a.id}.title`), description: t(`sv.${a.id}.description`) }
        : a,
    ),
  });
}
