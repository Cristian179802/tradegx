"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-100">Ceva a mers greșit</h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          A apărut o eroare neașteptată. Dacă problema persistă, reîncarcă pagina sau contactează suportul.
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-600 font-mono">ID eroare: {error.digest}</p>
        )}
      </div>

      <Button
        onClick={reset}
        variant="outline"
        className="border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Încearcă din nou
      </Button>
    </div>
  );
}
