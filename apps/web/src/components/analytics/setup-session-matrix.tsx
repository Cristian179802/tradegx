"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Grid3x3, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { RollingNumber } from "@/components/ui/rolling-number";
import {
  agregaCelule,
  esantionMic,
  PRAG_ESANTION,
  type CelulaCrossTab,
} from "@/lib/analytics/cross-tab";

// ── Setup × Sesiune ──────────────────────────────────────────────────────────
//
// Restul paginii răspunde la „ce setup merge?" și „ce sesiune merge?". Aici se
// răspunde la întrebarea care le combină, și care de obicei schimbă concluzia:
// un setup mediocru pe total poate fi excelent la o oră și dezastruos la alta.
//
// TREI DECIZII DE INTERFAȚĂ:
//
// 1. MATRICEA E ȘI COMANDA. Nu există un rând de filtre separat de tabel —
//    apeși pe o celulă și ai filtrat pe setup ȘI pe sesiune; pe un antet de
//    rând, doar pe setup. Un tabel care doar afișează te obligă să traduci
//    singur ce vezi în ce trebuie să selectezi.
//
// 2. CIFRELE SE ROSTOGOLESC. `RollingNumber` există deja în aplicație și face
//    exact ce trebuie: la schimbarea filtrului, cifrele se recalculează sub
//    ochii tăi în loc să sară. Diferența dintre „s-a schimbat ceva" și „am
//    văzut ce s-a schimbat".
//
// 3. EȘANTIONUL MIC E MARCAT, NU ASCUNS. O celulă cu 3 tranzacții rămâne
//    vizibilă, dar dungată și fără culoare de performanță. Ascunsă, ai crede
//    că nu există date; colorată, ai crede un procent care nu înseamnă nimic.

const SETUP_LABELS: Record<string, string> = {
  ORDER_BLOCK: "OB",
  FAIR_VALUE_GAP: "FVG",
  LIQUIDITY_SWEEP: "Sweep",
  BOS: "BOS",
  CHOCH: "CHoCH",
  BREAKER: "Breaker",
  MITIGATION: "Mitig.",
  REJECTION: "Reject.",
  TREND_FOLLOW: "Trend",
  SCALP: "Scalp",
  OTHER: "Other",
};

/** Ordinea coloanelor urmărește ziua de tranzacționare, nu alfabetul. */
const SESIUNI = ["ASIAN", "LONDON", "NEW_YORK", "OVERLAP"] as const;

const SESSION_LABELS: Record<string, string> = {
  ASIAN: "Asia",
  LONDON: "London",
  NEW_YORK: "New York",
  OVERLAP: "Overlap",
};

/** Culoarea unei celule: verde peste medie, roșu sub. Neutru la eșantion mic. */
function culoareCelula(winRate: number | null, mic: boolean): React.CSSProperties {
  if (winRate == null || mic) return {};
  // Referința e 50%, nu media utilizatorului: o celulă „peste media ta" ar fi
  // verde chiar și când pierzi bani pe ea.
  const delta = Math.max(-25, Math.min(25, winRate - 50)) / 25;
  const c = delta >= 0 ? "52,211,153" : "251,92,114";
  return { background: `rgba(${c},${(Math.abs(delta) * 0.16).toFixed(3)})` };
}

export function SetupSessionMatrix({
  celule,
  currency = "USD",
}: {
  celule: CelulaCrossTab[];
  currency?: string;
}) {
  const t = useTranslations("crossTab");
  const [setupuri, setSetupuri] = React.useState<string[]>([]);
  const [sesiuni, setSesiuni] = React.useState<string[]>([]);

  // Doar liniile și coloanele care CHIAR au date. Un tabel 11×4 gol pe
  // trei sferturi arată ca o funcție stricată, nu ca un tabel.
  const setupuriPrezente = React.useMemo(
    () =>
      [...new Set(celule.map((c) => c.setup))].sort(
        (a, b) =>
          celule.filter((c) => c.setup === b).reduce((s, c) => s + c.tranzactii, 0) -
          celule.filter((c) => c.setup === a).reduce((s, c) => s + c.tranzactii, 0)
      ),
    [celule]
  );
  const sesiuniPrezente = React.useMemo(
    () => SESIUNI.filter((s) => celule.some((c) => c.sesiune === s)),
    [celule]
  );

  const activ = agregaCelule(celule, { setupuri, sesiuni });
  const areFiltru = setupuri.length > 0 || sesiuni.length > 0;

  const comuta = (lista: string[], set: (v: string[]) => void, v: string) =>
    set(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  const alegeCelula = (setup: string, sesiune: string) => {
    // A doua apăsare pe aceeași celulă anulează — altfel trebuie să cauți
    // butonul de reset ca să ieși din ceva ce ai deschis cu un singur clic.
    const aceeasi =
      setupuri.length === 1 && setupuri[0] === setup && sesiuni.length === 1 && sesiuni[0] === sesiune;
    setSetupuri(aceeasi ? [] : [setup]);
    setSesiuni(aceeasi ? [] : [sesiune]);
  };

  const reset = () => {
    setSetupuri([]);
    setSesiuni([]);
  };

  const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);
  const bani = (v: number) => formatCurrency(v, currency);

  if (celule.length === 0) {
    return (
      <section className="tg-surface rounded-2xl p-5">
        <Antet t={t} />
        <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="tg-surface rounded-2xl overflow-hidden" data-testid="setup-session-matrix">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <Antet t={t} />
          {areFiltru && (
            <button
              onClick={reset}
              className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] transition-colors px-2 py-1 rounded-md hover:bg-[color:var(--s-4)]"
            >
              <RotateCcw className="w-3 h-3" /> {t("reset")}
            </button>
          )}
        </div>

        {/* Ce e selectat acum, în cuvinte. Chip-urile din tabel arată SELECȚIA,
            dar la un tabel de 40 de celule vrei și propoziția. */}
        <p className="mt-2.5 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
          {areFiltru
            ? t("filtering", {
                setup: setupuri.length ? setupuri.map((s) => SETUP_LABELS[s] ?? s).join(" + ") : t("allSetups"),
                session: sesiuni.length ? sesiuni.map((s) => SESSION_LABELS[s] ?? s).join(" + ") : t("allSessions"),
              })
            : t("hint")}
        </p>
      </div>

      {/* ── Banda de statistici: aici se vede recalcularea ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[color:var(--line-1)] border-y border-[color:var(--line-1)]">
        <Statistica eticheta={t("trades")} valoare={String(activ.tranzactii)} testid="stat-trades" />
        <Statistica
          eticheta={t("winRate")}
          testid="stat-winrate"
          valoare={pct(activ.winRate)}
          ton={activ.winRate == null ? "ink" : activ.winRate >= 50 ? "gain" : "loss"}
        />
        <Statistica
          eticheta={t("expectancy")}
          testid="stat-expectancy"
          valoare={activ.expectancyR == null ? "—" : `${activ.expectancyR >= 0 ? "+" : ""}${activ.expectancyR.toFixed(2)}R`}
          ton={activ.expectancyR == null ? "ink" : activ.expectancyR >= 0 ? "gain" : "loss"}
        />
        <Statistica
          eticheta={t("net")}
          testid="stat-net"
          valoare={bani(activ.net)}
          ton={activ.net === 0 ? "ink" : activ.net > 0 ? "gain" : "loss"}
        />
      </div>

      {/* ── Matricea ── */}
      <div className="p-5 pt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-[76px]" />
              {sesiuniPrezente.map((s) => (
                <th key={s} className="p-0">
                  <button
                    data-testid={`session-filter-${s.toLowerCase()}`}
                    onClick={() => comuta(sesiuni, setSesiuni, s)}
                    className={cn(
                      "w-full rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors",
                      sesiuni.includes(s)
                        ? "text-[color:var(--ink-1)]"
                        : "text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] hover:bg-[color:var(--s-3)]"
                    )}
                    style={
                      sesiuni.includes(s)
                        ? { background: "var(--accent-soft)", boxShadow: "inset 0 0 0 1px var(--accent-line)" }
                        : undefined
                    }
                  >
                    {SESSION_LABELS[s] ?? s}
                  </button>
                </th>
              ))}
              <th className="w-[62px] px-2 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)]">
                {t("total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {setupuriPrezente.map((setup) => {
              const totalRand = agregaCelule(celule, { setupuri: [setup] });
              return (
                <tr key={setup}>
                  <th className="p-0">
                    <button
                      data-testid={`setup-filter-${setup.toLowerCase()}`}
                      onClick={() => comuta(setupuri, setSetupuri, setup)}
                      className={cn(
                        "w-full rounded-lg px-2 py-2 text-left text-[11px] font-bold transition-colors",
                        setupuri.includes(setup)
                          ? "text-[color:var(--ink-1)]"
                          : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)] hover:bg-[color:var(--s-3)]"
                      )}
                      style={
                        setupuri.includes(setup)
                          ? { background: "var(--accent-soft)", boxShadow: "inset 0 0 0 1px var(--accent-line)" }
                          : undefined
                      }
                    >
                      {SETUP_LABELS[setup] ?? setup}
                    </button>
                  </th>

                  {sesiuniPrezente.map((sesiune) => {
                    const c = celule.find((x) => x.setup === setup && x.sesiune === sesiune);
                    const n = c?.tranzactii ?? 0;
                    const wr = n ? ((c!.castiguri / n) * 100) : null;
                    const mic = esantionMic(n);
                    const selectata =
                      setupuri.includes(setup) && sesiuni.includes(sesiune) && setupuri.length === 1 && sesiuni.length === 1;

                    return (
                      <td key={sesiune} className="p-0">
                        <button
                          data-testid={`cell-${setup.toLowerCase()}-${sesiune.toLowerCase()}`}
                          onClick={() => n > 0 && alegeCelula(setup, sesiune)}
                          disabled={n === 0}
                          title={mic ? t("smallSampleTip", { n, prag: PRAG_ESANTION }) : undefined}
                          className={cn(
                            "w-full rounded-lg py-2 px-1 transition-all border",
                            n === 0
                              ? "border-transparent cursor-default"
                              : "border-[color:var(--line-1)] hover:border-[color:var(--accent-line)] cursor-pointer",
                            selectata && "border-[color:var(--accent)]"
                          )}
                          style={{
                            ...culoareCelula(wr, mic),
                            ...(mic && n > 0
                              ? {
                                  backgroundImage:
                                    "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.035) 4px, rgba(255,255,255,0.035) 8px)",
                                }
                              : {}),
                          }}
                        >
                          {n === 0 ? (
                            <span className="block text-[12px] text-[color:var(--ink-4)] opacity-40">—</span>
                          ) : (
                            <>
                              <span
                                className={cn(
                                  "block text-[13px] font-bold tabular-nums",
                                  mic ? "text-[color:var(--ink-3)]" : "text-[color:var(--ink-1)]"
                                )}
                              >
                                {wr!.toFixed(0)}%
                              </span>
                              <span className="block text-[9.5px] text-[color:var(--ink-4)] tabular-nums mt-0.5">
                                {mic && <Info className="inline w-2.5 h-2.5 mr-0.5 -mt-px" />}
                                {n}
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-2 text-right">
                    <span className="block text-[12px] font-bold tabular-nums text-[color:var(--ink-2)]">
                      {pct(totalRand.winRate)}
                    </span>
                    <span className="block text-[9.5px] text-[color:var(--ink-4)] tabular-nums">
                      {totalRand.tranzactii}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          {t("smallSampleLegend", { prag: PRAG_ESANTION })}
        </p>
      </div>
    </section>
  );
}

function Antet({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div
        className="w-7 h-7 shrink-0 rounded-lg grid place-items-center"
        style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}
      >
        <Grid3x3 className="w-3.5 h-3.5 text-[color:var(--accent)]" />
      </div>
      <div className="min-w-0">
        <h2 className="text-[14px] font-bold text-[color:var(--ink-1)] leading-tight">{t("title")}</h2>
        <p className="text-[11px] text-[color:var(--ink-4)] mt-0.5">{t("subtitle")}</p>
      </div>
    </div>
  );
}

function Statistica({
  eticheta,
  valoare,
  ton = "ink",
  testid,
}: {
  eticheta: string;
  valoare: string;
  ton?: "ink" | "gain" | "loss";
  testid?: string;
}) {
  const color = ton === "gain" ? "var(--gain)" : ton === "loss" ? "var(--loss)" : "var(--ink-1)";
  return (
    <div className="bg-[color:var(--s-2)] px-4 py-3.5 min-w-0" data-testid={testid} data-value={valoare}>
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] leading-tight text-[color:var(--ink-4)] mb-1.5">
        {eticheta}
      </p>
      {/* Cheia recalculării vizibile: cifrele se rostogolesc la fiecare
          schimbare de filtru, în loc să sară dintr-o valoare în alta.
          Culoarea se dă pe părinte — coloanele de cifre o moștenesc. */}
      <span style={{ color }}>
        <RollingNumber
          value={valoare}
          duration={620}
          stagger={38}
          className="text-[19px] md:text-[21px] font-display font-black leading-none"
        />
      </span>
    </div>
  );
}
