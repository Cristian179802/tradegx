// ── Indicatori tehnici ───────────────────────────────────────────────────────
//
// Matematică pură, fără dependențe și fără atingere de DOM: se poate testa
// direct și se poate refolosi la backtesting.
//
// Meniul de indicatoare al paginii trimitea ID-uri TradingView
// („MAExp@tv-basicstudies"), care funcționează DOAR în widgetul lor. Pentru
// graficul propriu ne trebuie valorile calculate la noi.
//
// Convenție: fiecare funcție întoarce un vector de aceeași lungime cu intrarea,
// cu `null` pe pozițiile unde indicatorul nu are încă destule date. Așa indicii
// rămân aliniați cu lumânările și nu trebuie decalați manual la desenare —
// sursă clasică de grafice deplasate cu câteva bare.

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  v?: number;
}

type Series = (number | null)[];

/** Medie mobilă simplă. */
export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Medie mobilă exponențială.
 *
 * Prima valoare e SMA pe primele `period` bare, nu prețul de la index 0 — altfel
 * EMA pornește dintr-un punct arbitrar și are nevoie de zeci de bare ca să se
 * așeze, ceea ce se vede ca o coadă falsă la începutul graficului.
 */
export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Benzi Bollinger: mijloc = SMA, benzile la `mult` abateri standard. */
export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: Series = new Array(values.length).fill(null);
  const lower: Series = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const m = mid[i];
    if (m == null) continue;
    let acc = 0;
    for (let j = i - period + 1; j <= i; j++) acc += (values[j] - m) ** 2;
    // Abatere standard de POPULAȚIE (împărțim la period, nu la period-1):
    // e convenția folosită de Bollinger și de toate platformele.
    const sd = Math.sqrt(acc / period);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { mid, upper, lower };
}

/**
 * VWAP ancorat pe sesiune (zi UTC).
 *
 * Se resetează la fiecare zi nouă. Un VWAP calculat continuu de la începutul
 * istoricului e o linie aproape plată, complet inutilă pentru intraday — de
 * aceea ancorarea contează mai mult decât formula.
 *
 * Fără volum (valutele de la Yahoo nu îl au), întoarce tot null: un VWAP cu
 * volum presupus egal nu e VWAP, e o medie a prețului tipic, și ar induce în
 * eroare pe cineva care se bazează pe el.
 */
export function vwap(bars: Bar[]): Series {
  const out: Series = new Array(bars.length).fill(null);
  let day = "";
  let pv = 0;
  let vol = 0;

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const v = b.v ?? 0;
    const d = new Date(b.time * 1000).toISOString().slice(0, 10);
    if (d !== day) { day = d; pv = 0; vol = 0; }
    const typical = (b.high + b.low + b.close) / 3;
    pv += typical * v;
    vol += v;
    out[i] = vol > 0 ? pv / vol : null;
  }
  return out;
}

/** RSI Wilder, 0–100. */
export function rsi(values: number[], period = 14): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);

  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    // Netezire Wilder: medie exponențială cu factor 1/period.
    gain = (gain * (period - 1) + (d > 0 ? d : 0)) / period;
    loss = (loss * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

/** MACD: linia, semnalul și histograma. */
export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const eFast = ema(values, fast);
  const eSlow = ema(values, slow);
  const line: Series = values.map((_, i) =>
    eFast[i] != null && eSlow[i] != null ? (eFast[i] as number) - (eSlow[i] as number) : null
  );

  // Semnalul e EMA peste linia MACD, dar EMA nu știe de null-uri. Calculăm pe
  // segmentul valid și îl punem înapoi la poziția corectă.
  const start = line.findIndex((v) => v != null);
  const sig: Series = new Array(values.length).fill(null);
  if (start >= 0) {
    const dense = line.slice(start) as number[];
    const s = ema(dense, signal);
    for (let i = 0; i < s.length; i++) sig[start + i] = s[i];
  }

  const hist: Series = values.map((_, i) =>
    line[i] != null && sig[i] != null ? (line[i] as number) - (sig[i] as number) : null
  );
  return { line, signal: sig, hist };
}

/** ATR Wilder — util mai ales pentru dimensionarea stopului. */
export function atr(bars: Bar[], period = 14): Series {
  const out: Series = new Array(bars.length).fill(null);
  if (bars.length <= period) return out;

  const tr: number[] = bars.map((b, i) => {
    if (i === 0) return b.high - b.low;
    const pc = bars[i - 1].close;
    return Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc));
  });

  let acc = tr.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = acc;
  for (let i = period + 1; i < bars.length; i++) {
    acc = (acc * (period - 1) + tr[i]) / period;
    out[i] = acc;
  }
  return out;
}

/**
 * Heikin-Ashi: lumânări netezite, care fac trendul mult mai vizibil.
 *
 * ATENȚIE la citire: prețurile rezultate NU sunt prețuri reale de piață, ci
 * medii. Nu se folosesc pentru a citi un nivel de intrare — doar pentru direcție.
 */
export function heikinAshi(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const close = (b.open + b.high + b.low + b.close) / 4;
    const open = i === 0 ? (b.open + b.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2;
    out.push({
      time: b.time,
      open,
      close,
      high: Math.max(b.high, open, close),
      low: Math.min(b.low, open, close),
      v: b.v,
    });
  }
  return out;
}
