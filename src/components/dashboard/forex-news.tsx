"use client";

import * as React from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "acum";
  if (diff < 3600) return `acum ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
  return `acum ${Math.floor(diff / 86400)}z`;
}

export function ForexNews({ className }: { className?: string }) {
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/forex-news", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
      if (!data.items || data.items.length === 0) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60_000); // reîmprospătare la 5 min
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className={cn("bg-zinc-900/80 border border-zinc-800/70 rounded-2xl overflow-hidden premium-card flex flex-col", className)}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/12 border border-sky-500/20 flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <h2 className="text-sm font-bold text-zinc-200">Știri de Piață</h2>
          <span className="live-dot" />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Reîmprospătează"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Listă */}
      <div className="flex-1 overflow-y-auto max-h-[420px] sidebar-scroll">
        {loading && items.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-zinc-800/60 rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
            <Newspaper className="w-7 h-7 text-zinc-700" />
            <p className="text-sm text-zinc-500">Știrile nu sunt disponibile momentan</p>
            <button onClick={load} className="text-xs text-sky-400 hover:text-sky-300 mt-1">
              Încearcă din nou
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {items.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-5 py-3 hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <p className="text-xs font-medium text-zinc-200 leading-snug flex-1 group-hover:text-white transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-sky-400 shrink-0 mt-0.5 transition-colors" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold text-sky-500/80">{item.source}</span>
                  <span className="text-zinc-700 text-[10px]">·</span>
                  <span className="text-[10px] text-zinc-600">{timeAgo(item.pubDate)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
