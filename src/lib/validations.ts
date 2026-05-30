import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalid"),
  password: z.string().min(1, "Parola este obligatorie"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Numele trebuie să aibă cel puțin 2 caractere")
      .max(50, "Numele este prea lung"),
    email: z.string().email("Email invalid"),
    password: z
      .string()
      .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
      .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare")
      .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalid"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
      .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare")
      .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2, "Minim 2 caractere").max(50, "Maxim 50 caractere"),
  language: z.enum(["RO", "EN", "ES", "DE", "FR", "IT"]),
  currency: z.enum(["USD", "EUR", "GBP", "RON", "CHF", "JPY"]),
  theme: z.enum(["DARK", "LIGHT", "AMOLED"]),
  timezone: z.string().min(1, "Selectează un fus orar"),
});

export const tradingRulesSchema = z.object({
  maxDailyLossPct: z
    .number()
    .min(0.1, "Minim 0.1%")
    .max(100, "Maxim 100%")
    .optional(),
  maxDrawdownPct: z
    .number()
    .min(0.1, "Minim 0.1%")
    .max(100, "Maxim 100%")
    .optional(),
  maxTradesPerDay: z
    .number()
    .int("Trebuie să fie număr întreg")
    .min(1, "Minim 1")
    .max(50, "Maxim 50"),
  defaultRiskPct: z
    .number()
    .min(0.1, "Minim 0.1%")
    .max(10, "Maxim 10%"),
  noTradeDays: z.array(z.number().int().min(0).max(6)),
  noTradeHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format HH:MM")
    .optional()
    .nullable(),
  noTradeHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format HH:MM")
    .optional()
    .nullable(),
});

export const tradingAccountSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu").max(50),
  type: z.enum(["DEMO", "CHALLENGE", "LIVE"]),
  broker: z.string().optional(),
  accountNumber: z.string().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "RON", "CHF", "JPY"]),
  balance: z.number().min(0, "Balanța nu poate fi negativă"),
  leverage: z.number().int().min(1).max(2000),
  maxDailyLossPct: z.number().min(0.1).max(100).optional(),
  maxDrawdownPct: z.number().min(0.1).max(100).optional(),
});

export const tradeSchema = z.object({
  accountId: z.string().cuid("ID cont invalid"),
  symbol: z.string().min(2, "Minim 2 caractere").max(20).toUpperCase(),
  instrumentType: z.enum([
    "FOREX", "CRYPTO", "METALS", "INDICES", "COMMODITIES", "STOCKS", "CFD",
  ]),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().positive("Prețul de intrare trebuie să fie pozitiv"),
  entryTime: z.string().min(1, "Dată/oră invalidă"),
  exitPrice: z.number().positive().optional().nullable(),
  exitTime: z.string().optional().nullable(),
  lotSize: z.number().positive("Lotul trebuie să fie pozitiv"),
  stopLoss: z.number().positive().optional().nullable(),
  takeProfit: z.number().positive().optional().nullable(),
  pnlMoney: z.number().optional().nullable(),
  commission: z.number().default(0),
  swap: z.number().default(0),
  setupType: z
    .enum([
      "ORDER_BLOCK", "FAIR_VALUE_GAP", "LIQUIDITY_SWEEP", "BOS", "CHOCH",
      "BREAKER", "MITIGATION", "REJECTION", "TREND_FOLLOW", "SCALP", "OTHER",
    ])
    .optional()
    .nullable(),
  killzone: z.enum(["LONDON", "NEW_YORK", "ASIAN", "LONDON_CLOSE"]).optional().nullable(),
  timeframe: z
    .enum(["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"])
    .optional()
    .nullable(),
  sessionType: z.enum(["ASIAN", "LONDON", "NEW_YORK", "OVERLAP"]).optional().nullable(),
  status: z.enum(["OPEN", "CLOSED", "CANCELLED"]).default("CLOSED"),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional().nullable(),
});

export const journalEntrySchema = z.object({
  preEmotionalState: z
    .enum(["CALM", "CONFIDENT", "ANXIOUS", "FEARFUL", "GREEDY", "REVENGE", "FOMO", "NEUTRAL"])
    .optional()
    .nullable(),
  preNotes: z.string().max(2000).optional().nullable(),
  preConfidence: z.number().int().min(1).max(10).optional().nullable(),
  postEmotionalState: z
    .enum(["CALM", "CONFIDENT", "ANXIOUS", "FEARFUL", "GREEDY", "REVENGE", "FOMO", "NEUTRAL"])
    .optional()
    .nullable(),
  postNotes: z.string().max(2000).optional().nullable(),
  postMistakeTypes: z
    .array(
      z.enum([
        "OVERTRADING", "REVENGE_TRADE", "FOMO_ENTRY", "MOVED_SL", "NO_SL",
        "WRONG_SIZE", "EARLY_EXIT", "LATE_ENTRY", "IGNORED_RULES", "OTHER",
      ])
    )
    .default([]),
  postLessons: z.string().max(2000).optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type TradingRulesInput = z.infer<typeof tradingRulesSchema>;
export type TradingAccountInput = z.infer<typeof tradingAccountSchema>;
export type TradeInput = z.infer<typeof tradeSchema>;
export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
