import { z } from "zod";

// ── Schema env centralizată — aceleași chei pentru toate platformele ──────────
// Validează variabilele server-side (web/backend). Mobile folosește doar
// EXPO_PUBLIC_* (vezi mobileEnvSchema).

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_SIGNALS_CHAT_IDS: z.string().optional(),
  METAAPI_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Validare lazy — nu arunca la import (Next.js build colectează env-ul treptat)
export function parseServerEnv(env: NodeJS.ProcessEnv = process.env): Partial<ServerEnv> {
  const parsed = serverEnvSchema.safeParse(env);
  return parsed.success ? parsed.data : (env as Partial<ServerEnv>);
}

// Variabile publice pentru mobile (Expo)
export const mobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});
export type MobileEnv = z.infer<typeof mobileEnvSchema>;
