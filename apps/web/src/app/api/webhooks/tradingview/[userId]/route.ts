import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { notifyTelegram } from "@/lib/telegram";
import { sendPushToUser } from "@/lib/push";

// ── Webhook TradingView ─────────────────────────────────────────────────────
// TradingView trimite alertele ca POST JSON către un URL — fără headere
// custom, deci token-ul stă în query string: ?token=...
// Alertele ajung instant în aplicație (in-app + Telegram + push).

function getTvToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-secret";
  return createHmac("sha256", secret).update(`tv:${userId}`).digest("hex").slice(0, 32);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (token !== getTvToken(userId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, userId });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (token !== getTvToken(userId)) {
    return NextResponse.json({ error: "Token invalid" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // TV poate trimite JSON sau text simplu — acceptăm ambele.
  let body: Record<string, unknown> = {};
  const raw = await req.text();
  try {
    body = JSON.parse(raw);
  } catch {
    body = { message: raw };
  }

  const symbol = String(body.symbol ?? body.ticker ?? "").toUpperCase().replace(/\s/g, "");
  const sideRaw = String(body.direction ?? body.side ?? body.action ?? "").toLowerCase();
  const side =
    /buy|long/.test(sideRaw) ? "BUY" : /sell|short/.test(sideRaw) ? "SELL" : null;
  const price = body.price != null ? Number(body.price) : null;
  const sl = body.sl != null ? Number(body.sl) : null;
  const tp = body.tp != null ? Number(body.tp) : null;
  const comment = String(body.comment ?? body.message ?? "").slice(0, 400);
  const timeframe = body.timeframe ? String(body.timeframe) : null;

  const title = side && symbol
    ? `Semnal TradingView: ${side} ${symbol}`
    : "Alertă TradingView";

  const parts: string[] = [];
  if (price != null && !Number.isNaN(price)) parts.push(`Preț: ${price}`);
  if (sl != null && !Number.isNaN(sl)) parts.push(`SL: ${sl}`);
  if (tp != null && !Number.isNaN(tp)) parts.push(`TP: ${tp}`);
  if (timeframe) parts.push(`TF: ${timeframe}`);
  const message = [parts.join(" · "), comment].filter(Boolean).join("\n") || "Alertă primită din TradingView.";

  await prisma.alert.create({
    data: {
      userId,
      type: "NEWS_IMPACT", // canal generic de semnal extern
      severity: side ? "HIGH" : "MEDIUM",
      title,
      message,
      isRead: false,
      metadata: { source: "tradingview", symbol, side, price, sl, tp, timeframe },
    },
  });

  await notifyTelegram(userId, `📡 ${title}`, message);
  void sendPushToUser(userId, { title: `📡 ${title}`, body: message, data: { route: "/(tabs)/alerts" } });

  return NextResponse.json({ ok: true });
}
