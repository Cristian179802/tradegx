import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LocaleWidget } from "@/components/dashboard/locale-widget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#09090b" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto"
          style={{
            background: "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.03) 0%, transparent 50%), #09090b",
          }}
        >
          <div className="p-5 md:p-6 max-w-[1600px]">{children}</div>
        </main>
      </div>
      <LocaleWidget />
    </div>
  );
}
