// @tradegx/ui-tokens — design tokens, o singură sursă pentru web + mobile.
//
// „Institutional Futurism": ramp neutru RECE, un singur accent decorativ, iar
// verde/roșu DOAR pentru semantica P&L — niciodată ca decor.
//
// ATENȚIE. Valorile de aici trebuie să rămână identice cu variabilele CSS din
// `apps/web/src/app/globals.css`. Au divergat o dată — fișierul ăsta avea o
// paletă mai veche (`#09090b`, indigo `#6366f1`) în timp ce web-ul trecuse pe
// ramp-ul rece și pe `#6d75f6`. Rezultatul ar fi fost o aplicație nativă care
// arată ca alt produs decât site-ul, exact lucrul pe care tokenii ar trebui
// să-l prevină.
//
// Web-ul citește variabilele CSS direct (Tailwind + `var(--s-2)`); nativul
// citește obiectele de aici. Aceleași cifre, două limbaje.

/** Suprafețe: fiecare nivel e un pas de lumină, nu o nuanță aleasă separat. */
export const surface = {
  s0: "#07080c", // canvas / fundal ecran
  s1: "#0b0d13", // bandă de secțiune
  s2: "#101319", // card
  s3: "#161a22", // card ridicat / apăsat
  s4: "#1d222c", // input / control
} as const;

/** Hairline: lumina care definește marginea unei suprafețe. */
export const line = {
  l1: "rgba(255,255,255,0.055)",
  l2: "rgba(255,255,255,0.09)",
  top: "rgba(255,255,255,0.14)",
} as const;

/** Cerneală: patru nivele, contrast verificat pe `s1`. */
export const ink = {
  i1: "#f2f4f8", // titluri
  i2: "#c3c9d6", // corp
  i3: "#8b93a5", // secundar
  i4: "#7d8597", // etichete / meta
} as const;

/**
 * Accent unic de brand. Discret intenționat: apare pe muchia fiecărei
 * suprafețe, iar la intensitate mare se adună și tot ecranul pare aprins.
 */
export const accent = {
  base: "#6d75f6",
  soft: "rgba(109,117,246,0.11)",
  line: "rgba(109,117,246,0.22)",
} as const;

/** Semantic: DOAR pentru date P&L. Niciodată decorativ. */
export const pnl = {
  gain: "#34d399",
  loss: "#fb7185",
} as const;

/** Stări, în afara semanticii P&L. */
export const state = {
  warn: "#fbbf24",
  info: "#60d6ff",
  violet: "#a78bfa",
} as const;

/**
 * Paletă plată, pentru locurile care vor un singur obiect.
 * Numele vechi rămân ca alias ca să nu spargem importurile existente.
 */
export const colors = {
  bg: surface.s0,
  surface: surface.s2,
  surfaceRaised: surface.s3,
  control: surface.s4,
  border: line.l1,
  borderStrong: line.l2,
  text: ink.i1,
  textBody: ink.i2,
  textMuted: ink.i3,
  textFaint: ink.i4,
  primary: accent.base,
  primaryAlt: state.violet,
  bull: pnl.gain,
  bear: pnl.loss,
  warn: state.warn,
  info: state.info,
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, full: 9999,
} as const;

/**
 * Scara tipografică. Pe telefon corpul stă la 15: sub 15 iOS/Android
 * micșorează lizibilitatea sub pragul confortabil la lumină puternică —
 * adică exact contextul în care cineva verifică o poziție.
 */
export const fontSize = {
  xs: 11, sm: 13, base: 15, lg: 18, xl: 22, "2xl": 28, "3xl": 34,
} as const;

/** Tracking optic: titlurile mari se string, etichetele mici se desfac. */
export const tracking = {
  tight: -0.6,
  normal: 0,
  wide: 0.8,
  wider: 1.4,
} as const;

/**
 * Durate de animație, ms. Tot ce e sub 120 se citește ca instantaneu; tot ce
 * trece de 400 se simte lent pe un ecran ținut în mână.
 */
export const duration = {
  instant: 120,
  fast: 180,
  normal: 260,
  slow: 420,
} as const;

export type Surface = typeof surface;
export type Ink = typeof ink;
export type Colors = typeof colors;
