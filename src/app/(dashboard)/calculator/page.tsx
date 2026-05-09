import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LotSizeCalculator } from "@/components/calculator/lot-size-calculator";

export const metadata = { title: "Calculator loturi" };

export default async function CalculatorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawAccounts, user] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, balance: true, currency: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultRiskPct: true },
    }),
  ]);

  const accounts = rawAccounts.map((a) => ({
    ...a,
    balance: a.balance.toString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Calculator loturi</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Calculează volumul optim în funcție de risc și stop loss
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
          <p className="text-zinc-500 text-sm">
            Adaugă un cont de trading pentru a folosi calculatorul.
          </p>
        </div>
      ) : (
        <LotSizeCalculator
          accounts={accounts}
          defaultRiskPct={user?.defaultRiskPct ? Number(user.defaultRiskPct) : 1}
        />
      )}
    </div>
  );
}
