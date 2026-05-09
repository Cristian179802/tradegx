import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Return masked API keys — never expose raw keys
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

  if (!apiKey && !config) {
    return NextResponse.json({ error: "Lipsesc datele de configurare" }, { status: 400 });
  }

  // Validate the key works before saving
  if (service === "metaapi" && apiKey) {
    try {
      const res = await fetch("https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current", {
        headers: { "auth-token": apiKey },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Token MetaAPI invalid. Verifică cheia și încearcă din nou." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Nu s-a putut conecta la MetaAPI. Verifică cheia." }, { status: 400 });
    }
  }

  if (service === "cloudinary" && config) {
    const { cloudName, apiKey: cldKey, apiSecret } = config as Record<string, string>;
    if (!cloudName || !cldKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary necesită Cloud Name, API Key și API Secret" }, { status: 400 });
    }
  }

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
    },
  });
}
