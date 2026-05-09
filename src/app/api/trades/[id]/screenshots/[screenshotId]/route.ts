import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; screenshotId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id, screenshotId } = await params;

  const screenshot = await prisma.tradeScreenshot.findFirst({
    where: { id: screenshotId, tradeId: id, trade: { account: { userId: session.user.id } } },
  });
  if (!screenshot) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  // Delete from Cloudinary if configured
  if (screenshot.publicId) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.round(Date.now() / 1000);
      const crypto = await import("crypto");
      const signature = crypto
        .createHash("sha1")
        .update(`public_id=${screenshot.publicId}&timestamp=${timestamp}${apiSecret}`)
        .digest("hex");

      const form = new FormData();
      form.append("public_id", screenshot.publicId);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);

      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: form,
      }).catch(() => {});
    }
  }

  await prisma.tradeScreenshot.delete({ where: { id: screenshotId } });
  return NextResponse.json({ success: true });
}
