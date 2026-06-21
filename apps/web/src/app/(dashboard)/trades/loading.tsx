export default function TradesLoading() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-32 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        {[140, 100, 90, 80].map((w, i) => (
          <div key={i} className="h-9 bg-zinc-800/70 rounded-xl animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden">
        {/* Header */}
        <div className="h-10 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center gap-4 px-4">
          {[80, 60, 100, 70, 80, 80].map((w, i) => (
            <div key={i} className="h-3 bg-zinc-800 rounded-md animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-zinc-800/40 flex items-center gap-4 px-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-10 bg-zinc-800/80 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-zinc-800/60 rounded-md animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-zinc-800/50 rounded-md animate-pulse" />
            <div className="h-3 w-14 bg-zinc-800/50 rounded-md animate-pulse" />
            <div className="h-3 w-12 bg-zinc-800/50 rounded-md animate-pulse" />
            <div className="ml-auto h-4 w-16 bg-zinc-800/60 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
