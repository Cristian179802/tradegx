"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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

  return (
    <html>
      <body className="bg-zinc-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">A apărut o eroare</h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            Ceva nu a funcționat corect. Încearcă să reîmprospătezi pagina.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Încearcă din nou
          </button>
        </div>
      </body>
    </html>
  );
}
