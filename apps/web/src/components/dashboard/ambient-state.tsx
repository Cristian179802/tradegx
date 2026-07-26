"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";

// ── AmbientState — interfața care își dă seama unde ești ─────────────────────
//
// Ideea: un instrument bun nu așteaptă să te uiți la el ca să te avertizeze.
// Marginea ecranului devine un indicator periferic — îl percepi fără să-l
// citești, exact cum vezi cu coada ochiului că se schimbă lumina în cameră.
//
// Se alimentează EXCLUSIV din date reale: raportul dintre drawdown-ul măsurat
// și cel mai strict prag definit pe conturile tale. Fără prag setat, stratul nu
// se randează deloc — nu inventăm o alertă ca să avem un efect.
//
// Praguri:
//   < 50%  din limită → nimic (nu distragem degeaba)
//   50-75% → chihlimbar discret, respirație lentă
//   > 75%  → roșu, respirație mai vie
//
// Chihlimbarul/roșul aici NU încalcă disciplina de culoare: sunt semantice
// (avertizare / pericol), nu decor.

export function AmbientState({
  drawdownPct,
  drawdownLimitPct,
}: {
  drawdownPct: number | null;
  drawdownLimitPct: number | null;
}) {
  const t = useTranslations("dashboard");

  if (drawdownPct === null || drawdownLimitPct === null || drawdownLimitPct <= 0) return null;

  const ratio = drawdownPct / drawdownLimitPct;
  if (ratio < 0.5) return null;

  const danger = ratio >= 0.75;
  const rgb = danger ? "251,92,114" : "245,158,11";
  // Intensitatea crește cu apropierea, plafonată ca să nu devină agresivă.
  const strength = Math.min((ratio - 0.5) / 0.5, 1);
  const alpha = 0.12 + strength * 0.20;
  const pct = Math.round(ratio * 100);

  return (
    <>
      {/* Halo periferic. pointer-events:none — nu prinde niciodată clicuri.
          z-index sub navbar/dialoguri, ca să nu acopere controale. */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-30 tg-ambient-breathe"
        style={{
          boxShadow: `inset 0 0 ${90 + strength * 70}px rgba(${rgb},${alpha})`,
          // durata respirației scade cu pericolul: mai aproape = puls mai viu
          animationDuration: `${danger ? 2.6 : 4.2}s`,
        }}
      />

      {/* Eticheta: haloul singur ar fi ambiguu („de ce e roșu ecranul?").
          Un instrument bun spune și DE CE. */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full px-3.5 py-1.5 backdrop-blur-md"
        style={{
          background: "rgba(16,19,25,0.92)",
          border: `1px solid rgba(${rgb},0.42)`,
          boxShadow: "var(--el-2)",
        }}
        role="status"
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(${rgb})` }} />
        <span className="text-[11px] font-bold" style={{ color: `rgb(${rgb})` }}>
          {t("ambientRisk", { pct })}
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--ink-4)" }}>
          {drawdownPct.toFixed(1)}% / {drawdownLimitPct.toFixed(1)}%
        </span>
      </div>
    </>
  );
}
