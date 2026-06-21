export default function BacktestingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-32 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-56 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-40 bg-zinc-800/80 rounded-xl animate-pulse" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 bg-zinc-800/80 rounded-lg" />
              <div className="h-2.5 w-20 bg-zinc-800/50 rounded" />
            </div>
            <div className="h-7 w-24 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Backtests table */}
      <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden animate-pulse">
        {/* Table header */}
        <div className="h-11 border-b border-zinc-800/80 bg-zinc-900 flex items-center gap-4 px-5">
          {[120, 80, 80, 70, 70, 60].map((w, i) => (
            <div key={i} className="h-3 bg-zinc-800/60 rounded" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/30 last:border-0"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 bg-zinc-800/70 rounded-lg" />
              <div className="h-3 w-24 bg-zinc-800/40 rounded" />
            </div>
            <div className="h-5 w-14 bg-zinc-800/60 rounded-full" />
            <div className="h-4 w-16 bg-zinc-800/60 rounded" />
            <div className="h-4 w-12 bg-zinc-800/50 rounded" />
            <div className="h-4 w-14 bg-zinc-800/50 rounded" />
            <div className="ml-auto flex gap-1.5">
              <div className="h-7 w-7 bg-zinc-800/50 rounded-lg" />
              <div className="h-7 w-7 bg-zinc-800/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
