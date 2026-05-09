import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shell, PageHeader } from "@/components/layout/shell";
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

export const metadata: Metadata = { title: "Setări" };

const TABS = [
  { value: "profile", label: "Profil" },
  { value: "trading-rules", label: "Reguli Trading" },
  { value: "appearance", label: "Aspect" },
  { value: "notifications", label: "Notificări" },
  { value: "billing", label: "Facturare" },
  { value: "accounts", label: "Conturi" },
  { value: "api-keys", label: "Chei API" },
  { value: "privacy", label: "Confidențialitate" },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
    <Shell>
      <PageHeader
        title="Setări"
        description="Gestionează contul, regulile de trading și preferințele tale."
      />

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto flex-wrap gap-1 rounded-xl">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-sm rounded-lg px-3 py-1.5 transition-all"
            >
              {tab.label}
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
    </Shell>
  );
}
