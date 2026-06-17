import { prisma } from "@/lib/prisma";

// ── Integrare Telegram Bot (gratuită) ────────────────────────────────────────
// Necesită env var TELEGRAM_BOT_TOKEN (token de la @BotFather).
// Chat ID-ul fiecărui utilizator e stocat în UserIntegration(service="telegram", apiKey=chatId).

const API = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

/** Trimite un mesaj brut către un chat Telegram. Returnează true la succes. */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(API(token, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
  }
}

/**
 * Notifică un utilizator pe Telegram (dacă are integrarea activă).
 * Folosit la crearea alertelor. Eșuează silențios — nu blochează fluxul principal.
 */
export async function notifyTelegram(userId: string, title: string, message: string): Promise<void> {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    const integ = await prisma.userIntegration.findUnique({
      where: { userId_service: { userId, service: "telegram" } },
    });
    if (!integ?.isActive || !integ.apiKey) return;

    const text = `🔔 <b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}\n\n<i>TradeGx · www.tradegx.com</i>`;
    await sendTelegramMessage(integ.apiKey, text);
  } catch {
    /* silent */
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Difuzează un mesaj către TOȚI utilizatorii cu integrare Telegram activă.
 * Folosit pentru semnalele AI zilnice. Returnează numărul de mesaje trimise.
 */
export async function broadcastTelegram(text: string): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return 0;
  const integrations = await prisma.userIntegration.findMany({
    where: { service: "telegram", isActive: true, apiKey: { not: null } },
    select: { apiKey: true },
  });
  let sent = 0;
  // Trimitere secvențială cu pauză scurtă (respectă rate limit Telegram ~30 msg/s)
  for (const integ of integrations) {
    if (!integ.apiKey) continue;
    const ok = await sendTelegramMessage(integ.apiKey, text);
    if (ok) sent++;
    await new Promise((r) => setTimeout(r, 60));
  }
  return sent;
}

export { escapeHtml };
