"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// ── Tabelul de date ──────────────────────────────────────────────────────────
//
// Aceeași configurație de coloane, două înfățișări.
//
// Pe ecran lat: tabel. Coloanele aliniate vertical sunt cel mai bun mod de a
// compara o sută de rânduri, și de-aia tabelele există de patru sute de ani.
//
// Pe telefon: CARDURI. Măsurat pe pagina de tranzacții la 375px, tabelul era de
// 1067 pixeli lați într-un container de 328 — deci opt coloane din unsprezece
// stăteau în afara ecranului. Se putea derula lateral, dar asta înseamnă că
// pentru fiecare tranzacție trebuia să tragi înainte și înapoi ca s-o citești
// întreagă. Compararea, singurul motiv pentru care ai un tabel, devenea
// imposibilă: nu poți ține minte coloana 9 cât te întorci la coloana 1.
//
// Cardul răstoarnă problema: fiecare rând devine un bloc în care toate câmpurile
// se văd deodată. Compari mai greu între rânduri, dar citești complet un rând —
// iar pe un ecran de 375 de pixeli asta e alegerea corectă.
//
// Prima coloană devine titlul cardului. E o convenție, nu o configurare: în toate
// listele din aplicație prima coloană e identificatorul — simbolul, numele,
// data. Dacă vreodată nu mai e așa, se adaugă un câmp explicit; până atunci, o
// convenție care ține fără cod în plus.

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  /**
   * Ascunde coloana din cardul de pe telefon.
   *
   * Pentru câmpurile care pe ecran mic nu merită spațiu — de obicei cele
   * redundante față de titlu sau utile doar la comparație între rânduri.
   */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyFn: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyFn,
  onRowClick,
  loading = false,
  emptyMessage = "Nicio înregistrare găsită",
  sortKey,
  sortDir,
  onSort,
  className,
}: DataTableProps<T>) {
  const [primary, ...rest] = columns;
  const cardFields = rest.filter((c) => !c.hideOnMobile);

  return (
    <>
      {/* ── Tabel: de la md în sus ── */}
      <div
        className={cn(
          "hidden md:block w-full overflow-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/80",
          className
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-zinc-300",
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  aria-sort={
                    col.sortable
                      ? sortKey === col.key
                        ? sortDir === "asc" ? "ascending" : "descending"
                        : "none"
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-zinc-600">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-zinc-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyFn(row)}
                  className={cn(
                    "border-b border-zinc-800/40 transition-all duration-100 cyber-row",
                    onRowClick && "cursor-pointer hover:bg-zinc-800/60"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-zinc-200", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Carduri: sub md ── */}
      <div className={cn("md:hidden space-y-2", className)}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-3.5">
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-800 mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-zinc-800/70" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800/70" />
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 px-4 py-12 text-center text-zinc-500">
            {emptyMessage}
          </div>
        ) : (
          data.map((row) => {
            const Wrapper = onRowClick ? "button" : "div";
            return (
              <Wrapper
                key={keyFn(row)}
                {...(onRowClick
                  ? { type: "button" as const, onClick: () => onRowClick(row) }
                  : {})}
                className={cn(
                  "w-full text-left rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-3.5",
                  onRowClick && "active:bg-zinc-800/60 transition-colors"
                )}
              >
                {/* Titlul cardului: prima coloană, la dimensiune de titlu. */}
                <div className="mb-2.5 text-[15px] font-bold text-zinc-100">
                  {primary?.cell(row)}
                </div>

                {/* Restul câmpurilor, etichetă la stânga, valoare la dreapta.
                    Etichetele sunt necesare aici: fără antet de coloană, o cifră
                    singură nu spune ce este. */}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {cardFields.map((col) => (
                    <div key={col.key} className="flex items-baseline justify-between gap-2 min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 shrink-0">
                        {col.header}
                      </dt>
                      <dd className="text-[12px] text-zinc-200 truncate text-right">
                        {col.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Wrapper>
            );
          })
        )}
      </div>
    </>
  );
}
