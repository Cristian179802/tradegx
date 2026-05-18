export default function ChartsLoading() {
  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-32 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-44 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 bg-zinc-800/70 rounded-xl animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      </div>

      {/* Symbol search + timeframe bar */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-48 bg-zinc-800/70 rounded-xl animate-pulse" />
        <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-0.5">
          {["1M", "5M", "15M", "1H", "4H", "1D", "1W"].map((tf) => (
            <div key={tf} className="h-7 w-9 bg-zinc-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-7 bg-zinc-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden animate-pulse" style={{ height: "calc(100% - 120px)", minHeight: 400 }}>
        {/* Price axis + chart */}
        <div className="flex h-full">
          <div className="flex-1 flex flex-col h-full p-4">
            {/* Fake OHLC candlesticks */}
            <div className="flex-1 flex items-end gap-1 pb-8">
              {Array.from({ length: 60 }, (_, i) => {
                const h = 30 + Math.sin(i * 0.3) * 20 + Math.random() * 15;
                const bodyH = h * 0.5 + Math.random() * 10;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                    <div className="w-px bg-zinc-700/40" style={{ height: `${h}%` }} />
                    <div
                      className={`w-full rounded-sm ${i % 3 === 0 ? "bg-emerald-500/20" : "bg-rose-500/20"}`}
                      style={{ height: `${bodyH}%` }}
                    />
                  </div>
                );
              })}
            </div>
            {/* X-axis */}
            <div className="flex justify-between px-2 border-t border-zinc-800/40 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-2.5 w-10 bg-zinc-800/40 rounded" />
              ))}
            </div>
          </div>
          {/* Y-axis */}
          <div className="w-16 border-l border-zinc-800/40 flex flex-col justify-between py-4 px-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-2.5 w-12 bg-zinc-800/40 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
