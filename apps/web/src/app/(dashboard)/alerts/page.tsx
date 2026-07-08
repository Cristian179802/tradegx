import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertsClient, type AlertSettings } from "./alerts-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("alertsPage");
  return { title: t("title") };
}

const DEFAULT_SETTINGS: AlertSettings = {
  OVERTRADING: true,
  REVENGE_TRADING: true,
  RISK_EXCEEDED: true,
  DAILY_LOSS_LIMIT: true,
  FOMO: false,
  STREAK_ALERT: true,
  NEWS_IMPACT: true,
  DRAWDOWN_ALERT: true,
};

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch recent alerts for this user
  const rawAlerts = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      severity: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });

  const alerts = rawAlerts.map((a) => ({
    id: a.id,
    type: a.type,
    severity: a.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    title: a.title,
    message: a.message,
    isRead: a.isRead,
    createdAt: new Date(a.createdAt).toISOString(),
  }));

  // Try to load saved notification preferences from user settings
  // For now, use defaults (Phase 2 will add a NotificationSettings model)
  const settings: AlertSettings = { ...DEFAULT_SETTINGS };

  return <AlertsClient alerts={alerts} settings={settings} />;
}
