import crypto from "crypto";

// ── Token-uri de partajare pentru tranzacții (HMAC, fără stocare în DB) ───────
// Un link de share e valid doar dacă tokenul = HMAC-SHA256(tradeId) cu secretul serverului.
// Astfel orice utilizator poate genera un link pentru propriul trade, iar pagina publică
// îl validează fără sesiune — dar nimeni nu poate ghici link-uri pentru alte trade-uri.

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "tradegx-dev-secret";
}

export function signShareToken(tradeId: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`share:${tradeId}`)
    .digest("hex")
    .slice(0, 24);
}

export function verifyShareToken(tradeId: string, token: string): boolean {
  if (!token) return false;
  const expected = signShareToken(tradeId);
  // Comparație în timp constant
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
