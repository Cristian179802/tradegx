import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoDetectAndParse, detectInstrumentType } from "@/lib/parsers/index";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const accountName = (formData.get("accountName") as string) || "Cont Importat";
    const accountType = (formData.get("accountType") as string) || "LIVE";
    const currency = (formData.get("currency") as string) || "USD";
    const balance = parseFloat((formData.get("balance") as string) || "0");
    const broker = (formData.get("broker") as string) || "";
    const tradingAccountId = formData.get("tradingAccountId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Niciun fișier primit" }, { status: 400 });
    }

    // Read file content
    const content = await file.text();
    if (!content.trim()) {
      return NextResponse.json({ error: "Fișierul este gol" }, { status: 400 });
    }

    // Parse
    const { trades, format, warnings } = autoDetectAndParse(content, file.name);

    if (trades.length === 0) {
      return NextResponse.json({
        error: "Nu am găsit nicio tranzacție în fișier. Asigură-te că exportul conține istoricul complet al contului.",
        warnings,
        format,
      }, { status: 422 });
    }

    // Determine date range for initial balance hint
    const sortedByDate = [...trades].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
    const firstTrade = sortedByDate[0];
    const lastTrade = sortedByDate[sortedByDate.length - 1];

    // Create or find trading account
    let tradingAccount;
    if (tradingAccountId) {
      tradingAccount = await prisma.tradingAccount.findFirst({
        where: { id: tradingAccountId, userId: session.user.id },
      });
      if (!tradingAccount) {
        return NextResponse.json({ error: "Cont de trading inexistent" }, { status: 404 });
      }
    } else {
      tradingAccount = await prisma.tradingAccount.create({
        data: {
          userId: session.user.id,
          name: accountName,
          type: accountType as any,
          broker: broker || "Import",
          accountNumber: "",
          currency: currency as any,
          balance: balance || 0,
          initialBalance: balance || 0,
          leverage: 100,
          brokerSource: "MANUAL",
          lastSyncedAt: new Date(),
        },
      });
    }

    // Import trades (skip duplicates by brokerTradeId)
    let imported = 0;
    let skipped = 0;

    for (const trade of trades) {
      // Check for duplicate
      const existing = await prisma.trade.findFirst({
        where: {
          accountId: tradingAccount.id,
          brokerTradeId: trade.brokerTradeId,
        },
      });
      if (existing) { skipped++; continue; }

      const durationMinutes = Math.max(
        0,
        Math.round((trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000)
      );

      await prisma.trade.create({
        data: {
          accountId: tradingAccount.id,
          symbol: trade.symbol,
          instrumentType: trade.instrumentType as any,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          entryTime: trade.entryTime,
          exitPrice: trade.exitPrice,
          exitTime: trade.exitTime,
          lotSize: trade.lotSize,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
          pnlMoney: trade.pnlMoney,
          pnlPercent: 0,
          commission: trade.commission,
          swap: trade.swap,
          status: "CLOSED",
          brokerSource: "MANUAL",
          brokerTradeId: trade.brokerTradeId,
          durationMinutes,
          tags: [],
        },
      });
      imported++;
    }

    // Update account balance if not specified
    if (!balance && tradingAccount.balance.toString() === "0") {
      const totalPnl = trades.reduce((s, t) => s + t.pnlMoney, 0);
      await prisma.tradingAccount.update({
        where: { id: tradingAccount.id },
        data: { balance: totalPnl, initialBalance: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      tradingAccountId: tradingAccount.id,
      imported,
      skipped,
      total: trades.length,
      format,
      warnings: warnings.slice(0, 5), // max 5 warnings
      dateRange: {
        from: firstTrade.entryTime.toISOString(),
        to: lastTrade.exitTime.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[IMPORT]", err);
    return NextResponse.json(
      { error: err.message ?? "Eroare la import" },
      { status: 500 }
    );
  }
}
