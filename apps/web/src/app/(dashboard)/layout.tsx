import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LocaleWidget } from "@/components/dashboard/locale-widget";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { TrialBanner } from "@/components/billing/trial-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    // tg-grain: aceeași textură ca pe landing, ca interiorul să nu pară alt produs.
    <div className="tg-grain flex h-screen overflow-hidden" style={{ background: "var(--s-0)" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <TrialBanner />
        <main
          className="flex-1 overflow-y-auto mesh-bg"
          style={{ background: "#09090b" }}
        >
          <div className="p-5 md:p-6 pb-28 md:pb-6 max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
      <LocaleWidget />
      <BottomNav />
      <CommandPalette />
    </div>
  );
}
