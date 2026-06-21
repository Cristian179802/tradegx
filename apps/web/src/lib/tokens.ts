import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { TokenType } from "@prisma/client";

export async function generateVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.verificationToken.deleteMany({
    where: { identifier: email, type: "EMAIL_VERIFICATION" },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      type: "EMAIL_VERIFICATION",
      expires,
    },
  });

  return token;
}

export async function generatePasswordResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.verificationToken.deleteMany({
    where: { identifier: email, type: "PASSWORD_RESET" },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      type: "PASSWORD_RESET",
      expires,
    },
  });

  return token;
}

export async function verifyToken(
  token: string,
  type: TokenType
): Promise<{ identifier: string } | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (record.type !== type) return null;
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }

  return { identifier: record.identifier };
}

export async function consumeToken(token: string): Promise<void> {
  await prisma.verificationToken.delete({ where: { token } });
}
