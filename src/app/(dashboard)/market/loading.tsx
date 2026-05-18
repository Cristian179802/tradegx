export default function MarketLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-52 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-40 bg-zinc-800/70 rounded-xl animate-pulse" />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[60, 70, 80, 65, 90, 55].map((w, i) => (
          <div
            key={i}
            className="h-8 bg-zinc-800/70 rounded-xl animate-pulse"
            style={{ width: w, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>

      {/* Market grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 animate-pulse"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1.5">
                <div className="h-4 w-16 bg-zinc-800/80 rounded-lg" />
                <div className="h-3 w-20 bg-zinc-800/40 rounded" />
              </div>
              <div className="h-5 w-10 bg-zinc-800/60 rounded-full" />
            </div>
            {/* Mini chart */}
            <div className="h-10 flex items-end gap-0.5 mb-3">
              {Array.from({ length: 14 }, (_, j) => (
                <div
                  key={j}
                  className="flex-1 bg-zinc-800/50 rounded-sm"
                  style={{ height: `${25 + Math.sin(j * 0.5 + i) * 20 + 20}%` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-zinc-800 rounded-lg" />
              <div className="h-4 w-12 bg-zinc-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
