import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaywallCard } from "@/components/billing/paywall-card";
import { InstitutionalClient } from "./institutional-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("institutional");
  return { title: t("metaTitle") };
}

export default async function InstitutionalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("institutional");

  const isPro = session.user.plan === "PRO" || session.user.isTrialing;
  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <PaywallCard feature={t("title")} description={t("paywallDesc")} bullets={[t("pw1"), t("pw2"), t("pw3"), t("pw4")]} />
      </div>
    );
  }

  const { getInstitutionalData } = await import("@/lib/institutional");
  const data = await getInstitutionalData(session.user.id);

  return <InstitutionalClient data={data} />;
}
