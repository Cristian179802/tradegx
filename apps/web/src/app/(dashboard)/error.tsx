"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPages");
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center px-4">
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-rose-500/8 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-rose-500/5 blur-xl" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-black text-zinc-100 tracking-tight">{t("somethingWrong")}</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          {t("unexpectedDesc")}
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-700 font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 mt-2 inline-block">
            ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          asChild
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-2"
        >
          <Link href="/dashboard">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>
        <Button
          onClick={reset}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
