export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
      </div>

      {/* KPI cards — 5 across */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 space-y-3 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="h-6 w-6 bg-zinc-800/80 rounded-lg" />
              <div className="h-3 w-14 bg-zinc-800/50 rounded-md" />
            </div>
            <div className="h-7 w-20 bg-zinc-800 rounded-lg" />
            <div className="h-1.5 w-full bg-zinc-800/60 rounded-full">
              <div className="h-1.5 bg-zinc-700/60 rounded-full" style={{ width: `${40 + i * 10}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Equity curve + recent trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity curve — wide */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-zinc-800 rounded-lg" />
              <div className="h-3 w-40 bg-zinc-800/50 rounded-md" />
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-7 w-12 bg-zinc-800/70 rounded-lg" />
              ))}
            </div>
          </div>
          {/* Chart area */}
          <div className="h-52 flex items-end gap-0.5 px-2">
            {Array.from({ length: 28 }, (_, j) => (
              <div
                key={j}
                className="flex-1 bg-zinc-800/40 rounded-t-sm"
                style={{ height: `${30 + Math.sin(j * 0.4) * 25 + j * 1.5}%` }}
              />
            ))}
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-2">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-2.5 w-8 bg-zinc-800/40 rounded" />
            ))}
          </div>
        </div>

        {/* Recent trades */}
        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse">
          <div className="h-4 w-32 bg-zinc-800 rounded-lg mb-4" />
          <div className="space-y-2.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-9 bg-zinc-800/80 rounded-md" />
                  <div className="space-y-1">
                    <div className="h-3 w-14 bg-zinc-800/70 rounded" />
                    <div className="h-2.5 w-10 bg-zinc-800/40 rounded" />
                  </div>
                </div>
                <div className="h-3.5 w-16 bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — pair perf + win/loss + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse space-y-3">
          <div className="h-4 w-36 bg-zinc-800 rounded-lg" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-3 w-12 bg-zinc-800/70 rounded" />
                <div className="h-3 w-14 bg-zinc-800/50 rounded" />
              </div>
              <div className="h-1.5 w-full bg-zinc-800/40 rounded-full">
                <div className="h-1.5 bg-zinc-700/60 rounded-full" style={{ width: `${90 - i * 15}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse">
          <div className="h-4 w-28 bg-zinc-800 rounded-lg mb-4" />
          <div className="flex items-center justify-center h-36">
            <div className="w-32 h-32 rounded-full border-[10px] border-zinc-800/60 bg-transparent" />
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="h-2.5 w-10 bg-zinc-800/50 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse space-y-3">
          <div className="h-4 w-24 bg-zinc-800 rounded-lg" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
              <div className="h-3 w-24 bg-zinc-800/50 rounded" />
              <div className="h-4 w-16 bg-zinc-800/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
