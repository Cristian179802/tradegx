import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, consumeToken } from "@/lib/tokens";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=token-missing", request.url)
    );
  }

  const result = await verifyToken(token, "EMAIL_VERIFICATION");

  if (!result) {
    return NextResponse.redirect(
      new URL("/login?error=token-invalid", request.url)
    );
  }

  await prisma.user.update({
    where: { email: result.identifier },
    data: { emailVerified: new Date() },
  });

  await consumeToken(token);

  return NextResponse.redirect(
    new URL("/login?verified=true", request.url)
  );
}
