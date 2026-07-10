import crypto from "crypto";
import { authenticator } from "otplib";

// ── 2FA (TOTP) — utilitare server ────────────────────────────────────────────
// Secretul TOTP e criptat la rest (AES-256-GCM). Codurile de rezervă sunt
// stocate doar ca hash (HMAC-SHA256). Cheia derivă din NEXTAUTH_SECRET.

const KEY = crypto.createHash("sha256")
  .update(process.env.NEXTAUTH_SECRET || "insecure-dev-secret")
  .digest();

const ISSUER = "TradeGx";

// ± un pas (30s) toleranță pentru desincronizare de ceas
authenticator.options = { window: 1 };

// ── Criptare secret ──────────────────────────────────────────────────────────
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB, tagB, dataB] = payload.split(":");
  if (!ivB || !tagB || !dataB) throw new Error("bad payload");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
}

// ── TOTP ─────────────────────────────────────────────────────────────────────
export const generateSecret = (): string => authenticator.generateSecret();

export const keyuri = (email: string, secret: string): string =>
  authenticator.keyuri(email, ISSUER, secret);

export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

// ── Coduri de rezervă ────────────────────────────────────────────────────────
export function generateBackupCodes(n = 10): string[] {
  return Array.from({ length: n }, () => {
    const raw = crypto.randomBytes(4).toString("hex"); // 8 caractere hex
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
}

const norm = (code: string) => code.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

export function hashBackupCode(code: string): string {
  return crypto.createHmac("sha256", KEY).update(norm(code)).digest("hex");
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(hashBackupCode);
}

/** verifică un cod de rezervă și îl consumă (întoarce hash-urile rămase) */
export function verifyBackup(input: string, hashes: string[]): { ok: boolean; remaining: string[] } {
  const h = hashBackupCode(input);
  const idx = hashes.indexOf(h);
  if (idx === -1) return { ok: false, remaining: hashes };
  return { ok: true, remaining: hashes.filter((_, i) => i !== idx) };
}
