import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingExperience } from "@/components/landing/landing-experience";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

export default function LandingPage() {
  return <LandingExperience />;
}
