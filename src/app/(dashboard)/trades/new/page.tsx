import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TradeForm } from "@/components/trades/trade-form";

export const metadata = { title: "Trade nou" };

export default async function NewTradePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, currency: true, balance: true },
    orderBy: { createdAt: "desc" },
  });

  if (accounts.length === 0) redirect("/accounts");

  const serializedAccounts = accounts.map((a) => ({
    ...a,
    balance: a.balance.toString(),
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Trade nou</h1>
        <p className="text-sm text-zinc-500 mt-1">Jurnalizează un trade manual</p>
      </div>
      <TradeForm accounts={serializedAccounts} />
    </div>
  );
}
