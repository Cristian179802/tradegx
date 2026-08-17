import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ToolsClient } from "./tools-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageTitles");
  return { title: t("tools") };
}

export default async function ToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <ToolsClient />;
}
