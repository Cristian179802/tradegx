export default function JournalLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-40 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-56 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-zinc-800/70 rounded-xl animate-pulse" />
          <div className="h-8 w-20 bg-zinc-800/50 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3.5 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 bg-zinc-800/80 rounded-md" />
              <div className="h-2.5 w-16 bg-zinc-800/50 rounded" />
            </div>
            <div className="h-6 w-20 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-48 bg-zinc-800/70 rounded-xl animate-pulse" />
        <div className="h-9 w-32 bg-zinc-800/60 rounded-xl animate-pulse" />
        <div className="h-9 w-28 bg-zinc-800/50 rounded-xl animate-pulse" />
        <div className="ml-auto h-9 w-32 bg-zinc-800/50 rounded-xl animate-pulse" />
      </div>

      {/* Journal entries list */}
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden animate-pulse"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Direction badge */}
              <div className="h-6 w-10 bg-zinc-800/80 rounded-lg flex-shrink-0" />

              {/* Symbol + time */}
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-16 bg-zinc-800/80 rounded-lg" />
                <div className="h-3 w-28 bg-zinc-800/40 rounded" />
              </div>

              {/* Emotion badge */}
              <div className="h-6 w-20 bg-zinc-800/60 rounded-lg" />

              {/* Stats */}
              <div className="hidden lg:flex items-center gap-6">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-1 text-right">
                    <div className="h-2.5 w-12 bg-zinc-800/40 rounded ml-auto" />
                    <div className="h-4 w-16 bg-zinc-800/70 rounded" />
                  </div>
                ))}
              </div>

              {/* Journal indicator */}
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-zinc-800/60 rounded-md" />
                <div className="h-5 w-5 bg-zinc-800/60 rounded-md" />
              </div>

              {/* Expand arrow */}
              <div className="h-5 w-5 bg-zinc-800/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
