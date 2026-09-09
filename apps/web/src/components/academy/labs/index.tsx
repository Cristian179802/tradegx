"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { LabRef, Lang } from "@/lib/academy/types";
import { DrawdownLab, ExpectancyLab, RiskLab } from "./risk-labs";

// ── Dispecerul de laboratoare ────────────────────────────────────────────────
//
// Lecția declară ce laborator vrea, ca DATE (`lab: { kind: "risk-lab" }`).
// Aici se face traducerea în componentă. Beneficiul: conținutul rămâne JSON
// serializabil, deci poate pleca spre aplicația mobilă neatins, iar web-ul
// decide singur cum îl randează.
//
// Laboratoarele grele se încarcă la cerere: cel de grafic aduce
// lightweight-charts (~50 kB), și n-are rost plătit de cineva care citește
// lecția de psihologie.

const ChartLab = React.lazy(() => import("./chart-lab").then((m) => ({ default: m.ChartLab })));
const PatternDrill = React.lazy(() => import("./drills").then((m) => ({ default: m.PatternDrill })));
const SlDrill = React.lazy(() => import("./drills").then((m) => ({ default: m.SlDrill })));

function LabSkeleton() {
  return (
    <div className="my-6 rounded-2xl border border-[color:var(--line-2)] bg-[color:var(--s-2)] h-[320px] grid place-items-center">
      <Loader2 className="w-5 h-5 animate-spin text-[color:var(--ink-4)]" />
    </div>
  );
}

export function Lab({ lab, lang }: { lab: LabRef; lang: Lang }) {
  switch (lab.kind) {
    case "risk-lab":
      return <RiskLab lang={lang} preset={lab.preset} />;
    case "drawdown-lab":
      return <DrawdownLab lang={lang} />;
    case "expectancy-lab":
      return <ExpectancyLab lang={lang} preset={lab.preset} />;
    case "chart-lab":
      return (
        <React.Suspense fallback={<LabSkeleton />}>
          <ChartLab lang={lang} symbol={lab.symbol} tf={lab.tf} overlays={lab.overlays} focus={lab.focus} />
        </React.Suspense>
      );
    case "pattern-drill":
      return (
        <React.Suspense fallback={<LabSkeleton />}>
          <PatternDrill lang={lang} patterns={lab.patterns} />
        </React.Suspense>
      );
    case "sl-drill":
      return (
        <React.Suspense fallback={<LabSkeleton />}>
          <SlDrill lang={lang} />
        </React.Suspense>
      );
    default:
      // Un `kind` necunoscut (conținut mai nou decât codul) nu strică lecția:
      // secțiunea se citește în continuare, doar fără laborator.
      return null;
  }
}
