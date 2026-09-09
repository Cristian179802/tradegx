"use client";

import * as React from "react";
import { expectancyR, positionSize, riskOfRuin } from "@tradegx/core";
import type { Lang } from "@/lib/academy/types";
import { Bar, LabShell, Readout, Slider, fill } from "../lab-shell";
import { renderInline } from "../lesson-body";

// ── Laboratoarele de risc ────────────────────────────────────────────────────
//
// Cele trei lecții pe care nimeni nu le crede până nu le vede mișcând:
//
//   1. mărimea lotului NU se alege, se calculează — și 10 pierderi la rând
//      arată exact ce înseamnă alegerea greșită
//   2. pierderile și câștigurile nu sunt simetrice
//   3. un win rate mare poate pierde bani, iar unul mic poate câștiga
//
// Toate calculează cu ACELEAȘI funcții pe care le folosește aplicația în
// producție (`@tradegx/core`), nu cu o copie didactică. Dacă formula se schimbă
// vreodată, lecția se schimbă odată cu ea — nu rămâne să predea altceva decât
// face produsul.

const fmtMoney = (v: number) =>
  v.toLocaleString("en-US", { maximumFractionDigits: v >= 100 ? 0 : 2 });

// ═══════════════════════════════════════════════════════════════════════════
// 1. Position sizing + risc de ruină
// ═══════════════════════════════════════════════════════════════════════════

const T1 = {
  title: { ro: "Calculează lotul, nu-l ghici", en: "Calculate the lot, don't guess it" },
  intro: {
    ro: "Alege contul, riscul acceptat și distanța până la stop loss. Lotul iese singur din formulă. Apoi uită-te ce se întâmplă după 10 pierderi consecutive — pentru că vor veni.",
    en: "Pick your balance, your accepted risk and the distance to your stop loss. The lot falls out of the formula. Then look at what happens after 10 consecutive losses — because they will come.",
  },
  balance: { ro: "Cont", en: "Balance" },
  risk: { ro: "Risc per tranzacție", en: "Risk per trade" },
  stop: { ro: "Distanța până la SL", en: "Distance to SL" },
  lot: { ro: "Lot de deschis", en: "Lot to open" },
  riskMoney: { ro: "Pierzi dacă atingi SL", en: "You lose if SL is hit" },
  after10: { ro: "Contul după 10 pierderi la rând", en: "Balance after 10 straight losses" },
  toRecover: { ro: "Ai nevoie de", en: "You'd need" },
  ruin: { ro: "Șansa să pierzi jumătate din cont", en: "Chance of losing half the account" },
  ruinSub: {
    ro: "din 2.000 de scenarii simulate, cu {wr}% win rate și R:R 1:{rr}, peste 200 de tranzacții",
    en: "out of 2,000 simulated scenarios, at {wr}% win rate and 1:{rr} R:R, over 200 trades",
  },
  pips: { ro: "pips", en: "pips" },
  lots: { ro: "loturi", en: "lots" },
  hintRisk: {
    ro: "Profesioniștii stau la 1%. La conturile de prop firm, 1% e obligatoriu.",
    en: "Professionals sit at 1%. On prop-firm accounts, 1% is mandatory.",
  },
  hintStop: {
    ro: "Distanța o dictează GRAFICUL (dincolo de zona care îți invalidează ideea), nu dorința ta.",
    en: "The chart dictates this distance (beyond the zone that invalidates your idea), not your wish.",
  },
};

export function RiskLab({
  lang,
  preset,
}: {
  lang: Lang;
  preset?: { balance?: number; riskPct?: number; winRate?: number; rr?: number };
}) {
  const def = {
    balance: preset?.balance ?? 10_000,
    riskPct: preset?.riskPct ?? 1,
    stopPips: 30,
  };
  const [balance, setBalance] = React.useState(def.balance);
  const [riskPct, setRiskPct] = React.useState(def.riskPct);
  const [stopPips, setStopPips] = React.useState(def.stopPips);

  // EURUSD: 1 pip = 0.0001, 1 lot = 100.000 unități → 10 $/pip. Exprimăm SL-ul
  // în pips, deci construim prețurile din el ca să folosim funcția reală.
  const entry = 1.1;
  const stopLoss = entry - stopPips * 0.0001;
  const lot = positionSize({ balance, riskPct, entryPrice: entry, stopLoss, symbol: "EURUSD" });
  const riskMoney = balance * (riskPct / 100);

  // 10 pierderi consecutive, compus (fiecare pierdere se calculează pe contul
  // rămas, nu pe cel inițial) — exact cum se întâmplă în realitate.
  const after10 = balance * Math.pow(1 - riskPct / 100, 10);
  const dropPct = (1 - after10 / balance) * 100;
  const recoverPct = (balance / after10 - 1) * 100;

  // Simularea e scumpă: o rulăm pe o valoare „întârziată", ca tragerea de
  // cursor să rămână fluidă și rezultatul să ajungă o clipă mai târziu.
  const riskDeferred = React.useDeferredValue(riskPct);
  // Sistemul presupus de simulare. Implicit: 45% win rate cu R:R 1:1.5, adică
  // 0.125R expectanță — un sistem bun și REALIST pentru retail. Un sistem
  // excepțional (55% / 1:2, 0.65R) supraviețuiește și la 8% risc, deci ar preda
  // exact pe dos lecția din secțiunea asta.
  const sistem = { wr: preset?.winRate ?? 45, rr: preset?.rr ?? 1.5 };
  const ruin = React.useMemo(
    () =>
      riskOfRuin({
        winRatePct: sistem.wr,
        riskPct: riskDeferred,
        rr: sistem.rr,
        drawdownPct: 50,
        trades: 200,
        simulations: 2000,
      }),
    [riskDeferred, sistem.wr, sistem.rr]
  );

  const reset = () => {
    setBalance(def.balance);
    setRiskPct(def.riskPct);
    setStopPips(def.stopPips);
  };

  return (
    <LabShell
      title={T1.title}
      intro={T1.intro}
      lang={lang}
      onReset={reset}
      notice={renderInline(
        fill(riskPct <= 2 ? T1_NOTICE.safe[lang] : T1_NOTICE.danger[lang], {
          risk: riskPct,
          left: (100 - dropPct).toFixed(1),
          drop: dropPct.toFixed(1),
          recover: recoverPct.toFixed(0),
          ruin: ruin.toFixed(ruin < 10 ? 1 : 0),
        }),
        lang
      )}
    >
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {/* Controale */}
        <div className="space-y-5">
          <Slider
            label={T1.balance[lang]}
            value={balance}
            min={500}
            max={100_000}
            step={500}
            onChange={setBalance}
            format={(v) => `$${fmtMoney(v)}`}
          />
          <Slider
            label={T1.risk[lang]}
            value={riskPct}
            min={0.25}
            max={10}
            step={0.25}
            onChange={setRiskPct}
            format={(v) => `${v}%`}
            tone={riskPct <= 2 ? "gain" : "loss"}
            hint={T1.hintRisk[lang]}
          />
          <Slider
            label={T1.stop[lang]}
            value={stopPips}
            min={5}
            max={150}
            step={5}
            onChange={setStopPips}
            format={(v) => `${v} ${T1.pips[lang]}`}
            hint={T1.hintStop[lang]}
          />
        </div>

        {/* Rezultate */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Readout label={T1.lot[lang]} value={lot.toFixed(2)} unit={T1.lots[lang]} tone="accent" big />
            <Readout label={T1.riskMoney[lang]} value={`$${fmtMoney(riskMoney)}`} tone="loss" big />
          </div>

          <div className="rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-1)] p-4 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <Readout
                label={T1.after10[lang]}
                value={`$${fmtMoney(after10)}`}
                tone={dropPct > 25 ? "loss" : "ink"}
                sub={`−${dropPct.toFixed(1)}%`}
              />
              <div className="text-right shrink-0">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)] mb-1">
                  {T1.toRecover[lang]}
                </p>
                <p className="font-display text-[20px] font-black leading-none tabular-nums" style={{ color: "var(--ink-2)" }}>
                  +{recoverPct.toFixed(1)}%
                </p>
              </div>
            </div>
            <Bar pct={(after10 / balance) * 100} tone={dropPct > 25 ? "loss" : "gain"} />
          </div>

          <div className="rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-1)] p-4">
            <Readout
              label={T1.ruin[lang]}
              value={ruin.toFixed(ruin < 10 ? 1 : 0)}
              unit="%"
              tone={ruin < 5 ? "gain" : ruin < 25 ? "ink" : "loss"}
              sub={fill(T1.ruinSub[lang], { wr: sistem.wr, rr: sistem.rr })}
            />
            <div className="mt-3">
              <Bar pct={ruin} tone={ruin < 5 ? "gain" : "loss"} />
            </div>
          </div>
        </div>
      </div>
    </LabShell>
  );
}

const T1_NOTICE = {
  // Doua concluzii, nu una: la 1% risc mesajul e liniștitor, la 8% e alarmant.
  // O propoziție unică pentru amândouă situațiile n-ar spune adevărul în niciuna.
  safe: {
    ro: "La **{risk}%** risc, zece pierderi la rând te lasă cu **{left}%** din cont — neplăcut, dar complet recuperabil, și continui calm. Șansa de a pierde jumătate din cont e **{ruin}%**. Acum trage cursorul de risc spre 8% și privește cum se schimbă amândouă cifrele.",
    en: "At **{risk}%** risk, ten straight losses leave you with **{left}%** of your account — unpleasant, but fully recoverable, and you carry on calmly. The chance of losing half the account is **{ruin}%**. Now drag the risk slider toward 8% and watch both numbers change.",
  },
  danger: {
    ro: "La **{risk}%** risc, zece pierderi la rând îți iau **{drop}%** din cont, iar ca să revii la zero ai nevoie de **+{recover}%**. Șansa de a pierde jumătate din cont a urcat la **{ruin}%**. Strategia n-a intrat în discuție niciun moment — singura variabilă pe care ai schimbat-o e mărimea poziției.",
    en: "At **{risk}%** risk, ten straight losses take **{drop}%** of your account, and getting back to breakeven needs **+{recover}%**. The chance of losing half the account has climbed to **{ruin}%**. Strategy never entered the discussion — the only variable you changed was position size.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. Asimetria drawdown-ului
// ═══════════════════════════════════════════════════════════════════════════

const T2 = {
  title: { ro: "De ce −50% cere +100%", en: "Why −50% demands +100%" },
  intro: {
    ro: "Trage de pierdere și uită-te la cât trebuie să câștigi ca să revii. Curba nu e o linie — explodează.",
    en: "Drag the loss and look at what you must gain to recover. The curve isn't a line — it explodes.",
  },
  loss: { ro: "Pierdere suferită", en: "Loss taken" },
  need: { ro: "Ai nevoie să câștigi", en: "You need to gain" },
  ofRemaining: { ro: "din ce ți-a rămas", en: "of what's left" },
  notice: {
    ro: "O pierdere de **{loss}%** cere **+{need}%** ca să revii la zero — pentru că recuperezi dintr-o bază mai mică. Până la 20% diferența e mică; de la 50% în sus, curba te pedepsește. De aici vine prima regulă a tradingului: nu „câștigă mult”, ci **„nu pierde mult”**.",
    en: "A **{loss}%** loss demands **+{need}%** to get back to breakeven — because you recover from a smaller base. Up to 20% the difference is small; from 50% up, the curve punishes you. This is where trading's first rule comes from: not „win big”, but **„don't lose big”**.",
  },
};

const DD_POINTS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

export function DrawdownLab({ lang }: { lang: Lang }) {
  const [loss, setLoss] = React.useState(20);
  const need = (100 / (100 - loss) - 1) * 100;

  // Scara verticală: log-ish prin rădăcină, altfel +900% strivește tot restul
  // într-o linie plată la bază și graficul nu mai spune nimic.
  const H = 150;
  const maxNeed = 900;
  const yOf = (n: number) => H - Math.sqrt(Math.min(n, maxNeed) / maxNeed) * H;

  return (
    <LabShell
      title={T2.title}
      intro={T2.intro}
      lang={lang}
      onReset={() => setLoss(20)}
      notice={renderInline(
        fill(T2.notice[lang], { loss, need: need.toFixed(1) }),
        lang
      )}
    >
      <div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-8 items-start">
        <div className="space-y-5">
          <Slider
            label={T2.loss[lang]}
            value={loss}
            min={5}
            max={90}
            step={5}
            onChange={setLoss}
            format={(v) => `−${v}%`}
            tone="loss"
          />
          <Readout
            label={T2.need[lang]}
            value={`+${need.toFixed(1)}`}
            unit="%"
            tone={need > 50 ? "loss" : "ink"}
            sub={T2.ofRemaining[lang]}
            big
          />
        </div>

        <div className="rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-0)] p-3">
          <svg viewBox={`0 0 320 ${H + 34}`} className="w-full h-auto" role="img" aria-label={T2.title[lang]}>
            {/* linia de bază */}
            <line x1={20} x2={310} y1={H} y2={H} stroke="var(--line-2)" strokeWidth={1} />
            {/* curba */}
            <polyline
              fill="none"
              stroke="var(--loss)"
              strokeWidth={2}
              strokeLinejoin="round"
              points={DD_POINTS.map((p, i) => {
                const x = 20 + (i / (DD_POINTS.length - 1)) * 290;
                return `${x},${yOf((100 / (100 - p) - 1) * 100)}`;
              }).join(" ")}
            />
            {/* punctele + etichete */}
            {DD_POINTS.map((p, i) => {
              const x = 20 + (i / (DD_POINTS.length - 1)) * 290;
              const n = (100 / (100 - p) - 1) * 100;
              const active = p === loss;
              return (
                <g key={p}>
                  {active && <line x1={x} x2={x} y1={yOf(n)} y2={H} stroke="var(--loss)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />}
                  <circle cx={x} cy={yOf(n)} r={active ? 5 : 2.5} fill={active ? "var(--loss)" : "var(--ink-4)"} />
                  {active && (
                    <text x={x} y={yOf(n) - 10} fontSize={11} fontWeight={700} fill="var(--loss)" textAnchor="middle">
                      +{n.toFixed(0)}%
                    </text>
                  )}
                  <text x={x} y={H + 15} fontSize={9.5} fill={active ? "var(--ink-2)" : "var(--ink-4)"} textAnchor="middle" fontWeight={active ? 700 : 400}>
                    −{p}
                  </text>
                </g>
              );
            })}
            <text x={165} y={H + 30} fontSize={9} fill="var(--ink-4)" textAnchor="middle" fontWeight={700} letterSpacing="0.1em">
              {lang === "ro" ? "PIERDERE (%)" : "LOSS (%)"}
            </text>
          </svg>
        </div>
      </div>
    </LabShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Expectanță: win rate singur nu spune nimic
// ═══════════════════════════════════════════════════════════════════════════

const T3 = {
  title: { ro: "Win rate mare poate pierde bani", en: "A high win rate can lose money" },
  intro: {
    ro: "Combinația care contează nu e win rate-ul, ci win rate × R:R. Mută cele două cursoare și urmărește curba de capital peste 100 de tranzacții.",
    en: "The combination that matters isn't win rate, it's win rate × R:R. Move the two sliders and watch the equity curve over 100 trades.",
  },
  winRate: { ro: "Win rate", en: "Win rate" },
  rr: { ro: "Risk : Reward", en: "Risk : Reward" },
  expect: { ro: "Expectanță per tranzacție", en: "Expectancy per trade" },
  breakeven: { ro: "Win rate minim pentru zero", en: "Min win rate to break even" },
  after100: { ro: "După 100 de tranzacții (risc 1%)", en: "After 100 trades (1% risk)" },
  noticeEdge: {
    ro: "Cu **{winRate}%** win rate și R:R **1:{rr}**, expectanța e **{exp}R** per tranzacție — ai avantaj. La acest R:R ai nevoie de doar **{breakeven}%** win rate ca să fii pe zero. Pune acum win rate 90% cu R:R 1:0.1 și vezi ce iese: o strategie care „nu greșește aproape niciodată” și tot pierde.",
    en: "At **{winRate}%** win rate and **1:{rr}** R:R, expectancy is **{exp}R** per trade — you have an edge. At this R:R you need only a **{breakeven}%** win rate to break even. Now set win rate to 90% with 1:0.1 R:R and see what comes out: a strategy that „almost never loses” and still bleeds.",
  },
  noticeLoss: {
    ro: "Cu **{winRate}%** win rate și R:R **1:{rr}**, expectanța e **{exp}R** per tranzacție — pierzi bani pe termen lung, oricât de des ai dreptate. La acest R:R ți-ar trebui **{breakeven}%** win rate doar ca să fii pe zero.",
    en: "At **{winRate}%** win rate and **1:{rr}** R:R, expectancy is **{exp}R** per trade — you lose money long term, no matter how often you're right. At this R:R you'd need a **{breakeven}%** win rate just to break even.",
  },
};

export function ExpectancyLab({ lang, preset }: { lang: Lang; preset?: { winRate?: number; rr?: number } }) {
  const def = { winRate: preset?.winRate ?? 40, rr: preset?.rr ?? 3 };
  const [winRate, setWinRate] = React.useState(def.winRate);
  const [rr, setRr] = React.useState(def.rr);

  const exp = expectancyR(winRate, rr);
  const breakeven = (1 / (1 + rr)) * 100;

  // Curba de capital: valoarea AȘTEPTATĂ, nu una aleatoare. Un grafic care
  // sare la fiecare mișcare de cursor ar face imposibilă comparația între două
  // reglaje — și exact comparația e lecția.
  const N = 100;
  const curve = React.useMemo(() => {
    const pts: number[] = [];
    let bal = 100;
    for (let i = 0; i < N; i++) {
      bal *= 1 + (exp * 1) / 100; // risc 1% per tranzacție, exprimat în R
      pts.push(bal);
    }
    return pts;
  }, [exp]);

  const final = curve[curve.length - 1]!;
  const lo = Math.min(100, ...curve);
  const hi = Math.max(100, ...curve);
  const H = 110;

  return (
    <LabShell
      title={T3.title}
      intro={T3.intro}
      lang={lang}
      onReset={() => {
        setWinRate(def.winRate);
        setRr(def.rr);
      }}
      notice={renderInline(
        fill(exp > 0 ? T3.noticeEdge[lang] : T3.noticeLoss[lang], {
          winRate,
          rr: rr.toFixed(1),
          exp: `${exp > 0 ? "+" : ""}${exp}`,
          breakeven: breakeven.toFixed(0),
        }),
        lang
      )}
    >
      <div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-8 items-start">
        <div className="space-y-5">
          <Slider
            label={T3.winRate[lang]}
            value={winRate}
            min={10}
            max={95}
            step={5}
            onChange={setWinRate}
            format={(v) => `${v}%`}
          />
          <Slider
            label={T3.rr[lang]}
            value={rr}
            min={0.1}
            max={5}
            step={0.1}
            onChange={setRr}
            format={(v) => `1 : ${v.toFixed(1)}`}
          />
          <div className="grid grid-cols-2 gap-4 pt-1">
            <Readout
              label={T3.expect[lang]}
              value={`${exp > 0 ? "+" : ""}${exp}`}
              unit="R"
              tone={exp > 0 ? "gain" : "loss"}
            />
            <Readout label={T3.breakeven[lang]} value={breakeven.toFixed(0)} unit="%" />
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-0)] p-3">
          <div className="flex items-baseline justify-between gap-3 mb-2 px-1">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">
              {T3.after100[lang]}
            </p>
            <p className="font-mono text-[14px] font-bold tabular-nums" style={{ color: final >= 100 ? "var(--gain)" : "var(--loss)" }}>
              {final >= 100 ? "+" : ""}
              {(final - 100).toFixed(0)}%
            </p>
          </div>
          <svg viewBox={`0 0 320 ${H}`} className="w-full h-auto" role="img" aria-label={T3.after100[lang]}>
            {/* linia de start (100 = capitalul inițial) */}
            {(() => {
              const y = H - ((100 - lo) / Math.max(hi - lo, 1)) * (H - 12) - 6;
              return (
                <>
                  <line x1={0} x2={320} y1={y} y2={y} stroke="var(--line-2)" strokeWidth={1} strokeDasharray="4 4" />
                  <text x={4} y={y - 4} fontSize={8.5} fill="var(--ink-4)" fontWeight={700}>
                    {lang === "ro" ? "start" : "start"}
                  </text>
                </>
              );
            })()}
            <polyline
              fill="none"
              stroke={final >= 100 ? "var(--gain)" : "var(--loss)"}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={curve
                .map((v, i) => {
                  const x = (i / (N - 1)) * 320;
                  const y = H - ((v - lo) / Math.max(hi - lo, 1)) * (H - 12) - 6;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        </div>
      </div>
    </LabShell>
  );
}
