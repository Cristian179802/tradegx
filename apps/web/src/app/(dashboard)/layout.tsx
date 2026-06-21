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
          className="flex-1 overflow-y-auto mesh-bg"
          style={{ background: "#09090b" }}
        >
          <div className="p-5 md:p-6 max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
      <LocaleWidget />
    </div>
  );
}
