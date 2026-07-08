"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Această pagină randează propriul <html> → rulează în afara NextIntlClientProvider.
// Traducem printr-un dicționar inline citind cookie-ul `locale` (fallback ro).
const T = {
  ro: {
    title: "A apărut o eroare",
    desc: "Ceva nu a funcționat corect. Încearcă să reîmprospătezi pagina.",
    tryAgain: "Încearcă din nou",
  },
  en: {
    title: "An error occurred",
    desc: "Something went wrong. Try refreshing the page.",
    tryAgain: "Try again",
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const locale = typeof document !== "undefined" && /(?:^|;\s*)locale=en\b/.test(document.cookie) ? "en" : "ro";
  const t = T[locale as "ro" | "en"];

  return (
    <html>
      <body className="bg-zinc-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">{t.title}</h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            {t.desc}
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            {t.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
