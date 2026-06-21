"use client";

import React from "react";

const SESSIONS = [
  {
    name: "Sydney",
    flag: "🇦🇺",
    hours: "00:00 – 09:00",
    color: "bg-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/5",
  },
  {
    name: "Tokyo",
    flag: "🇯🇵",
    hours: "02:00 – 11:00",
    color: "bg-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/5",
  },
  {
    name: "Londra",
    flag: "🇬🇧",
    hours: "10:00 – 19:00",
    color: "bg-indigo-400",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/5",
  },
  {
    name: "New York",
    flag: "🇺🇸",
    hours: "15:00 – 00:00",
    color: "bg-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
  },
];

const OVERLAPS = [
  { label: "Tokyo / Londra", hours: "10:00 – 11:00" },
  { label: "Londra / New York", hours: "15:00 – 19:00", best: true },
];

export function MarketSessions() {
  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-200">Sesiuni de Piață</h2>
        <p className="text-xs text-zinc-600 mt-0.5">Ora României (EET/EEST)</p>
      </div>

      {/* Sessions */}
      <div className="space-y-2.5 flex-1">
        {SESSIONS.map((s) => (
          <div
            key={s.name}
            className={`flex items-center gap-3 rounded-xl border ${s.border} ${s.bg} px-3.5 py-2.5`}
          >
            {/* Dot */}
            <span className={`h-2 w-2 rounded-full shrink-0 ${s.color}`} />

            {/* Flag + name */}
            <span className="text-base leading-none shrink-0">{s.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200">{s.name}</p>
            </div>

            {/* Hours */}
            <span className="text-xs font-mono font-semibold text-zinc-400 shrink-0">
              {s.hours}
            </span>
          </div>
        ))}
      </div>

      {/* Overlaps */}
      <div className="mt-4 pt-3.5 border-t border-zinc-800/60">
        <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">
          Suprapuneri cheie
        </p>
        <div className="space-y-1.5">
          {OVERLAPS.map((o) => (
            <div key={o.label} className="flex items-center justify-between">
              <span className={`text-[11px] ${o.best ? "text-amber-400 font-semibold" : "text-zinc-500"}`}>
                {o.best ? "⚡ " : ""}{o.label}
              </span>
              <span className={`text-[11px] font-mono ${o.best ? "text-amber-500/80" : "text-zinc-600"}`}>
                {o.hours} RO
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
