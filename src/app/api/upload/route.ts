import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

async function getCloudinaryConfig(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId, service: "cloudinary" } },
  });
  if (!integration?.isActive || !integration.config) return null;
  const cfg = integration.config as Record<string, string>;
  if (!cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) return null;
  return cfg;
}

async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<{ url: string; publicId: string }> {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "tradegx/screenshots",
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalid" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Niciun fișier" }, { status: 400 });

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Tip nesuportat. Folosește JPG, PNG, GIF sau WebP." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fișier prea mare. Maximum 8 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Try Cloudinary first if user has it configured
  const cloudinaryConfig = await getCloudinaryConfig(session.user.id);
  if (cloudinaryConfig) {
    try {
      const { url, publicId } = await uploadToCloudinary(buffer, file.name, cloudinaryConfig);
      return NextResponse.json({ url, publicId, provider: "cloudinary" });
    } catch (err) {
      console.error("[UPLOAD] Cloudinary failed, falling back to local:", err);
    }
  }

  // Fallback: local disk storage
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "community");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(uploadsDir, safeName);

  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/community/${safeName}`, provider: "local" });
}
