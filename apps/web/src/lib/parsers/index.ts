// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ParsedTrade {
  brokerTradeId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
  pnlMoney: number;
  commission: number;
  swap: number;
  instrumentType: string;
}

export interface ParseResult {
  trades: ParsedTrade[];
  format: string;
  warnings: string[];
}

// ─── Instrument type detection ─────────────────────────────────────────────────

export function detectInstrumentType(symbol: string): string {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^(BTC|ETH|SOL|BNB|ADA|XRP|DOGE|DOT|AVAX|MATIC|LINK|LTC|BCH).*(USD|EUR|BTC|USDT)?$/.test(s)) return "CRYPTO";
  if (/^(XAU|XAG|XPT|GOLD|SILVER)/.test(s)) return "METALS";
  if (/^(US30|US500|NAS100|UK100|DAX|GER40|FRA40|ESP35|JP225|AU200|HK50|FTSE|SPX|NDX)/.test(s)) return "INDICES";
  if (/^(OIL|BRENT|WTI|USOIL|UKOIL|NGAS|NATGAS|COCOA|COFFEE|SUGAR|WHEAT|CORN|SOYB)/.test(s)) return "COMMODITIES";
  if (/^[A-Z]{6}$/.test(s) || /^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY|NOK|SEK|DKK|HKD|SGD|ZAR|MXN|TRY|PLN|CZK|HUF)/.test(s)) return "FOREX";
  if (/^[A-Z]{1,5}$/.test(s)) return "STOCKS";
  return "CFD";
}

// ─── Auto-detect format and parse ─────────────────────────────────────────────

export function autoDetectAndParse(content: string, filename: string): ParseResult {
  const lower = filename.toLowerCase();
  const trimmed = content.trimStart();

  // MT4/MT5 HTML Detailed Statement
  if (lower.endsWith(".html") || lower.endsWith(".htm") || trimmed.startsWith("<")) {
    return parseMT4HTML(content);
  }

  // cTrader CSV — has distinctive headers
  if (
    content.includes("Position ID") ||
    content.includes("PositionId") ||
    content.includes("Closing Direction") ||
    content.includes("Entry Direction")
  ) {
    return parseCTraderCSV(content);
  }

  // MT4/MT5 CSV — default
  return parseMT4CSV(content);
}

// ─── MT4 date parser ───────────────────────────────────────────────────────────

function parseMT4Date(raw: string): Date | null {
  if (!raw) return null;
  // "2024.01.15 09:30" or "2024.01.15 09:30:00"
  const m = raw.trim().match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}Z`);
  // ISO date fallback
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Strip HTML tags ───────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

// ─── MT4 / MT5 HTML Detailed Statement parser ─────────────────────────────────

export function parseMT4HTML(html: string): ParseResult {
  const trades: ParsedTrade[] = [];
  const warnings: string[] = [];

  // Extract all <tr> blocks
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const row = rowMatch[1];
    // Extract <td> cells
    const cells: string[] = [];
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellPattern.exec(row)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    // ── MT4 format (14 columns) ──────────────────────────────────────────────
    // Ticket | Open Time | Type | Size | Item | Price | S/L | T/P | Close Time | Close Price | Commission | Taxes | Swap | Profit
    if (cells.length >= 14) {
      const [ticket, openTime, type, size, symbol, openPrice, sl, tp, closeTime, closePrice, commission, , swap, profit] = cells;
      const typeNorm = (type ?? "").toLowerCase().trim();
      if (typeNorm !== "buy" && typeNorm !== "sell") continue;
      if (!closeTime?.trim()) continue;

      const entryTime = parseMT4Date(openTime);
      const exitTime = parseMT4Date(closeTime);
      if (!entryTime || !exitTime) { warnings.push(`Dată invalidă pentru ticket ${ticket}`); continue; }

      const sym = (symbol ?? "").toUpperCase().replace(/\s/g, "");
      if (!sym) continue;

      trades.push({
        brokerTradeId: ticket?.trim() || `mt4_${entryTime.getTime()}`,
        symbol: sym,
        direction: typeNorm === "buy" ? "BUY" : "SELL",
        entryTime,
        exitTime,
        entryPrice: parseFloat(openPrice) || 0,
        exitPrice: parseFloat(closePrice) || 0,
        lotSize: parseFloat(size) || 0,
        stopLoss: parseFloat(sl) || undefined,
        takeProfit: parseFloat(tp) || undefined,
        pnlMoney: parseFloat(profit) || 0,
        commission: parseFloat(commission) || 0,
        swap: parseFloat(swap) || 0,
        instrumentType: detectInstrumentType(sym),
      });
    }

    // ── MT5 format (deals — 14+ columns) ────────────────────────────────────
    // Deal | Time | Symbol | Type | Direction | Volume | Price | Order | Commission | Fee | Swap | Profit
    else if (cells.length >= 12) {
      const [deal, time, symbol, type, direction, volume, price, , commission, , swap, profit] = cells;
      if (!symbol || symbol.trim() === "") continue;
      const dirNorm = (direction ?? "").toLowerCase();
      const typeNorm = (type ?? "").toLowerCase();
      // only "out" or "in/out" deals represent closed trades
      if (!dirNorm.includes("out") && typeNorm !== "balance") continue;
      const exitTime = parseMT4Date(time);
      if (!exitTime) continue;
      const sym = symbol.toUpperCase().replace(/\s/g, "");
      // MT5 deals don't carry entry price directly — use price as both (best effort)
      const px = parseFloat(price) || 0;
      trades.push({
        brokerTradeId: `mt5_${deal?.trim() || exitTime.getTime()}`,
        symbol: sym,
        direction: dirNorm.includes("buy") || dirNorm === "out" ? "BUY" : "SELL",
        entryTime: exitTime, // MT5 deal-only view — entry ≈ exit (no pairing)
        exitTime,
        entryPrice: px,
        exitPrice: px,
        lotSize: parseFloat(volume) || 0,
        pnlMoney: parseFloat(profit) || 0,
        commission: parseFloat(commission) || 0,
        swap: parseFloat(swap) || 0,
        instrumentType: detectInstrumentType(sym),
      });
    }
  }

  return {
    trades,
    format: "MT4/MT5 HTML Detailed Statement",
    warnings,
  };
}

// ─── MT4 / MT5 CSV parser ─────────────────────────────────────────────────────

export function parseMT4CSV(csv: string): ParseResult {
  const trades: ParsedTrade[] = [];
  const warnings: string[] = [];
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Find the header line
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("ticket") || lower.includes("open time") || lower.includes("symbol")) {
      startIdx = i + 1;
      break;
    }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 14) continue;

    const [ticket, openTime, type, size, symbol, openPrice, sl, tp, closeTime, closePrice, commission, , swap, profit] = cells;
    const typeNorm = (type ?? "").toLowerCase().trim();
    if (typeNorm !== "buy" && typeNorm !== "sell") continue;
    if (!closeTime?.trim() || closeTime.trim() === "") continue;

    const entryTime = parseMT4Date(openTime);
    const exitTime = parseMT4Date(closeTime);
    if (!entryTime || !exitTime) { warnings.push(`Dată invalidă linia ${i + 1}`); continue; }

    const sym = (symbol ?? "").toUpperCase().replace(/\s/g, "");
    if (!sym) continue;

    trades.push({
      brokerTradeId: ticket?.trim() || `mt4csv_${i}`,
      symbol: sym,
      direction: typeNorm === "buy" ? "BUY" : "SELL",
      entryTime,
      exitTime,
      entryPrice: parseFloat(openPrice) || 0,
      exitPrice: parseFloat(closePrice) || 0,
      lotSize: parseFloat(size) || 0,
      stopLoss: parseFloat(sl) || undefined,
      takeProfit: parseFloat(tp) || undefined,
      pnlMoney: parseFloat(profit) || 0,
      commission: parseFloat(commission) || 0,
      swap: parseFloat(swap) || 0,
      instrumentType: detectInstrumentType(sym),
    });
  }

  return { trades, format: "MT4/MT5 CSV", warnings };
}

// ─── cTrader CSV parser ────────────────────────────────────────────────────────

export function parseCTraderCSV(csv: string): ParseResult {
  const trades: ParsedTrade[] = [];
  const warnings: string[] = [];
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Find header
  let headers: string[] = [];
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("position") || lower.includes("symbol") || lower.includes("direction")) {
      headers = parseCSVLine(lines[i]).map((h) => h.toLowerCase().trim());
      startIdx = i + 1;
      break;
    }
  }

  // Column indices
  const col = (names: string[]) => names.map((n) => headers.findIndex((h) => h.includes(n))).find((i) => i >= 0) ?? -1;
  const idxId = col(["position id", "positionid", "trade id"]);
  const idxSymbol = col(["symbol", "instrument"]);
  const idxDir = col(["direction", "side", "type"]);
  const idxVol = col(["volume", "size", "lots", "quantity"]);
  const idxEntryPrice = col(["entry price", "open price"]);
  const idxEntryTime = col(["entry time", "open time", "open date"]);
  const idxExitPrice = col(["exit price", "close price", "closing price"]);
  const idxExitTime = col(["exit time", "close time", "closing time", "close date"]);
  const idxGross = col(["gross p&l", "gross profit", "profit", "p&l"]);
  const idxNet = col(["net p&l", "net profit"]);
  const idxComm = col(["commission"]);
  const idxSwap = col(["swap", "rollover"]);
  const idxSL = col(["stop loss", "sl"]);
  const idxTP = col(["take profit", "tp"]);

  const g = (cells: string[], idx: number) => (idx >= 0 ? cells[idx] ?? "" : "");

  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 4) continue;

    const sym = g(cells, idxSymbol).toUpperCase().replace(/\s/g, "");
    const dirRaw = g(cells, idxDir).toLowerCase();
    const dir = dirRaw.includes("buy") || dirRaw === "long" ? "BUY" : dirRaw.includes("sell") || dirRaw === "short" ? "SELL" : null;
    if (!dir || !sym) continue;

    const entryTime = parseMT4Date(g(cells, idxEntryTime)) ?? parseISODate(g(cells, idxEntryTime));
    const exitTime = parseMT4Date(g(cells, idxExitTime)) ?? parseISODate(g(cells, idxExitTime));
    if (!entryTime || !exitTime) { warnings.push(`Dată invalidă linia ${i + 1}`); continue; }

    const pnl = parseFloat(g(cells, idxNet) || g(cells, idxGross)) || 0;
    const commission = parseFloat(g(cells, idxComm)) || 0;

    trades.push({
      brokerTradeId: g(cells, idxId) || `ct_${i}`,
      symbol: sym,
      direction: dir,
      entryTime,
      exitTime,
      entryPrice: parseFloat(g(cells, idxEntryPrice)) || 0,
      exitPrice: parseFloat(g(cells, idxExitPrice)) || 0,
      lotSize: parseFloat(g(cells, idxVol)) || 0,
      stopLoss: parseFloat(g(cells, idxSL)) || undefined,
      takeProfit: parseFloat(g(cells, idxTP)) || undefined,
      pnlMoney: pnl,
      commission,
      swap: parseFloat(g(cells, idxSwap)) || 0,
      instrumentType: detectInstrumentType(sym),
    });
  }

  return { trades, format: "cTrader CSV", warnings };
}

// ─── CSV line parser (handles quoted fields) ──────────────────────────────────

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if ((ch === "," || ch === "\t" || ch === ";") && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

function parseISODate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}
