import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function uploadToCloudinary(
  base64: string,
  mimeType: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary not configured");
  }

  const dataUri = `data:${mimeType};base64,${base64}`;
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    select: { id: true },
  });
  if (!trade) return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });

  const existing = await prisma.tradeScreenshot.count({ where: { tradeId: id } });
  if (existing >= 5) {
    return NextResponse.json({ error: "Maxim 5 screenshot-uri per trade" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const { base64, mimeType, type = "ENTRY" } = body as {
    base64: string;
    mimeType: string;
    type?: string;
  };

  if (!base64 || !mimeType) {
    return NextResponse.json({ error: "Lipsesc datele imaginii" }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return NextResponse.json({ error: "Format neacceptat (JPEG, PNG, WEBP)" }, { status: 400 });
  }

  try {
    const { url, publicId } = await uploadToCloudinary(
      base64,
      mimeType,
      `tradegx/${session.user.id}`
    );

    const screenshot = await prisma.tradeScreenshot.create({
      data: { tradeId: id, url, publicId, type: type as never },
    });

    return NextResponse.json(screenshot, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload eșuat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
