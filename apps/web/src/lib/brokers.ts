// ── Catalog de brokeri și firme de finanțare ─────────────────────────────────
//
// DE CE EXISTĂ. Conectarea unui cont cerea numele serverului MetaTrader scris
// de mână, exact ca în platformă („ICMarketsSC-Live"). O literă greșită =
// conectare eșuată, cu un mesaj care vine de la MetaAPI și nu spune asta.
// Aici stau numele cunoscute, ca omul să aleagă din listă.
//
// Integrarea NU e legată de vreo firmă anume: MetaAPI primește
// login + parolă + server + platformă, deci merge cu orice cont MT4/MT5.
// Lista de mai jos e o comoditate, nu o restricție — câmpul rămâne liber, iar
// un server care nu e aici se scrie pur și simplu.
//
// ONESTITATE. Numele de servere se schimbă, iar firmele își modifică regulile
// des. De aceea:
//   - `servere` conține doar nume despre care avem motive să credem că sunt
//     corecte; unde nu știm, lista e goală și UI-ul cere scrierea manuală;
//   - regulile NU sunt atribuite ca fapt niciunei firme. Ce oferim sunt
//     ȘABLOANE după STRUCTURĂ (două faze, o fază, instant, futures), pe care
//     omul le confirmă cu programul lui. O cifră greșită aici ar însemna o
//     alarmă care nu sună când trebuie.

export type Platforma = "mt4" | "mt5";
export type FelFirma = "BROKER" | "PROP";

/** Cum se calculează drawdown-ul maxim — diferența care pică cel mai des conturi. */
export type TipDrawdown =
  /** Prag fix, raportat la soldul inițial. Nu se mișcă niciodată. */
  | "STATIC"
  /** Pragul urcă odată cu cel mai mare echity atins. Nu coboară la pierdere. */
  | "TRAILING";

export interface SablonReguli {
  id: string;
  /** Cheie i18n în `propFirmPage.sabloane`. */
  cheie: string;
  profitTargetPct: number | null;
  maxDailyLossPct: number | null;
  maxDrawdownPct: number | null;
  tipDrawdown: TipDrawdown;
  minTradingDays: number | null;
}

/**
 * Șabloane după structură, nu după firmă. Acoperă modelele întâlnite în piață;
 * cifrele exacte se confirmă cu programul tău.
 */
export const SABLOANE: SablonReguli[] = [
  {
    id: "doua-faze-8",
    cheie: "douaFaze8",
    profitTargetPct: 8,
    maxDailyLossPct: 5,
    maxDrawdownPct: 10,
    tipDrawdown: "STATIC",
    minTradingDays: 0,
  },
  {
    id: "doua-faze-10",
    cheie: "douaFaze10",
    profitTargetPct: 10,
    maxDailyLossPct: 5,
    maxDrawdownPct: 10,
    tipDrawdown: "STATIC",
    minTradingDays: 4,
  },
  {
    id: "o-faza-trailing",
    cheie: "oFazaTrailing",
    profitTargetPct: 10,
    maxDailyLossPct: 4,
    maxDrawdownPct: 6,
    tipDrawdown: "TRAILING",
    minTradingDays: 3,
  },
  {
    id: "instant",
    cheie: "instant",
    profitTargetPct: null,
    maxDailyLossPct: 4,
    maxDrawdownPct: 8,
    tipDrawdown: "TRAILING",
    minTradingDays: null,
  },
  {
    id: "futures",
    cheie: "futures",
    profitTargetPct: 6,
    maxDailyLossPct: null,
    maxDrawdownPct: 4,
    tipDrawdown: "TRAILING",
    minTradingDays: 5,
  },
  {
    id: "personal",
    cheie: "personal",
    profitTargetPct: null,
    maxDailyLossPct: 3,
    maxDrawdownPct: 10,
    tipDrawdown: "STATIC",
    minTradingDays: null,
  },
  {
    id: "custom",
    cheie: "custom",
    profitTargetPct: null,
    maxDailyLossPct: null,
    maxDrawdownPct: null,
    tipDrawdown: "STATIC",
    minTradingDays: null,
  },
];

export interface Firma {
  id: string;
  nume: string;
  fel: FelFirma;
  platforme: Platforma[];
  /** Nume de server MetaTrader, exact cum apar în platformă. Gol = se scrie manual. */
  servere: string[];
}

/**
 * Firmele cunoscute. Nu e o listă de parteneri și nu e exhaustivă — orice cont
 * MT4/MT5 se conectează, listat sau nu.
 */
export const FIRME: Firma[] = [
  // ── Brokeri ────────────────────────────────────────────────────────────────
  { id: "ic-markets",   nume: "IC Markets",        fel: "BROKER", platforme: ["mt4", "mt5"], servere: ["ICMarketsSC-Live01", "ICMarketsSC-Live02", "ICMarketsSC-Demo"] },
  { id: "pepperstone",  nume: "Pepperstone",       fel: "BROKER", platforme: ["mt4", "mt5"], servere: ["Pepperstone-Live", "Pepperstone-Demo"] },
  { id: "exness",       nume: "Exness",            fel: "BROKER", platforme: ["mt4", "mt5"], servere: ["Exness-Real", "Exness-Trial"] },
  { id: "xm",           nume: "XM",                fel: "BROKER", platforme: ["mt4", "mt5"], servere: ["XMGlobal-Real", "XMGlobal-Demo"] },
  { id: "admirals",     nume: "Admirals",          fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "fxpro",        nume: "FxPro",             fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "oanda",        nume: "OANDA",             fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "fpmarkets",    nume: "FP Markets",        fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "tickmill",     nume: "Tickmill",          fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "vantage",      nume: "Vantage",           fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "eightcap",     nume: "Eightcap",          fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "blueberry",    nume: "Blueberry Markets", fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "activtrades",  nume: "ActivTrades",       fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "roboforex",    nume: "RoboForex",         fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "fbs",          nume: "FBS",               fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "justmarkets",  nume: "JustMarkets",       fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "hfm",          nume: "HFM",               fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "octafx",       nume: "OctaFX",            fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },
  { id: "dukascopy",    nume: "Dukascopy",         fel: "BROKER", platforme: ["mt4"],        servere: [] },
  { id: "swissquote",   nume: "Swissquote",        fel: "BROKER", platforme: ["mt4", "mt5"], servere: [] },

  // ── Firme de finanțare ─────────────────────────────────────────────────────
  { id: "ftmo",           nume: "FTMO",                 fel: "PROP", platforme: ["mt4", "mt5"], servere: ["FTMO-Server", "FTMO-Demo"] },
  { id: "fundednext",     nume: "FundedNext",           fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "the5ers",        nume: "The5ers",              fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "myfundedfx",     nume: "MyFundedFX",           fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "e8",             nume: "E8 Markets",           fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "alpha-capital",  nume: "Alpha Capital Group",  fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "funding-pips",   nume: "Funding Pips",         fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "goat-funded",    nume: "Goat Funded Trader",   fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "instant-funding",nume: "Instant Funding",      fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "finotive",       nume: "Finotive Funding",     fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "cti",            nume: "City Traders Imperial",fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "breakout",       nume: "Breakout",             fel: "PROP", platforme: ["mt5"],        servere: [] },
  { id: "maven",          nume: "Maven Trading",        fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "lark",           nume: "Lark Funding",         fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "smart-prop",     nume: "SmartPropTrader",      fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "funding-traders",nume: "Funding Traders",      fel: "PROP", platforme: ["mt4", "mt5"], servere: [] },
  { id: "topstep",        nume: "Topstep",              fel: "PROP", platforme: [],             servere: [] },
  { id: "apex",           nume: "Apex Trader Funding",  fel: "PROP", platforme: [],             servere: [] },
  { id: "take-profit",    nume: "Take Profit Trader",   fel: "PROP", platforme: [],             servere: [] },
  { id: "earn2trade",     nume: "Earn2Trade",           fel: "PROP", platforme: [],             servere: [] },
];

/** Toate numele de server cunoscute, pentru sugestii în câmpul de conectare. */
export function servereCunoscute(): { server: string; firma: string }[] {
  const out: { server: string; firma: string }[] = [];
  for (const f of FIRME) for (const s of f.servere) out.push({ server: s, firma: f.nume });
  return out.sort((a, b) => a.server.localeCompare(b.server));
}

/** Firmele sortate: cele cu servere cunoscute primele, apoi alfabetic. */
export function firmeSortate(fel?: FelFirma): Firma[] {
  return FIRME.filter((f) => !fel || f.fel === fel).sort((a, b) => {
    const d = Number(b.servere.length > 0) - Number(a.servere.length > 0);
    return d !== 0 ? d : a.nume.localeCompare(b.nume);
  });
}

export function sablon(id: string): SablonReguli | undefined {
  return SABLOANE.find((s) => s.id === id);
}
