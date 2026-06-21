import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Decimal } from "decimal.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | Decimal | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" || amount instanceof Decimal
    ? parseFloat(amount.toString())
    : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPips(pips: number | string | null | undefined): string {
  if (pips === null || pips === undefined) return "—";
  const num = typeof pips === "string" ? parseFloat(pips) : pips;
  return `${num > 0 ? "+" : ""}${num.toFixed(1)} pips`;
}

export function formatPercent(
  value: number | string | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num > 0 ? "+" : ""}${num.toFixed(decimals)}%`;
}

export function formatDate(
  date: Date | string | null | undefined,
  timezone = "Europe/Bucharest"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateShort(
  date: Date | string | null | undefined,
  timezone = "Europe/Bucharest"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function getPnlColor(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "text-zinc-400";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num > 0) return "text-emerald-500";
  if (num < 0) return "text-rose-500";
  return "text-zinc-400";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
