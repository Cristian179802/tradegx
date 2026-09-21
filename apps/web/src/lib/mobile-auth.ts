import crypto from "crypto";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "@tradegx/core";

// ── JWT pentru mobile (HMAC-SHA256, server-only) ──────────────────────────────
// NextAuth gestionează auth-ul web (cookie). Aceste token-uri sunt DOAR pentru
// app-ul native (Authorization: Bearer), stocate în expo-secure-store.

// SECURITATE: fără fallback la un secret hardcodat. Dacă lipsește secretul,
// aruncăm — altfel oricine ar putea forja token-uri (vulnerabilitate critică).
function secret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET lipsește — auth mobil dezactivat");
  return s;
}

type Fel = "access" | "refresh" | "exchange";

interface Payload {
  sub: string; // userId
  type: Fel;
  iat: number;
  exp: number;
  /** Doar pe "exchange": SHA-256 al secretului păstrat de telefon (PKCE). */
  challenge?: string;
}

function sign(payload: Omit<Payload, "iat" | "exp">, ttlSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + ttlSec })).toString("base64url");
  const data = `${header}.${body}`;
  const sig = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string, type: Fel): Payload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
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

// ── Codul de schimb pentru conectarea cu Google din aplicație ────────────────
//
// Conectarea cu Google se face în fereastra de browser, fiindcă acolo trăiește
// sesiunea NextAuth. La final trebuie să întoarcem telefonului o pereche de
// token-uri — dar drumul înapoi e un link `tradegx://`, iar pe Android ORICE
// aplicație poate să înregistreze aceeași schemă. Un token trimis direct prin
// link ar putea fi prins de altcineva.
//
// De aceea prin link trece doar un COD, care singur nu valorează nimic:
// telefonul își ține un secret pe care nu-l trimite niciodată, pune în link
// doar amprenta lui, iar codul e legat de amprenta aia. Cine prinde codul nu
// are secretul, deci nu-l poate preschimba. E același mecanism ca PKCE.
//
// Două minute de viață: destul cât să alegi contul Google, prea puțin ca să
// folosească cuiva mai târziu.

const TTL_SCHIMB = 120;

export function signExchangeCode(userId: string, challenge: string): string {
  return sign({ sub: userId, type: "exchange", challenge }, TTL_SCHIMB);
}

/**
 * Întoarce userId-ul dacă `verifier` e într-adevăr secretul din spatele
 * amprentei cu care a fost emis codul. `null` în orice alt caz.
 */
export function verifyExchangeCode(code: string, verifier: string): string | null {
  const p = verify(code, "exchange");
  if (!p?.challenge) return null;

  const asteptat = crypto.createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(p.challenge);
  const b = Buffer.from(asteptat);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return p.sub;
}
