import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ForexNews } from "@/components/dashboard/forex-news";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("news");
  return { title: t("metaTitle") };
}

export default async function NewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("news");

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{t("title")}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {t("subtitle")}
        </p>
      </div>
      <ForexNews className="max-w-3xl" />
    </div>
  );
}
