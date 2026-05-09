import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/metaapi";
import { validateKey as validateTwelveData } from "@/lib/twelvedata";

function maskKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integrations = await prisma.userIntegration.findMany({
    where: { userId: session.user.id },
    orderBy: { service: "asc" },
  });

  const masked = integrations.map((i) => ({
    service: i.service,
    isActive: i.isActive,
    hasKey: !!i.apiKey,
    maskedKey: i.apiKey ? maskKey(i.apiKey) : null,
    config: i.config,
    updatedAt: i.updatedAt,
  }));

  return NextResponse.json({ integrations: masked });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { service, apiKey, config, disconnect } = body;

  const ALLOWED_SERVICES = ["metaapi", "cloudinary", "twelvedata"];
  if (!service || !ALLOWED_SERVICES.includes(service)) {
    return NextResponse.json({ error: "Serviciu invalid" }, { status: 400 });
  }

  if (disconnect) {
    await prisma.userIntegration.deleteMany({
      where: { userId: session.user.id, service },
    });
    return NextResponse.json({ success: true, disconnected: true });
  }

  // ── Validation per service ────────────────────────────────────────────────

  if (service === "metaapi") {
    if (!apiKey) {
      return NextResponse.json({ error: "MetaAPI token este obligatoriu" }, { status: 400 });
    }
    const valid = await validateToken(apiKey);
    if (!valid) {
      return NextResponse.json(
        { error: "Token MetaAPI invalid. Verifică cheia din dashboard.metaapi.cloud → API tokens." },
        { status: 400 }
      );
    }
  }

  if (service === "twelvedata") {
    if (!apiKey) {
      return NextResponse.json({ error: "TwelveData API key este obligatoriu" }, { status: 400 });
    }
    const valid = await validateTwelveData(apiKey);
    if (!valid) {
      return NextResponse.json(
        { error: "API key TwelveData invalid. Verifică cheia din twelvedata.com/account." },
        { status: 400 }
      );
    }
  }

  if (service === "cloudinary") {
    const { cloudName, apiKey: cldKey, apiSecret } = (config ?? {}) as Record<string, string>;
    if (!cloudName || !cldKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary necesită Cloud Name, API Key și API Secret" },
        { status: 400 }
      );
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const integration = await prisma.userIntegration.upsert({
    where: { userId_service: { userId: session.user.id, service } },
    update: {
      ...(apiKey && { apiKey }),
      ...(config && { config }),
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      service,
      apiKey: apiKey ?? null,
      config: config ?? null,
      isActive: true,
    },
  });

  return NextResponse.json({
    success: true,
    integration: {
      service: integration.service,
      isActive: integration.isActive,
      hasKey: !!integration.apiKey,
      maskedKey: integration.apiKey ? maskKey(integration.apiKey) : null,
      config: integration.config,
      updatedAt: integration.updatedAt,
    },
  });
}
