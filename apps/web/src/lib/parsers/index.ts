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

// ─── Parse with an explicit platform hint (user's dialog choice wins) ─────────

export function parseByPlatform(platform: string, content: string, filename: string): ParseResult {
  const trimmed = content.trimStart();
  // HTML statements are self-describing regardless of the picked platform
  if (filename.toLowerCase().endsWith(".html") || filename.toLowerCase().endsWith(".htm") || trimmed.startsWith("<")) {
    return parseMT4HTML(content);
  }
  switch (platform) {
    case "mt4":
    case "mt5": {
      const r = parseMT4CSV(content);
      return r.trades.length > 0 ? r : autoDetectAndParse(content, filename);
    }
    case "ctrader":
      return parseCTraderCSV(content);
    case "tradelocker":
      return parseTradeLockerCSV(content);
    case "dxtrade":
      return parseDXtradeCSV(content);
    default:
      return autoDetectAndParse(content, filename);
  }
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

  // DXtrade (DevExperts) CSV — fill/order blotter with distinctive headers
  const low = content.toLowerCase();
  if (
    low.includes("filled volume") ||
    low.includes("fill price") ||
    (low.includes("date and time") && low.includes("side"))
  ) {
    return parseDXtradeCSV(content);
  }

  // TradeLocker CSV — filename hint (no confirmed unique header signature)
  if (lower.includes("tradelocker")) {
    return parseTradeLockerCSV(content);
  }

  // MT4/MT5 CSV — default; if it yields nothing, fall back to the universal
  // header-driven engine so unrecognized broker exports still import.
  const mt4Result = parseMT4CSV(content);
  if (mt4Result.trades.length > 0) return mt4Result;

  const universal = parseUniversalBrokerCSV(content, "CSV broker");
  if (universal.trades.length > 0) return universal;

  return mt4Result;
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

// ─── Universal broker CSV engine (TradeLocker / DXtrade / generic) ────────────
//
// Header-driven, fuzzy column matching so we handle multiple broker export
// dialects without one hand-written parser per broker. Two modes, auto-detected:
//
//   PAIRED  — the export has distinct entry AND exit price+time columns
//             (closed-positions report, e.g. TradeLocker "Export account
//             History"). Each row is one completed round-trip trade.
//
//   BLOTTER — the export is a single-timestamp fill/order log (e.g. DXtrade:
//             Date and Time · Side · Fill Price · Filled Volume). Fills are
//             paired FIFO per symbol into round-trip trades. Money P&L is taken
//             from a realized-P&L column when present; otherwise it is derived
//             from price difference × volume and a warning is surfaced so the
//             import UI can flag that per-point value may need adjustment.

function buildFuzzyCols(headers: string[]) {
  const col = (names: string[]) =>
    names.map((n) => headers.findIndex((h) => h === n)).find((i) => i >= 0) ??
    names.map((n) => headers.findIndex((h) => h.includes(n))).find((i) => i >= 0) ??
    -1;
  return {
    id: col(["position id", "positionid", "order id", "orderid", "trade id", "deal id", "id", "ticket"]),
    symbol: col(["symbol", "instrument", "market", "ticker", "product"]),
    dir: col(["direction", "side", "type", "b/s", "action"]),
    vol: col(["filled volume", "volume", "size", "lots", "quantity", "qty", "amount", "units"]),
    entryPrice: col(["entry price", "open price", "opening price", "avg entry", "entry"]),
    entryTime: col(["entry time", "open time", "opening time", "open date", "entry date"]),
    exitPrice: col(["exit price", "close price", "closing price", "avg exit", "exit"]),
    exitTime: col(["exit time", "close time", "closing time", "close date", "exit date"]),
    price: col(["fill price", "price", "avg price", "average price", "executed price"]),
    time: col(["date and time", "date/time", "datetime", "time", "date", "timestamp"]),
    pnl: col(["net p&l", "net profit", "realized p&l", "realized pnl", "gross p&l", "profit", "p&l", "pnl", "p/l"]),
    comm: col(["commission", "comm", "fee", "fees"]),
    swap: col(["swap", "rollover", "financing", "interest"]),
    sl: col(["stop loss", "stoploss", "s/l"]),
    tp: col(["take profit", "takeprofit", "t/p"]),
    status: col(["status", "state"]),
  };
}

function normalizeDirection(raw: string): "BUY" | "SELL" | null {
  const d = raw.toLowerCase().trim();
  if (d.includes("buy") || d === "long" || d === "b") return "BUY";
  if (d.includes("sell") || d === "short" || d === "s") return "SELL";
  return null;
}

function parseAnyDate(raw: string): Date | null {
  return parseMT4Date(raw) ?? parseISODate(raw);
}

// numbers may arrive as "1,234.56", "(123.45)" for negatives, or "1.234,56" (EU)
function parseNumber(raw: string): number {
  if (!raw) return 0;
  let s = raw.trim().replace(/\s/g, "");
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  s = s.replace(/[^0-9.,\-]/g, "");
  // EU decimal (1.234,56) → strip dots, comma→dot; else strip thousands commas
  if (/,\d{1,2}$/.test(s) && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return neg ? -Math.abs(n) : n;
}

function locateHeaderRow(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const low = lines[i].toLowerCase();
    if (/(symbol|instrument|market)/.test(low) && /(side|direction|type|price|volume|quantity)/.test(low)) return i;
  }
  return 0;
}

export function parseUniversalBrokerCSV(csv: string, label: string): ParseResult {
  const warnings: string[] = [];
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { trades: [], format: label, warnings: ["Fișier gol sau fără date."] };

  const headerIdx = locateHeaderRow(lines);
  const headers = parseCSVLine(lines[headerIdx]).map((h) => h.toLowerCase().trim());
  const c = buildFuzzyCols(headers);
  const g = (cells: string[], idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");

  const hasPair = c.entryPrice >= 0 && c.exitPrice >= 0 && c.entryTime >= 0 && c.exitTime >= 0;

  if (hasPair) {
    // ── PAIRED mode: one closed round-trip per row ──────────────────────────
    const trades: ParsedTrade[] = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 4) continue;
      const sym = g(cells, c.symbol).toUpperCase().replace(/\s/g, "");
      const dir = normalizeDirection(g(cells, c.dir));
      if (!sym || !dir) continue;
      const entryTime = parseAnyDate(g(cells, c.entryTime));
      const exitTime = parseAnyDate(g(cells, c.exitTime));
      if (!entryTime || !exitTime) { warnings.push(`Dată invalidă linia ${i + 1}`); continue; }
      trades.push({
        brokerTradeId: g(cells, c.id) || `${label.slice(0, 3).toLowerCase()}_${i}`,
        symbol: sym,
        direction: dir,
        entryTime,
        exitTime,
        entryPrice: parseNumber(g(cells, c.entryPrice)),
        exitPrice: parseNumber(g(cells, c.exitPrice)),
        lotSize: parseNumber(g(cells, c.vol)),
        stopLoss: c.sl >= 0 && g(cells, c.sl) ? parseNumber(g(cells, c.sl)) || undefined : undefined,
        takeProfit: c.tp >= 0 && g(cells, c.tp) ? parseNumber(g(cells, c.tp)) || undefined : undefined,
        pnlMoney: parseNumber(g(cells, c.pnl)),
        commission: parseNumber(g(cells, c.comm)),
        swap: parseNumber(g(cells, c.swap)),
        instrumentType: detectInstrumentType(sym),
      });
    }
    return { trades, format: `${label} (poziții închise)`, warnings };
  }

  // ── BLOTTER mode: FIFO-pair fills into round-trips ────────────────────────
  const priceIdx = c.price >= 0 ? c.price : c.entryPrice;
  const timeIdx = c.time >= 0 ? c.time : c.entryTime;
  if (priceIdx < 0 || timeIdx < 0 || c.symbol < 0 || c.dir < 0) {
    return { trades: [], format: label, warnings: ["Nu am putut identifica coloanele necesare (simbol / direcție / preț / timp)."] };
  }

  interface Fill {
    time: Date; symbol: string; side: "BUY" | "SELL"; price: number;
    volume: number; commission: number; swap: number; pnl: number; hasPnl: boolean; id: string;
  }
  const fills: Fill[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 4) continue;
    // skip non-executed rows when a status column exists
    if (c.status >= 0) {
      const st = g(cells, c.status).toLowerCase();
      if (st && !/(fill|filled|closed|executed|done|complete)/.test(st)) continue;
    }
    const sym = g(cells, c.symbol).toUpperCase().replace(/\s/g, "");
    const side = normalizeDirection(g(cells, c.dir));
    const time = parseAnyDate(g(cells, timeIdx));
    const volume = parseNumber(g(cells, c.vol));
    const price = parseNumber(g(cells, priceIdx));
    if (!sym || !side || !time || volume <= 0) continue;
    const pnlRaw = c.pnl >= 0 ? g(cells, c.pnl) : "";
    fills.push({
      time, symbol: sym, side, price, volume,
      commission: parseNumber(g(cells, c.comm)),
      swap: parseNumber(g(cells, c.swap)),
      pnl: parseNumber(pnlRaw), hasPnl: pnlRaw !== "",
      id: g(cells, c.id) || `${i}`,
    });
  }

  fills.sort((a, b) => a.time.getTime() - b.time.getTime());

  interface OpenLot { side: "BUY" | "SELL"; volume: number; price: number; time: Date; commission: number; id: string; }
  const books = new Map<string, OpenLot[]>();
  const trades: ParsedTrade[] = [];
  let approxPnl = false;

  for (const f of fills) {
    const book = books.get(f.symbol) ?? [];
    let remaining = f.volume;
    // a fill closes opposite-side open lots FIFO
    while (remaining > 0 && book.length > 0 && book[0].side !== f.side) {
      const lot = book[0];
      const matched = Math.min(remaining, lot.volume);
      const posDir = lot.side; // position direction = the opening side
      const entryPrice = lot.price;
      const exitPrice = f.price;
      // proportional commission for the matched slice
      const commEntry = lot.volume > 0 ? (lot.commission * matched) / lot.volume : 0;
      const commExit = f.volume > 0 ? (f.commission * matched) / f.volume : 0;
      let pnlMoney: number;
      if (f.hasPnl) {
        pnlMoney = f.volume > 0 ? (f.pnl * matched) / f.volume : f.pnl;
      } else {
        const diff = posDir === "BUY" ? exitPrice - entryPrice : entryPrice - exitPrice;
        pnlMoney = diff * matched;
        approxPnl = true;
      }
      trades.push({
        brokerTradeId: `${f.symbol}_${lot.id}_${f.id}`,
        symbol: f.symbol,
        direction: posDir,
        entryTime: lot.time,
        exitTime: f.time,
        entryPrice,
        exitPrice,
        lotSize: matched,
        pnlMoney,
        commission: commEntry + commExit,
        swap: f.swap,
        instrumentType: detectInstrumentType(f.symbol),
      });
      lot.volume -= matched;
      remaining -= matched;
      if (lot.volume <= 1e-9) book.shift();
    }
    // any leftover opens a new lot in the fill's own direction
    if (remaining > 1e-9) {
      book.push({ side: f.side, volume: remaining, price: f.price, time: f.time, commission: f.commission, id: f.id });
    }
    books.set(f.symbol, book);
  }

  const stillOpen = [...books.values()].reduce((n, b) => n + b.length, 0);
  if (stillOpen > 0) warnings.push(`${stillOpen} poziție(i) încă deschisă(e) — ignorate (doar tranzacțiile închise sunt importate).`);
  if (approxPnl) warnings.push("P&L calculat din diferența de preț × volum (exportul nu conține P&L realizat) — verifică valoarea per punct.");

  return { trades, format: `${label} (blotter FIFO)`, warnings };
}

export function parseTradeLockerCSV(csv: string): ParseResult {
  return parseUniversalBrokerCSV(csv, "TradeLocker CSV");
}

export function parseDXtradeCSV(csv: string): ParseResult {
  return parseUniversalBrokerCSV(csv, "DXtrade CSV");
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
