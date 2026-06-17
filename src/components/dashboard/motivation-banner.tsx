"use client";

import * as React from "react";
import { Quote, X } from "lucide-react";

// ── Banner motivațional zilnic ────────────────────────────────────────────────
// Un citat diferit în fiecare zi, ales determinist pe baza zilei anului
// (același pentru toți utilizatorii într-o zi, se schimbă automat la miezul nopții).

const QUOTES: { text: string; author: string }[] = [
  { text: "Piața recompensează răbdarea, nu graba. Cele mai bune tranzacții se așteaptă, nu se forțează.", author: "Disciplină" },
  { text: "Nu trebuie să prinzi fiecare mișcare. Trebuie doar să o prinzi pe a ta.", author: "Mindset" },
  { text: "Riscul vine din a nu ști ce faci.", author: "Warren Buffett" },
  { text: "Planifică tranzacția și tranzacționează planul.", author: "Regula de aur" },
  { text: "Un trader bun nu prezice — reacționează la ce face prețul.", author: "Price Action" },
  { text: "Pierderile mici sunt costul de a rămâne în joc. Acceptă-le rapid.", author: "Risk Management" },
  { text: "Disciplina cântărește mai mult decât orice strategie.", author: "Psihologie" },
  { text: "Capitalul tău e muniția. Fără el, nu mai poți trage niciun foc.", author: "Protecția contului" },
  { text: "Cele mai scumpe cuvinte din trading sunt: de data asta e diferit.", author: "Lecție" },
  { text: "Nu te căsători cu o poziție. Adevărul e în chart, nu în ego.", author: "Obiectivitate" },
  { text: "Răbdarea de a aștepta setup-ul perfect e o poziție în sine.", author: "Sniper mindset" },
  { text: "Tranzacționează ca un robot, analizează ca un om.", author: "Execuție" },
  { text: "Consistența bate intensitatea. 1% pe zi schimbă totul.", author: "Compounding" },
  { text: "Nu suma câștigată contează, ci cât de bine ți-ai respectat regulile.", author: "Proces peste rezultat" },
  { text: "Un setup ratat nu te costă nimic. Un setup forțat te poate costa contul.", author: "Răbdare" },
  { text: "Stop-loss-ul nu e o slăbiciune — e centura ta de siguranță.", author: "Risk" },
  { text: "Emoțiile sunt cel mai scump indicator. Învață să le ignori.", author: "Psihologie" },
  { text: "Marii traderi nu au mereu dreptate — pierd mic și câștigă mare.", author: "Asimetrie" },
  { text: "Procesul corect, repetat, produce inevitabil rezultate corecte.", author: "Consistență" },
  { text: "Când nu ești sigur, stai pe margine. Cash-ul e tot o poziție.", author: "Răbdare" },
  { text: "Jurnalul tău de azi e mentorul tău de mâine.", author: "Reflecție" },
  { text: "Controlează riscul și profitul se va îngriji singur de el.", author: "Risk first" },
  { text: "Frica și lăcomia mută banii din contul nerăbdătorului în al celui disciplinat.", author: "Mindset" },
  { text: "Nu există tranzacții sigure. Există doar probabilități gestionate corect.", author: "Probabilitate" },
  { text: "Revenge trading-ul transformă o pierdere mică într-un dezastru. Oprește-te.", author: "Disciplină" },
  { text: "Un trader profesionist gândește în R, nu în bani.", author: "Risk:Reward" },
  { text: "Calitatea setup-urilor, nu cantitatea tranzacțiilor.", author: "Mai puțin înseamnă mai mult" },
  { text: "Acceptă că vei pierde. Apoi concentrează-te pe a pierde inteligent.", author: "Acceptare" },
  { text: "Cea mai bună tranzacție de azi poate fi cea pe care nu ai făcut-o.", author: "Selectivitate" },
  { text: "Backtestează-ți încrederea înainte să-ți riști capitalul.", author: "Pregătire" },
  { text: "Piața va fi acolo și mâine. Tu vei fi, dacă îți protejezi capitalul.", author: "Supraviețuire" },
  { text: "Disciplina înseamnă să faci ce trebuie, mai ales când nu-ți vine.", author: "Caracter" },
];

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function MotivationBanner() {
  const [hidden, setHidden] = React.useState(true);
  const quote = QUOTES[dayOfYear() % QUOTES.length];

  React.useEffect(() => {
    // Ascuns doar pentru ziua curentă, dacă utilizatorul l-a închis
    const key = `motivation-dismissed-${new Date().toISOString().slice(0, 10)}`;
    setHidden(localStorage.getItem(key) === "1");
  }, []);

  function dismiss() {
    const key = `motivation-dismissed-${new Date().toISOString().slice(0, 10)}`;
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
      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
        <Quote className="w-4 h-4 text-indigo-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 font-medium leading-snug">{quote.text}</p>
        <p className="text-[11px] text-indigo-400/80 mt-0.5 font-semibold">— {quote.author}</p>
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
