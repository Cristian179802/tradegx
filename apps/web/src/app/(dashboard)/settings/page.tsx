import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileTab } from "./tabs/profile-tab";
import { TradingRulesTab } from "./tabs/trading-rules-tab";
import { AppearanceTab } from "./tabs/appearance-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { AccountsTab } from "./tabs/accounts-tab";
import { ApiKeysTab } from "./tabs/api-keys-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { BillingTab } from "./tabs/billing-tab";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.nav");
  return { title: t("metaTitle") };
}

const TABS = [
  { value: "profile", key: "profile" },
  { value: "trading-rules", key: "trading" },
  { value: "appearance", key: "appearance" },
  { value: "notifications", key: "notifications" },
  { value: "billing", key: "billing" },
  { value: "accounts", key: "accounts" },
  { value: "api-keys", key: "apiKeys" },
  { value: "privacy", key: "privacy" },
] as const;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("settings.nav");

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        language: true,
        currency: true,
        theme: true,
        timezone: true,
        maxTradesPerDay: true,
        defaultRiskPct: true,
        maxDailyLossPct: true,
        maxDrawdownPct: true,
        noTradeDays: true,
      },
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        trialEnd: true,
      },
    }),
  ]);

  const isTrialing = session.user.isTrialing ?? false;

  return (
    <div className="flex flex-col gap-6 pb-8 relative">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="orb orb-indigo absolute w-[500px] h-[500px] -top-40 -right-20 opacity-25" />
        <div className="orb orb-violet absolute w-[400px] h-[400px] bottom-20 -left-20 opacity-20" />
      </div>

      <div className="flex items-start justify-between gap-4 relative">
        <div>
          <h1 className="text-2xl font-black tracking-tight neon-indigo">{t("title")}</h1>
          <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{t("subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-5 relative">
        <TabsList className="bg-zinc-900/80 border border-zinc-800/80 p-1 h-auto flex-wrap gap-1 rounded-2xl backdrop-blur-sm">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 text-zinc-500 hover:text-zinc-300 text-sm rounded-xl px-3.5 py-1.5 transition-all font-medium"
            >
              {t(tab.key)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab initialName={user?.name ?? ""} />
        </TabsContent>
        <TabsContent value="trading-rules">
          <TradingRulesTab
            initialMaxDailyLossPct={user?.maxDailyLossPct ? Number(user.maxDailyLossPct) : 5}
            initialMaxDrawdownPct={user?.maxDrawdownPct ? Number(user.maxDrawdownPct) : 10}
            initialMaxTradesPerDay={user?.maxTradesPerDay ?? 5}
            initialDefaultRiskPct={user?.defaultRiskPct ? Number(user.defaultRiskPct) : 1}
            initialNoTradeDays={user?.noTradeDays ?? [5, 0]}
          />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceTab
            initialLanguage={user?.language ?? "RO"}
            initialCurrency={user?.currency ?? "USD"}
            initialTheme={user?.theme ?? "DARK"}
            initialTimezone={user?.timezone ?? "Europe/Bucharest"}
          />
        </TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="billing">
          <BillingTab
            plan={subscription?.plan ?? "FREE"}
            status={subscription?.status ?? "ACTIVE"}
            currentPeriodEnd={subscription?.currentPeriodEnd?.toISOString() ?? null}
            cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
            isTrialing={isTrialing}
            trialEnd={subscription?.trialEnd?.toISOString() ?? null}
          />
        </TabsContent>
        <TabsContent value="accounts"><AccountsTab /></TabsContent>
        <TabsContent value="api-keys"><ApiKeysTab /></TabsContent>
        <TabsContent value="privacy"><PrivacyTab /></TabsContent>
      </Tabs>
    </div>
  );
}
