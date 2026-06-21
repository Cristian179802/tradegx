export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-28 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-52 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-6 w-6 bg-zinc-800 rounded-lg" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded-md" />
            </div>
            <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
            <div className="h-2 w-14 bg-zinc-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-72 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse">
            <div className="h-4 w-36 bg-zinc-800 rounded-lg mb-4" />
            <div className="h-full max-h-52 flex items-end gap-1 pb-4">
              {Array.from({ length: 12 }, (_, j) => (
                <div key={j} className="flex-1 bg-zinc-800/60 rounded-t-md"
                  style={{ height: `${Math.random() * 60 + 30}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl animate-pulse" />
        <div className="h-64 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
