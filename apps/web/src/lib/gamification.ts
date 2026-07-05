import { prisma } from "@/lib/prisma";

// ── Gamification ────────────────────────────────────────────────────────────
// Streak-uri și realizări calculate 100% din datele REALE ale utilizatorului
// (tranzacții, jurnal, alerte, backteste) — fără tabele noi, fără puncte false.

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  /** progres curent / țintă — pentru bara de progres la cele blocate */
  progress: number;
  target: number;
}

export interface GamificationData {
  streak: { current: number; best: number };
  totalTrades: number;
  achievements: Achievement[];
}

/** zilele calendaristice (yyyy-mm-dd, local RO) în care a existat activitate */
function dayKey(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

function computeStreak(activityDays: Set<string>): { current: number; best: number } {
  if (activityDays.size === 0) return { current: 0, best: 0 };

  const days = [...activityDays].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  // Streak-ul curent: numără înapoi de azi (sau de ieri — ziua de azi nu s-a terminat)
  let current = 0;
  const today = new Date();
  for (let offset = 0; ; offset++) {
    const key = dayKey(new Date(today.getTime() - offset * 86_400_000));
    if (activityDays.has(key)) current++;
    else if (offset === 0) continue; // azi lipsă nu rupe streak-ul (ziua e în curs)
    else break;
  }

  return { current, best };
}

export async function getGamification(userId: string): Promise<GamificationData> {
  const [trades, revengeAlerts, backtestCount, syncedAccount] = await Promise.all([
    prisma.trade.findMany({
      where: { account: { userId }, status: "CLOSED" },
      select: {
        exitTime: true,
        entryTime: true,
        pnlMoney: true,
        commission: true,
        swap: true,
        stopLoss: true,
        brokerSource: true,
      },
      orderBy: { exitTime: "asc" },
    }),
    prisma.alert.count({
      where: {
        userId,
        type: { in: ["REVENGE_TRADING", "OVERTRADING"] },
        createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
    }),
    prisma.backtest.count({ where: { strategy: { userId } } }),
    prisma.tradingAccount.findFirst({
      where: { userId, brokerSource: { not: null }, NOT: { brokerSource: "MANUAL" } },
      select: { id: true },
    }),
  ]);

  const n = trades.length;
  const net = (t: (typeof trades)[number]) =>
    Number(t.pnlMoney ?? 0) + Number(t.commission ?? 0) + Number(t.swap ?? 0);

  // ── Streak: zile cu activitate jurnalizată ──
  const activityDays = new Set<string>();
  for (const t of trades) {
    if (t.exitTime) activityDays.add(dayKey(t.exitTime));
  }
  const streak = computeStreak(activityDays);

  // ── Statistici pentru realizări ──
  const last20 = trades.slice(-20);
  const winsLast20 = last20.filter((t) => net(t) > 0).length;
  const wrLast20 = last20.length === 20 ? (winsLast20 / 20) * 100 : 0;

  // SL setat pe ultimele 20 consecutive
  const slStreak20 = last20.length === 20 && last20.every((t) => t.stopLoss != null);
  const slCount = last20.filter((t) => t.stopLoss != null).length;

  // Lună verde: luna calendaristică precedentă sau curentă cu net > 0 și ≥10 tranzacții
  const byMonth = new Map<string, { net: number; count: number }>();
  for (const t of trades) {
    if (!t.exitTime) continue;
    const key = `${t.exitTime.getFullYear()}-${t.exitTime.getMonth()}`;
    const m = byMonth.get(key) ?? { net: 0, count: 0 };
    m.net += net(t);
    m.count++;
    byMonth.set(key, m);
  }
  const hasGreenMonth = [...byMonth.values()].some((m) => m.net > 0 && m.count >= 10);

  // Zen: are activitate în ultimele 30 zile ȘI zero alerte revenge/overtrading
  const activeLast30 = trades.some(
    (t) => t.exitTime && t.exitTime.getTime() > Date.now() - 30 * 86_400_000
  );
  const zen = activeLast30 && revengeAlerts === 0;

  const achievements: Achievement[] = [
    {
      id: "primul-pas", emoji: "🚀",
      title: "Primul pas",
      description: "Ai jurnalizat prima tranzacție. De aici începe totul.",
      unlocked: n >= 1, progress: Math.min(n, 1), target: 1,
    },
    {
      id: "conectat", emoji: "🔌",
      title: "Conectat",
      description: "Primul cont sincronizat automat cu brokerul.",
      unlocked: !!syncedAccount, progress: syncedAccount ? 1 : 0, target: 1,
    },
    {
      id: "disciplinat", emoji: "📓",
      title: "Disciplinat",
      description: "7 zile consecutive cu activitate jurnalizată.",
      unlocked: streak.best >= 7, progress: Math.min(streak.best, 7), target: 7,
    },
    {
      id: "de-neoprit", emoji: "🔥",
      title: "De neoprit",
      description: "30 de zile consecutive cu activitate jurnalizată.",
      unlocked: streak.best >= 30, progress: Math.min(streak.best, 30), target: 30,
    },
    {
      id: "centurion", emoji: "💯",
      title: "Centurion",
      description: "100 de tranzacții jurnalizate — ai date reale de analizat.",
      unlocked: n >= 100, progress: Math.min(n, 100), target: 100,
    },
    {
      id: "manager-de-risc", emoji: "🛡️",
      title: "Manager de risc",
      description: "Stop Loss setat pe 20 de tranzacții consecutive.",
      unlocked: slStreak20, progress: slCount, target: 20,
    },
    {
      id: "zen", emoji: "🧘",
      title: "Zen",
      description: "30 de zile activ, fără nicio alertă de revenge trading sau overtrading.",
      unlocked: zen, progress: zen ? 1 : 0, target: 1,
    },
    {
      id: "sniper", emoji: "🎯",
      title: "Sniper",
      description: "Win rate de minim 60% pe ultimele 20 de tranzacții.",
      unlocked: wrLast20 >= 60, progress: Math.round(wrLast20), target: 60,
    },
    {
      id: "luna-verde", emoji: "📗",
      title: "Lună verde",
      description: "O lună calendaristică pe profit, cu minim 10 tranzacții.",
      unlocked: hasGreenMonth, progress: hasGreenMonth ? 1 : 0, target: 1,
    },
    {
      id: "analist", emoji: "🧪",
      title: "Analist",
      description: "Primul backtest rulat pe date istorice reale.",
      unlocked: backtestCount >= 1, progress: Math.min(backtestCount, 1), target: 1,
    },
    {
      id: "om-de-stiinta", emoji: "🔬",
      title: "Om de știință",
      description: "10 backteste rulate — deciziile tale au bază statistică.",
      unlocked: backtestCount >= 10, progress: Math.min(backtestCount, 10), target: 10,
    },
    {
      id: "edge-gasit", emoji: "🗺️",
      title: "Edge găsit",
      description: "50 de tranzacții închise — Edge Finder are eșantion serios.",
      unlocked: n >= 50, progress: Math.min(n, 50), target: 50,
    },
  ];

  return { streak, totalTrades: n, achievements };
}
