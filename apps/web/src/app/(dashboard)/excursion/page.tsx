import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaywallCard } from "@/components/billing/paywall-card";
import { ExcursionClient } from "./excursion-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("excursion");
  return { title: t("metaTitle") };
}

export default async function ExcursionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("excursion");

  const isPro = session.user.plan === "PRO" || session.user.isTrialing;
  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <PaywallCard feature={t("title")} description={t("paywallDesc")} bullets={[t("pw1"), t("pw2"), t("pw3"), t("pw4")]} />
      </div>
    );
  }

  const { getRAnalysis } = await import("@/lib/r-analysis");
  const rData = await getRAnalysis(session.user.id);

  return <ExcursionClient rData={rData} />;
}
