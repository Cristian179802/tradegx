// ── Agregare P&L pe zi a săptămânii × oră ────────────────────────────────────
//
// Răspunde la o întrebare pe care traderii și-o pun constant și pe care un
// tabel plat o ascunde: „în ce ferestre de timp chiar câștig?"
//
// Un grafic 2D te obligă să alegi o axă (fie ziua, fie ora). Corelația reală e
// bidimensională — luni la 9 dimineața poate fi excelent, iar vineri la aceeași
// oră dezastruos. De asta merită a treia dimensiune aici: nu ca efect, ci
// pentru că datele chiar au trei axe.

export interface PnlCell {
  /** 0 = luni … 6 = duminică (nu getDay(), care începe duminica). */
  day: number;
  /** 0-23, ora de deschidere a poziției. */
  hour: number;
  pnl: number;
  count: number;
  wins: number;
}

export interface PnlSpace {
  cells: PnlCell[];
  /** Cea mai mare valoare absolută — pentru normalizarea înălțimilor. */
  maxAbsPnl: number;
  totalTrades: number;
  /** Fereastra cu cel mai bun P&L cumulat; null dacă nu există date. */
  best: PnlCell | null;
  worst: PnlCell | null;
}

export function buildPnlSpace(
  trades: { entryTime: Date | string; pnlMoney: number | null }[]
): PnlSpace {
  const map = new Map<string, PnlCell>();

  for (const t of trades) {
    const pnl = t.pnlMoney;
    if (pnl === null || !Number.isFinite(Number(pnl))) continue;

    const d = t.entryTime instanceof Date ? t.entryTime : new Date(t.entryTime);
    if (Number.isNaN(d.getTime())) continue;

    // getDay(): 0=duminică. Rotim ca luni să fie 0 — cum citește un trader
    // săptămâna, și cum se aliniază cu sesiunile de piață.
    const day = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    const key = `${day}:${hour}`;

    let cell = map.get(key);
    if (!cell) {
      cell = { day, hour, pnl: 0, count: 0, wins: 0 };
      map.set(key, cell);
    }
    const v = Number(pnl);
    cell.pnl += v;
    cell.count += 1;
    if (v > 0) cell.wins += 1;
  }

  const cells = [...map.values()];
  let maxAbsPnl = 0;
  let best: PnlCell | null = null;
  let worst: PnlCell | null = null;

  for (const c of cells) {
    const abs = Math.abs(c.pnl);
    if (abs > maxAbsPnl) maxAbsPnl = abs;
    if (best === null || c.pnl > best.pnl) best = c;
    if (worst === null || c.pnl < worst.pnl) worst = c;
  }

  return {
    cells,
    maxAbsPnl,
    totalTrades: cells.reduce((s, c) => s + c.count, 0),
    best,
    worst,
  };
}
