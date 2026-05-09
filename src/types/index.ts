import type {
  User,
  TradingAccount,
  Trade,
  JournalEntry,
  Subscription,
  Alert,
} from "@prisma/client";

// ============================================================
// SESSION TYPES
// ============================================================

export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "USER" | "ADMIN" | "COACH";
  plan: "FREE" | "PRO";
  isTrialing: boolean;
}

// ============================================================
// ENRICHED MODEL TYPES
// ============================================================

export type TradingAccountWithStats = TradingAccount & {
  _count?: { trades: number };
  winRate?: number;
  totalPnl?: number;
};

export type TradeWithJournal = Trade & {
  journalEntry: JournalEntry | null;
};

export type UserWithRelations = User & {
  subscription: Subscription | null;
  tradingAccounts: TradingAccount[];
};

// ============================================================
// NAVIGATION
// ============================================================

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  proOnly?: boolean;
  group: "trading" | "markets" | "community" | "account";
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  field?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================
// CALCULATOR TYPES
// ============================================================

export interface LotSizeCalculation {
  accountBalance: number;
  riskPercent: number;
  riskAmount: number;
  entryPrice: number;
  stopLossPrice: number;
  stopLossPips: number;
  pipValue: number;
  lotSize: number;
  symbol: string;
  targets: {
    rr: number;
    targetPrice: number;
    profitAmount: number;
    profitPips: number;
  }[];
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  recoveryFactor: number;
  netPnl: number;
  totalWins: number;
  totalLosses: number;
  totalBreakeven: number;
  avgRR: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
}

// ============================================================
// ALERT TYPES
// ============================================================

export interface AlertNotification {
  id: string;
  type: Alert["type"];
  severity: Alert["severity"];
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

// ============================================================
// PRESET ACCOUNT TYPES (Cristi's accounts)
// ============================================================

export interface PresetAccount {
  id: string;
  name: string;
  balance: number;
  currency: "USD" | "EUR";
  riskPercent: number;
  riskAmount: number;
}

export const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    id: "goat-25k",
    name: "Goat Funded $25K",
    balance: 25000,
    currency: "USD",
    riskPercent: 1,
    riskAmount: 250,
  },
  {
    id: "goat-100k",
    name: "Goat Funded $100K",
    balance: 100000,
    currency: "USD",
    riskPercent: 1,
    riskAmount: 1000,
  },
  {
    id: "funded-next-15k",
    name: "Funded Next Stellar $15K",
    balance: 15000,
    currency: "USD",
    riskPercent: 1,
    riskAmount: 150,
  },
];
