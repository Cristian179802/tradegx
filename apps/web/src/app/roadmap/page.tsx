import type { Metadata } from "next";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Roadmap public — TradeGx",
  description: "Ce am livrat, ce construim acum și ce urmează. TradeGx se dezvoltă în public.",
};

// Roadmap-ul REAL al produsului — actualizat la fiecare lansare majoră.
const SHIPPED: string[] = [
  "Jurnal complet cu etichetare SMC/ICT (OB, FVG, BOS, CHoCH, killzones)",
  "Sincronizare automată broker: EA gratuit MT4/MT5 + MetaAPI cloud 24/7",
  "Dashboard cu 40+ metrici, curbă equity, streak-uri",
  "AI Trading Coach + detecție revenge trading / overtrading pe tranzacții reale",
  "Semnale AI (HPS) — max 3/zi, cu difuzare Telegram",
  "Backtesting pe date istorice reale + builder de strategii cu 15+ indicatori",
  "„Testează instant” — backtest în 3 click-uri, fără configurare",
  "Academia TradeGx: 41 lecții RO/EN, 47 diagrame, quiz-uri + certificat",
  "Edge Finder — edge-urile și leak-urile tale, dovedite statistic",
  "Simulator Monte Carlo — probabilitatea de a trece un challenge prop firm",
  "Raport AI săptămânal (in-app + Telegram)",
  "Alerte de preț pe watchlist + webhook TradingView",
  "Calculator lot, checklist pre-trade, obiective lunare, monitor prop firm",
  "Calendar economic + știri clasificate după impact",
  "Export PDF, partajare publică a tranzacțiilor, comunitate",
  "Aplicație Android + PWA instalabilă (desktop & iPhone)",
  "Command palette (Ctrl+K), temă dark premium, design responsive",
  "Realizări & streak-uri de disciplină — calculate din datele tale reale",
  "AI Vision — analiza AI vede graficele atașate tranzacției (structură, intrare, SL)",
  "Comutator de limbă RO/EN — navigarea și Academia complet bilingve",
];

const IN_PROGRESS: string[] = [
  "Interfață completă în engleză — paginile individuale, în etape",
];

const PLANNED: string[] = [
  "Notificări push native pe telefon (cu aplicația închisă)",
  "Autentificare în doi pași (2FA)",
  "Leaderboard comunitate cu track-record verificat din sync",
  "Prețuri realtime prin WebSocket",
  "Integrări noi: cTrader, TradeLocker, DXtrade",
  "Traduceri: germană, franceză, spaniolă, italiană",
  "Rapoarte fiscale pentru România",
];

function List({
  items,
  icon: Icon,
  iconClass,
}: {
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function RoadmapPage() {
  return (
    <LegalPage title="Roadmap public" updated="5 iulie 2026 (seara)">
      <p className="text-sm leading-relaxed text-zinc-400 -mt-4">
        TradeGx se construiește în public. Aici vezi exact ce e livrat, ce e în lucru și ce
        urmează — fără promisiuni vagi. Ai o idee?{" "}
        <a href="/contact" className="text-indigo-400 hover:text-indigo-300">Spune-ne</a> — cele
        mai cerute funcții urcă în listă.
      </p>

      <section>
        <h2 className="text-base font-bold text-emerald-400 mb-4">
          ✅ Livrat — funcțional azi, în producție
        </h2>
        <List items={SHIPPED} icon={CheckCircle2} iconClass="text-emerald-400" />
      </section>

      <section>
        <h2 className="text-base font-bold text-amber-400 mb-4">🔨 În lucru acum</h2>
        <List items={IN_PROGRESS} icon={Loader2} iconClass="text-amber-400" />
      </section>

      <section>
        <h2 className="text-base font-bold text-zinc-300 mb-4">🗺️ Urmează</h2>
        <List items={PLANNED} icon={Circle} iconClass="text-zinc-600" />
      </section>
    </LegalPage>
  );
}
