import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingExperience } from "@/components/landing/landing-experience";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  // `absolute` ocolește șablonul global `"%s — TradeGx"`. Pagina de start își
  // poartă deja numele în titlu, iar prin șablon devenea „TradeGx — Jurnal de
  // Trading Profesional — TradeGx" — pe cea mai importantă pagină pentru căutări.
  return { title: { absolute: t("metaTitle") }, description: t("metaDesc") };
}

export default function LandingPage() {
  return <LandingExperience />;
}
