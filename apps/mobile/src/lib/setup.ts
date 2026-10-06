import { tr } from "./i18n";

// ── Tipurile de setup ────────────────────────────────────────────────────────
//
// Aceleași etichete ca pe site (`SETUP_LABELS` din pagina tranzacției): termeni
// SMC, pe care și traderii români îi spun în engleză. Doar „Altul" se traduce.
//
// UN SINGUR LOC, fiindcă înainte erau trei: detaliul tranzacției avea etichete,
// lista avea un câmp care nu venea niciodată de la server, iar analiza afișa
// codul brut — „LIQUIDITY_SWEEP" — chiar în dreptul cifrelor.

const ETICHETE: Record<string, string> = {
  ORDER_BLOCK: "Order Block",
  FAIR_VALUE_GAP: "Fair Value Gap",
  LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure",
  CHOCH: "Change of Character",
  BREAKER: "Breaker",
  MITIGATION: "Mitigation",
  REJECTION: "Rejection",
  TREND_FOLLOW: "Trend follow",
  SCALP: "Scalp",
  OTHER: "Altul",
};

/** Eticheta unui `setupType`; „—" când lipsește, codul brut când e necunoscut. */
export function etichetaSetup(cod: string | null | undefined): string {
  if (!cod) return "—";
  const e = ETICHETE[cod];
  // `tr` aici, nu doar în <Text>: eticheta ajunge și în PDF și în etichetele
  // pentru cititorul de ecran, care nu trec prin <Text>.
  return e ? tr(e) : cod;
}
