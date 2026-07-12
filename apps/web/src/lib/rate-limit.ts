import { prisma } from "@/lib/prisma";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Fallback în memorie — folosit DOAR dacă interogarea DB eșuează (o eroare
// trecătoare de conexiune nu trebuie să blocheze login-ul întregului site).
const memStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSecs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limiting persistent (Postgres) — corect peste instanțe serverless.
 * Un singur roundtrip: upsert atomic care resetează fereastra dacă a expirat.
 */
export async function rateLimit(
  identifier: string,
  { limit, windowSecs }: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowEnd = new Date(now + windowSecs * 1000);

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${identifier}, 1, ${windowEnd})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN ${windowEnd} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"
    `;
    const { count, resetAt } = rows[0];

    // Curățenie oportunistă (~1% din apeluri), fire-and-forget.
    if (Math.random() < 0.01) {
      prisma
        .$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < now() - interval '1 day'`
        .catch(() => {});
    }

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: resetAt.getTime(),
    };
  } catch {
    // DB indisponibil → fallback în memorie (per-instanță; mai bine decât nimic)
    const entry = memStore.get(identifier);
    if (!entry || entry.resetAt < now) {
      memStore.set(identifier, { count: 1, resetAt: now + windowSecs * 1000 });
      return { success: true, remaining: limit - 1, resetAt: now + windowSecs * 1000 };
    }
    if (entry.count >= limit) {
      return { success: false, remaining: 0, resetAt: entry.resetAt };
    }
    entry.count += 1;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }
}

/** Extract IP from Next.js request headers */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
