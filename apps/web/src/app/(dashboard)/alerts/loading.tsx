export default function AlertsLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-28 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-52 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-zinc-800/60 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { color: "bg-rose-500/15" },
          { color: "bg-amber-500/15" },
          { color: "bg-indigo-500/15" },
          { color: "bg-emerald-500/15" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-6 w-6 ${item.color} rounded-lg`} />
              <div className="h-2.5 w-16 bg-zinc-800/50 rounded" />
            </div>
            <div className="h-7 w-10 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2.5">
        {[100, 80, 90, 70].map((w, i) => (
          <div key={i} className="h-8 bg-zinc-800/60 rounded-xl animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl px-5 py-4 flex items-start gap-4 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Severity icon */}
            <div className="w-8 h-8 rounded-xl bg-zinc-800/80 shrink-0 mt-0.5" />
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-36 bg-zinc-800/80 rounded-lg" />
                <div className="h-4 w-12 bg-zinc-800/50 rounded-full" />
              </div>
              <div className="h-3 w-full bg-zinc-800/40 rounded" />
              <div className="h-3 w-2/3 bg-zinc-800/30 rounded" />
              <div className="h-2.5 w-20 bg-zinc-800/30 rounded" />
            </div>
            {/* Actions */}
            <div className="flex gap-1.5 shrink-0">
              <div className="h-7 w-7 bg-zinc-800/50 rounded-lg" />
              <div className="h-7 w-7 bg-zinc-800/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
