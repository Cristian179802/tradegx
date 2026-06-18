"use client";

import * as React from "react";
import { Lightbulb, X } from "lucide-react";

// ── Sfatul zilei ──────────────────────────────────────────────────────────────
// Sfaturi practice, concrete și acționabile de trading — diferite în fiecare zi,
// alese determinist pe baza zilei anului (se schimbă automat la miezul nopții).

const TIPS: { text: string; cat: string }[] = [
  { text: "Nu risca niciodată mai mult de 1–2% din cont pe o singură tranzacție.", cat: "Risc" },
  { text: "Mută stop-loss-ul la break-even după ce tranzacția atinge +1R profit.", cat: "Management" },
  { text: "Cu un Risk:Reward de 1:2 ești profitabil chiar și cu o rată de câștig de doar 40%.", cat: "Matematică" },
  { text: "Verifică trendul pe timeframe-ul mare (H4/D1) înainte să intri pe cel mic.", cat: "Analiză" },
  { text: "Evită intrările cu 30 de minute înainte și după știrile de impact ridicat.", cat: "Timing" },
  { text: "Nu adăuga niciodată la o poziție pe pierdere — așa îți distrugi contul.", cat: "Risc" },
  { text: "Calculează dimensiunea poziției ÎNAINTE de intrare, pornind de la stop-loss.", cat: "Sizing" },
  { text: "Plasează stop-loss-ul sub/peste structură, nu la o distanță fixă arbitrară.", cat: "Execuție" },
  { text: "O pierdere de 50% cere un câștig de 100% pentru recuperare. Limitează pierderile.", cat: "Matematică" },
  { text: "Dacă pierzi 2–3 tranzacții consecutiv, oprește-te pentru azi. Protejează capitalul.", cat: "Disciplină" },
  { text: "Așteaptă confirmarea (CHoCH / BOS) — nu intra doar pentru că prețul a atins o zonă.", cat: "Confirmare" },
  { text: "Sesiunea Londra (10:00–13:00 RO) oferă cea mai mare lichiditate pe forex.", cat: "Timing" },
  { text: "Killzone-ul New York (15:30–18:00 RO) e ideal pentru indici și perechile cu USD.", cat: "Timing" },
  { text: "Win rate-ul singur nu spune nimic — contează expectanța: (win rate × R:R) − rata de pierdere.", cat: "Matematică" },
  { text: "Nu tranzacționa niciodată fără stop-loss, indiferent cât de sigur ești pe setup.", cat: "Risc" },
  { text: "Un Fair Value Gap tinde să fie umplut — folosește-l ca zonă de intrare cu confluență.", cat: "SMC" },
  { text: "Lichiditatea se acumulează peste maxime și sub minime evidente (equal highs/lows).", cat: "SMC" },
  { text: "Un Order Block valid a creat o mișcare cu displacement, nu o lumânare oarecare.", cat: "SMC" },
  { text: "Jurnalizează fiecare tranzacție — fără date nu poți îmbunătăți nimic obiectiv.", cat: "Proces" },
  { text: "Profită parțial la +1R și lasă restul să curgă cu stop-loss-ul la break-even.", cat: "Management" },
  { text: "Nu deschide două poziții puternic corelate — e risc dublu ascuns pe aceeași direcție.", cat: "Risc" },
  { text: "Reduce dimensiunea poziției când volatilitatea (ATR) crește semnificativ.", cat: "Risc" },
  { text: "Tranzacționează în direcția trendului — nu încerca să prinzi vârfuri și funduri.", cat: "Trend" },
  { text: "Un trend sănătos formează maxime și minime tot mai înalte (higher highs & lows).", cat: "Trend" },
  { text: "Backtestează o strategie pe minim 100 de tranzacții înainte să o folosești live.", cat: "Pregătire" },
  { text: "Spread-ul se lărgește la deschiderea și închiderea sesiunilor — evită acele momente.", cat: "Execuție" },
  { text: "Confluența mai multor factori (trend + zonă HTF + sesiune) crește probabilitatea.", cat: "Analiză" },
  { text: "Aurul (XAU) e mai volatil decât majoritatea perechilor forex — lărgește stop-loss-ul.", cat: "Instrument" },
  { text: "Evită tranzacționarea vineri după-amiaza: lichiditate scăzută, mișcări imprevizibile.", cat: "Timing" },
  { text: "Verifică calendarul economic în fiecare dimineață, înainte să deschizi o poziție.", cat: "Rutină" },
  { text: "Riscă mereu același procent din cont — nu mări miza ca să recuperezi o pierdere.", cat: "Disciplină" },
  { text: "Prețul reacționează la nivelurile pe care le văd toți — desenează zonele de pe H4/D1.", cat: "Analiză" },
];

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function MotivationBanner() {
  const [hidden, setHidden] = React.useState(true);
  const tip = TIPS[dayOfYear() % TIPS.length];

  React.useEffect(() => {
    const key = `tip-dismissed-${new Date().toISOString().slice(0, 10)}`;
    setHidden(localStorage.getItem(key) === "1");
  }, []);

  function dismiss() {
    const key = `tip-dismissed-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, "1");
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl border border-indigo-500/20 px-4 py-3 overflow-hidden animate-fade-in-up"
      style={{
        background: "linear-gradient(100deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.06) 40%, rgba(24,24,28,0.6) 100%)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
        <Lightbulb className="w-4 h-4 text-amber-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-amber-400/90 uppercase tracking-[0.12em]">Sfatul zilei</span>
          <span className="text-[9px] font-bold text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">{tip.cat}</span>
        </div>
        <p className="text-sm text-zinc-200 font-medium leading-snug mt-0.5">{tip.text}</p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
        title="Ascunde pentru azi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
