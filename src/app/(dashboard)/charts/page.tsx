import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TradingViewChart } from "./tradingview-chart";

export const metadata: Metadata = { title: "Grafice Live" };

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { symbol } = await searchParams;
  const activeSymbol = symbol ?? "EURUSD";

  return (
    <div className="flex flex-col h-full space-y-4" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Grafice Live</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {activeSymbol} — Grafic avansat TradingView în timp real
          </p>
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-zinc-800 min-h-0">
        <TradingViewChart symbol={activeSymbol} />
      </div>
    </div>
  );
}
