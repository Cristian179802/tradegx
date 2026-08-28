// ── Desene manuale pe grafic ─────────────────────────────────────────────────
//
// Linii de trend, linii orizontale, dreptunghiuri. Partea de matematică și de
// stocare stă aici, separat de componentă: se poate testa fără DOM, iar
// componenta rămâne despre desenare și evenimente.
//
// Ancorarea se face în (timp, preț), NU în pixeli. Un desen legat de pixeli ar
// aluneca la prima derulare sau redimensionare — ar arăta corect exact o dată,
// în momentul în care l-ai tras.

export type DrawingTool = "none" | "trend" | "hline" | "rect";

export interface Point {
  /** Secunde Unix, ca lumânările. */
  t: number;
  price: number;
}

export interface Drawing {
  id: string;
  type: Exclude<DrawingTool, "none">;
  p1: Point;
  /** Lipsește la linia orizontală, care e definită de un singur punct. */
  p2?: Point;
  color: string;
}

/** Cheia de stocare: desenele țin de instrument ȘI de interval. */
export function drawingsKey(symbol: string, timeframe: string): string {
  return `charts:drawings:${symbol}:${timeframe}`;
}

export function loadDrawings(symbol: string, timeframe: string): Drawing[] {
  try {
    const raw = localStorage.getItem(drawingsKey(symbol, timeframe));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isDrawing) : [];
  } catch {
    return [];
  }
}

export function saveDrawings(symbol: string, timeframe: string, items: Drawing[]): void {
  try {
    if (items.length === 0) localStorage.removeItem(drawingsKey(symbol, timeframe));
    else localStorage.setItem(drawingsKey(symbol, timeframe), JSON.stringify(items));
  } catch {
    /* stocare plină sau indisponibilă — desenul rămâne doar în sesiunea curentă */
  }
}

/** Respinge ce e stricat sau rămas de la o versiune veche. */
function isDrawing(v: unknown): v is Drawing {
  if (!v || typeof v !== "object") return false;
  const d = v as Partial<Drawing>;
  const okPoint = (p: unknown): p is Point =>
    !!p && typeof p === "object" &&
    Number.isFinite((p as Point).t) && Number.isFinite((p as Point).price);
  if (!d.id || typeof d.color !== "string") return false;
  if (d.type !== "trend" && d.type !== "hline" && d.type !== "rect") return false;
  if (!okPoint(d.p1)) return false;
  if (d.type !== "hline" && !okPoint(d.p2)) return false;
  return true;
}

/** Distanța de la un punct la un segment, în pixeli. */
export function distToSegment(
  px: number, py: number, x1: number, y1: number, x2: number, y2: number
): number {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  // Segment degenerat (cele două capete în același loc): distanța la punct.
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Ce desen e sub cursor.
 *
 * `toXY` întoarce coordonatele în pixeli ale unui punct ancorat, sau null dacă e
 * în afara zonei vizibile. Testul se face în pixeli, nu în preț: un prag în preț
 * ar însemna o toleranță uriașă pe un grafic depărtat și una imposibil de nimerit
 * pe unul apropiat.
 */
export function hitTest(
  items: Drawing[],
  x: number, y: number,
  toXY: (p: Point) => { x: number; y: number } | null,
  tolerance = 6
): Drawing | null {
  // De la ultimul spre primul: ce ai desenat mai recent e deasupra.
  for (let i = items.length - 1; i >= 0; i--) {
    const d = items[i];
    const a = toXY(d.p1);
    if (!a) continue;

    if (d.type === "hline") {
      if (Math.abs(y - a.y) <= tolerance) return d;
      continue;
    }

    const b = d.p2 ? toXY(d.p2) : null;
    if (!b) continue;

    if (d.type === "trend") {
      if (distToSegment(x, y, a.x, a.y, b.x, b.y) <= tolerance) return d;
      continue;
    }

    // Dreptunghi: se prinde de MARGINI, nu de interior. Umplerea e transparentă
    // și acoperă lumânări; dacă ar fi și zonă de clic, n-ai mai putea selecta
    // nimic din ce e sub ea.
    const left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
    const top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
    const nearV = (x >= left - tolerance && x <= right + tolerance) &&
      (Math.abs(y - top) <= tolerance || Math.abs(y - bottom) <= tolerance);
    const nearH = (y >= top - tolerance && y <= bottom + tolerance) &&
      (Math.abs(x - left) <= tolerance || Math.abs(x - right) <= tolerance);
    if (nearV || nearH) return d;
  }
  return null;
}

export function newId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
