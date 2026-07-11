import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaywallCard } from "@/components/billing/paywall-card";
import { TaxReportClient } from "./tax-report-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("taxReport");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

interface Props { searchParams: Promise<{ year?: string }> }

export default async function TaxReportPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("taxReport");

  const isPro = session.user.plan === "PRO" || session.user.isTrialing;
  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <PaywallCard feature={t("navTitle")} description={t("paywallDesc")} bullets={[t("pw1"), t("pw2"), t("pw3"), t("pw4")]} />
      </div>
    );
  }

  const { getTaxReportData } = await import("@/lib/tax-report-data");
  const { year: yearParam } = await searchParams;
  const data = await getTaxReportData(session.user.id, yearParam);

  return <TaxReportClient data={data} />;
}
