import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeals, pairDeals } from "@/lib/metaapi";

const PROVISIONING_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const CLIENT_BASE = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";

function getPlatformToken(): string {
  const token = process.env.METAAPI_TOKEN;
  if (!token) throw new Error("METAAPI_TOKEN not configured on server");
  return token;
}

async function createMetaApiAccount(params: {
  login: string;
  password: string;
  server: string;
  platform: "mt4" | "mt5";
  name: string;
}): Promise<{ id: string; state: string }> {
  const token = getPlatformToken();

  const res = await fetch(`${PROVISIONING_BASE}/users/current/accounts`, {
    method: "POST",
    headers: {
      "auth-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login: params.login,
      password: params.password,
      name: params.name,
      server: params.server,
      platform: params.platform,
      type: "cloud",
      magic: 0,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.message ?? err.error ?? `MetaAPI provisioning error ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
}

async function waitForConnection(accountId: string, maxWaitMs = 30000): Promise<boolean> {
  const token = getPlatformToken();
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}`, {
      headers: { "auth-token": token },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.connectionStatus === "CONNECTED") return true;
      if (data.connectionStatus === "ERROR") return false;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  if (!process.env.METAAPI_TOKEN) {
    return NextResponse.json(
      { error: "Sincronizarea MT4/MT5 nu este configurată pe server. Contactează suportul." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const { login, password, server, platform, name, accountType, currency, leverage,
          maxDailyLossPct, maxDrawdownPct, tradingAccountId } = body;

  if (!login || !password || !server || !platform) {
    return NextResponse.json(
      { error: "Login, parolă, server și platformă sunt obligatorii" },
      { status: 400 }
    );
  }

  try {
    // 1. Create account in MetaAPI using TradeGX's platform token
    let metaApiAccountId: string;

    try {
      const created = await createMetaApiAccount({
        login: String(login),
        password,
        server,
        platform: platform as "mt4" | "mt5",
        name: name || `${platform.toUpperCase()} ${login}`,
      });
      metaApiAccountId = created.id;
    } catch (err: any) {
      // If account already exists with this login/server, try to find it
      if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
        const token = getPlatformToken();
        const listRes = await fetch(`${CLIENT_BASE}/users/current/accounts?limit=100`, {
          headers: { "auth-token": token },
          signal: AbortSignal.timeout(10000),
        });
        if (listRes.ok) {
          const accounts = await listRes.json();
          const existing = (Array.isArray(accounts) ? accounts : accounts.data ?? [])
            .find((a: any) => a.login === String(login) && a.server === server);
          if (existing) {
            metaApiAccountId = existing.id;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // 2. Create or update TradingAccount in our DB
    let tradingAccount;
    if (tradingAccountId) {
      tradingAccount = await prisma.tradingAccount.update({
        where: { id: tradingAccountId },
        data: {
          metaApiId: metaApiAccountId,
          brokerSource: "METAAPI",
          broker: server.split("-")[0],
          accountNumber: String(login),
          lastSyncedAt: new Date(),
        },
      });
    } else {
      tradingAccount = await prisma.tradingAccount.create({
        data: {
          userId: session.user.id,
          name: name || `${platform.toUpperCase()} ${server.split("-")[0]} ${login}`,
          type: (accountType as any) || "LIVE",
          broker: server.split("-")[0],
          accountNumber: String(login),
          currency: (currency as any) || "USD",
          balance: 0,
          initialBalance: 0,
          leverage: leverage || 100,
          maxDailyLossPct: maxDailyLossPct ?? null,
          maxDrawdownPct: maxDrawdownPct ?? null,
          metaApiId: metaApiAccountId,
          brokerSource: "METAAPI",
          lastSyncedAt: new Date(),
        },
      });
    }

    // 3. Try to sync trades (non-blocking, returns immediately with partial results)
    let imported = 0;
    let syncError = null;

    try {
      const token = getPlatformToken();
      const to = new Date();
      const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deals = await getDeals(token, metaApiAccountId, from, to);
      const paired = pairDeals(deals);

      // Also try to get current balance from MetaAPI
      try {
        const accRes = await fetch(`${CLIENT_BASE}/users/current/accounts/${metaApiAccountId}`, {
          headers: { "auth-token": token },
          signal: AbortSignal.timeout(8000),
        });
        if (accRes.ok) {
          const accData = await accRes.json();
          if (accData.balance) {
            await prisma.tradingAccount.update({
              where: { id: tradingAccount.id },
              data: {
                balance: accData.balance,
                initialBalance: parseFloat(tradingAccount.initialBalance.toString()) > 0
                  ? tradingAccount.initialBalance
                  : accData.balance,
              },
            });
          }
        }
      } catch {}

      for (const trade of paired) {
        const existing = await prisma.trade.findFirst({
          where: { accountId: tradingAccount.id, brokerTradeId: trade.positionId },
        });
        if (existing) continue;

        const durationMinutes = Math.round(
          (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000
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
            brokerSource: "METAAPI",
            brokerTradeId: trade.positionId,
            durationMinutes,
            tags: [],
          },
        });
        imported++;
      }
    } catch (e: any) {
      syncError = e.message;
    }

    return NextResponse.json({
      success: true,
      tradingAccountId: tradingAccount.id,
      metaApiAccountId,
      imported,
      syncError,
      message: imported > 0
        ? `Cont conectat! ${imported} tranzacții importate din ultimele 90 de zile.`
        : "Cont conectat! Tranzacțiile vor apărea după ce MetaAPI se sincronizează (1-2 min).",
    });
  } catch (err: any) {
    console.error("[METAAPI/PROVISION]", err);
    return NextResponse.json(
      { error: err.message ?? "Eroare la conectarea contului MT4/MT5." },
      { status: 502 }
    );
  }
}
