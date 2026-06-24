// Tema premium TradeGx — o singură sursă de adevăr vizuală pentru app-ul nativ.
// Extinde @tradegx/ui-tokens cu gradiente, umbre și tipografie pentru un look top-tier.
import { colors as base, spacing, radius, fontSize } from "@tradegx/ui-tokens";

export const colors = {
  ...base,
  // Suprafețe stratificate (depth premium)
  bgElevated: "#0e0e11",
  surfaceAlt: "#1f1f24",
  surfaceHi: "#26262c",
  borderSubtle: "#1c1c20",
  // Accente
  primarySoft: "rgba(99,102,241,0.14)",
  bullSoft: "rgba(16,185,129,0.14)",
  bearSoft: "rgba(244,63,94,0.14)",
  warnSoft: "rgba(245,158,11,0.14)",
  white: "#fafafa",
  black: "#000000",
} as const;

// Gradiente (folosite cu expo-linear-gradient)
export const gradients = {
  brand: ["#6366f1", "#8b5cf6"] as const,
  bull: ["#059669", "#10b981"] as const,
  bear: ["#e11d48", "#f43f5e"] as const,
  surface: ["#18181c", "#121215"] as const,
  glow: ["rgba(99,102,241,0.25)", "rgba(139,92,246,0.05)"] as const,
};

// Umbre (elevation premium)
export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

// Tipografie — scară premium cu greutăți și spacing
export const font = {
  size: { ...fontSize, "3xl": 34, "4xl": 42 },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
  },
};

export { spacing, radius };

export type ThemeColor = keyof typeof colors;
