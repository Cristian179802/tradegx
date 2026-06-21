// @tradegx/ui-tokens — design tokens, o singură sursă pentru web + mobile.
// Identitatea vizuală premium TradeGx (dark, indigo/violet, emerald/rose).

export const colors = {
  bg: "#09090b",          // zinc-950
  surface: "#18181c",     // card
  border: "#27272a",      // zinc-800
  text: "#e4e4e7",        // zinc-200
  textMuted: "#71717a",   // zinc-500
  primary: "#6366f1",     // indigo-500
  primaryAlt: "#8b5cf6",  // violet-500
  bull: "#10b981",        // emerald-500 (profit)
  bear: "#f43f5e",        // rose-500 (loss)
  warn: "#f59e0b",        // amber-500
  info: "#38bdf8",        // sky-400
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, full: 9999,
} as const;

export const fontSize = {
  xs: 11, sm: 13, base: 15, lg: 18, xl: 22, "2xl": 28,
} as const;

export type Colors = typeof colors;
