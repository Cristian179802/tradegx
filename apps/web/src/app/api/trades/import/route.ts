import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(str: string): Date | null {
  if (!str || str.trim() === "" || str.trim() === "0") return null;
  const s = str.trim();
  const normalized = s
    .replace(/\./g, "-")
    .replace(" ", "T")
    .replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(str: string | undefined): number | null {
  if (!str || str.trim() === "" || str.trim() === "-") return null;
  const n = parseFloat(str.trim().replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

// ─── Pips & R:R calculation ────────────────────────────────────────────────────

function calcPips(
  symbol: string,
  direction: "BUY" | "SELL",
  entryPrice: number,
  exitPrice: number | null
): number | null {
  if (exitPrice === null) return null;
  const isJpy = symbol.includes("JPY");
  const multiplier = isJpy ? 100 : 10000;
  const diff = direction === "BUY"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
  return parseFloat((diff * multiplier).toFixed(1));
}

function calcRR(
  direction: "BUY" | "SELL",
  entryPrice: number,
  exitPrice: number | null,
  stopLoss: number | null
): number | null {
  if (exitPrice === null || stopLoss === null) return null;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return null;
  const reward = direction === "BUY"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
  if (reward <= 0) return null;
  return parseFloat((reward / risk).toFixed(2));
}

// ─── HTML parser ───────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function parseHtmlTable(html: string): string[][] {
  const rows: string[][] = [];
  // Extract all <tr>...</tr> blocks
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells: string[] = [];
    // Extract <th> and <td> cells
    const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

// ─── CSV helpers ───────────────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, string> = {
  ticket: "ticket", "#": "ticket", id: "ticket", order: "ticket", position: "ticket",
  "open time": "openTime", opentime: "openTime", "open_time": "openTime",
  "date open": "openTime", "open date": "openTime", time: "openTime",
  "date/time": "openTime", "open date/time": "openTime",
  type: "type", direction: "type", action: "type", side: "type",
  size: "size", volume: "size", lots: "size", lot: "size",
  qty: "size", quantity: "size", "vol.": "size",
  symbol: "symbol", item: "symbol", instrument: "symbol", pair: "symbol", asset: "symbol",
  "open price": "openPrice", openprice: "openPrice", "open_price": "openPrice",
  price: "openPrice", "entry price": "openPrice", entry: "openPrice",
  "s/l": "sl", sl: "sl", stoploss: "sl", "stop loss": "sl", "stop_loss": "sl",
  "t/p": "tp", tp: "tp", takeprofit: "tp", "take profit": "tp", "take_profit": "tp",
  "close time": "closeTime", closetime: "closeTime", "close_time": "closeTime",
  "date close": "closeTime", "close date": "closeTime", "exit time": "closeTime",
  "exit date/time": "closeTime",
  "close price": "closePrice", closeprice: "closePrice", "close_price": "closePrice",
  "exit price": "closePrice", exit: "closePrice",
  commission: "commission", taxes: "commission", fee: "commission", fees: "commission",
  swap: "swap", rollover: "swap",
  profit: "profit", "net profit": "profit", "p&l": "profit", pnl: "profit",
  "gain/loss": "profit", "realized p&l": "profit", result: "profit",
};

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[h.trim().toLowerCase()];
    if (key && map[key] === undefined) map[key] = i;
  });
  return map;
}

function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    ",": (line.match(/,/g) ?? []).length,
    ";": (line.match(/;/g) ?? []).length,
    "\t": (line.match(/\t/g) ?? []).length,
    "|": (line.match(/\|/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function splitRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === delimiter && !inQuotes) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function findHeaderRow(lines: string[][], minCols = 3): number {
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const cols = lines[i].map((c) => c.toLowerCase().trim());
    const recognized = cols.filter((c) => HEADER_ALIASES[c] !== undefined).length;
    if (recognized >= minCols) return i;
  }
  return -1;
}

// ─── Import logic ──────────────────────────────────────────────────────────────

async function importRows(
  rows: string[][],
  headerIdx: number,
  accountId: string,
  accountBalance: number
) {
  const headers = rows[headerIdx];
  const colMap = mapHeaders(headers);
  const created: string[] = [];
  const errors: { line: number; error: string }[] = [];
  let netPnlImported = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cols = rows[i];
    const get = (key: string) =>
      colMap[key] !== undefined ? (cols[colMap[key]] ?? "").trim() : "";

    const symbol = get("symbol").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const typeStr = get("type").toLowerCase();

    // Skip non-trade rows
    if (
      !symbol || symbol === "SYMBOL" ||
      typeStr === "balance" || typeStr === "credit" ||
      typeStr === "deposit" || typeStr === "withdrawal" || typeStr === ""
    ) continue;

    const openPriceStr = get("openPrice");
    const sizeStr = get("size");
    const entryPrice = parseNumber(openPriceStr);
    const lotSize = parseNumber(sizeStr);

    if (!entryPrice || !lotSize) {
      if (openPriceStr || sizeStr) {
        errors.push({ line: i + 1, error: `Rândul ${i + 1}: preț/volum invalid` });
      }
      continue;
    }

    const direction = typeStr.includes("sell") ? "SELL" : "BUY";
    const entryTime = parseDate(get("openTime")) ?? new Date();
    const exitTime = parseDate(get("closeTime"));
    const exitPrice = parseNumber(get("closePrice"));
    const pnlMoney = parseNumber(get("profit"));
    const stopLoss = parseNumber(get("sl"));
    const ticket = get("ticket") || null;

    // Calculated fields
    const pnlPips = calcPips(symbol, direction, entryPrice, exitPrice);
    const riskRewardRatio = calcRR(direction, entryPrice, exitPrice, stopLoss);

    // Skip duplicates
    if (ticket) {
      const existing = await prisma.trade.findFirst({ where: { accountId, brokerTradeId: ticket } });
      if (existing) continue;
    }

    try {
      const trade = await prisma.trade.create({
        data: {
          accountId,
          symbol,
          instrumentType: "FOREX",
          direction,
          entryPrice,
          entryTime,
          exitPrice: exitPrice ?? null,
          exitTime: exitTime ?? null,
          lotSize,
          stopLoss,
          takeProfit: parseNumber(get("tp")),
          pnlMoney,
          pnlPips,
          riskRewardRatio,
          pnlPercent: pnlMoney != null && accountBalance > 0
            ? (pnlMoney / accountBalance) * 100 : null,
          commission: parseNumber(get("commission")) ?? 0,
          swap: parseNumber(get("swap")) ?? 0,
          // Mark as CLOSED if: has exitTime OR has pnlMoney (deal was settled)
          status: (exitTime || pnlMoney !== null) ? "CLOSED" : "OPEN",
          brokerSource: "MT4",
          brokerTradeId: ticket,
          durationMinutes: exitTime
            ? Math.round((exitTime.getTime() - entryTime.getTime()) / 60000) : null,
        },
      });
      created.push(trade.id);
      // Accumulate net PnL to update account balance afterwards.
      // Extrasele MT4/MT5 au comision/swap SEMNATE (negativ = cost) → se ADUNĂ,
      // ca în accounts/route.ts și ancora webhook-ului EA.
      if (pnlMoney !== null) {
        const commission = parseNumber(get("commission")) ?? 0;
        const swap = parseNumber(get("swap")) ?? 0;
        netPnlImported += pnlMoney + commission + swap;
      }
    } catch {
      errors.push({ line: i + 1, error: `Rândul ${i + 1}: eroare salvare` });
    }
  }

  return { created, errors, netPnlImported };
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const { accountId, csvContent, fileType } = body as {
    accountId: string;
    csvContent: string;
    fileType?: string;
  };

  if (!accountId || !csvContent) {
    return NextResponse.json({ error: "accountId și conținut fișier sunt obligatorii" }, { status: 400 });
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });
  }
  const accountBalance = Number(account.balance);

  const isHtml = fileType === "html" ||
    csvContent.trimStart().startsWith("<") ||
    csvContent.toLowerCase().includes("<table") ||
    csvContent.toLowerCase().includes("<html");

  let rows: string[][];

  if (isHtml) {
    // ── HTML path (MT4/MT5 "Save as Report") ──────────────────────────────────
    rows = parseHtmlTable(csvContent);
    if (rows.length < 2) {
      return NextResponse.json({
        error: "Fișierul HTML nu conține un tabel de tranzacții valid. Asigură-te că dai Save as Report din MetaTrader.",
      }, { status: 400 });
    }
  } else {
    // ── CSV path ───────────────────────────────────────────────────────────────
    const normalized = csvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json({
        error: `Fișierul CSV pare gol (${lines.length} linii). Încearcă să încarci fișierul HTML original din MT4/MT5 (acceptăm și .htm/.html).`,
      }, { status: 400 });
    }

    const delimiter = detectDelimiter(lines[0]);
    rows = lines.map((l) => splitRow(l, delimiter));
  }

  const headerIdx = findHeaderRow(rows);
  if (headerIdx === -1) {
    const sample = rows.slice(0, 3).map((r) => r.join(" | ")).join("\n");
    return NextResponse.json({
      error: `Format nerecunoscut. Primele rânduri: ${sample}`,
    }, { status: 400 });
  }

  const { created, errors, netPnlImported } = await importRows(rows, headerIdx, accountId, accountBalance);

  // Update account balance with the net PnL of all imported trades
  if (created.length > 0 && netPnlImported !== 0) {
    await prisma.tradingAccount.update({
      where: { id: accountId },
      data: { balance: { increment: netPnlImported } },
    });
  }

  return NextResponse.json({
    imported: created.length,
    errors: errors.length,
    errorDetails: errors.slice(0, 10),
    debug: {
      format: isHtml ? "HTML" : "CSV",
      totalRows: rows.length,
      headerIdx,
      detectedColumns: Object.keys(mapHeaders(rows[headerIdx])),
      netPnlImported,
    },
  });
}
