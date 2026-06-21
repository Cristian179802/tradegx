import crypto from "crypto";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "@tradegx/core";

// ── JWT pentru mobile (HMAC-SHA256, server-only) ──────────────────────────────
// NextAuth gestionează auth-ul web (cookie). Aceste token-uri sunt DOAR pentru
// app-ul native (Authorization: Bearer), stocate în expo-secure-store.

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "tradegx-dev-secret";
}

interface Payload {
  sub: string;       // userId
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

function sign(payload: Omit<Payload, "iat" | "exp">, ttlSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + ttlSec })).toString("base64url");
  const data = `${header}.${body}`;
  const sig = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string, type: "access" | "refresh"): Payload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  // Comparație în timp constant
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (payload.type !== type) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signTokenPair(userId: string) {
  return {
    accessToken: sign({ sub: userId, type: "access" }, ACCESS_TOKEN_TTL),
    refreshToken: sign({ sub: userId, type: "refresh" }, REFRESH_TOKEN_TTL),
  };
}

export function verifyAccessToken(token: string): string | null {
  return verify(token, "access")?.sub ?? null;
}

export function verifyRefreshToken(token: string): string | null {
  return verify(token, "refresh")?.sub ?? null;
}
