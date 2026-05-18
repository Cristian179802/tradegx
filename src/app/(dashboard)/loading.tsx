export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-zinc-800/80 rounded-xl" />
          <div className="h-4 w-36 bg-zinc-800/50 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-zinc-800/60 rounded-xl" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-800 rounded-lg" />
              <div className="h-7 w-7 bg-zinc-800 rounded-xl" />
            </div>
            <div className="h-7 w-28 bg-zinc-800 rounded-lg" />
            <div className="h-2 w-16 bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-72 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
        <div className="h-4 w-32 bg-zinc-800 rounded-lg" />
        <div className="flex-1 space-y-2 pt-4">
          {[90, 65, 80, 55, 70, 85, 60, 75, 90, 68].map((h, i) => (
            <div key={i} className="flex gap-1">
              <div className="h-1 bg-zinc-800/60 rounded" style={{ width: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800/60 flex gap-4">
          {[80, 60, 100, 60, 70].map((w, i) => (
            <div key={i} className="h-3 bg-zinc-800 rounded" style={{ width: w }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-4 py-3 border-b border-zinc-800/40 flex gap-4">
            {[80, 60, 100, 60, 70].map((w, j) => (
              <div key={j} className="h-3 bg-zinc-800/50 rounded" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
