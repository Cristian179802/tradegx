import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

function mask(chatId: string): string {
  if (!chatId || chatId.length < 4) return "••••";
  return "••••" + chatId.slice(-4);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const integ = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId: session.user.id, service: "telegram" } },
  });

  return NextResponse.json({
    connected: !!(integ?.isActive && integ.apiKey),
    maskedChatId: integ?.apiKey ? mask(integ.apiKey) : null,
    botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Botul Telegram nu este configurat pe server (TELEGRAM_BOT_TOKEN lipsește)." },
      { status: 503 }
    );
  }

  const { chatId } = await request.json();
  const id = String(chatId ?? "").trim();
  if (!id || !/^-?\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Chat ID invalid. Trebuie să fie un număr (obține-l de la @userinfobot pe Telegram)." },
      { status: 400 }
    );
  }

  // Trimite mesaj de test — confirmă că chat ID-ul e corect și botul poate scrie
  const ok = await sendTelegramMessage(
    id,
    "✅ <b>TradeGx conectat!</b>\n\nVei primi aici alertele de risc și disciplină. Poți dezactiva oricând din Setări → Notificări.",
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Nu am putut trimite mesajul de test. Verifică Chat ID-ul și asigură-te că ai apăsat Start în conversația cu botul." },
      { status: 400 }
    );
  }

  await prisma.userIntegration.upsert({
    where: { userId_service: { userId: session.user.id, service: "telegram" } },
    update: { apiKey: id, isActive: true, updatedAt: new Date() },
    create: { userId: session.user.id, service: "telegram", apiKey: id, isActive: true },
  });

  return NextResponse.json({ success: true, maskedChatId: mask(id) });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  await prisma.userIntegration.deleteMany({
    where: { userId: session.user.id, service: "telegram" },
  });

  return NextResponse.json({ success: true });
}
