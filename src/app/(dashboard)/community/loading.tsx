export default function CommunityLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-60 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-zinc-800/70 rounded-xl animate-pulse" />
          <div className="h-9 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-1 w-fit animate-pulse">
        {[80, 70, 60].map((w, i) => (
          <div key={i} className="h-7 bg-zinc-800/70 rounded-lg" style={{ width: w }} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Post header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/80" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-zinc-800/70 rounded" />
                  <div className="h-2.5 w-20 bg-zinc-800/40 rounded" />
                </div>
                <div className="ml-auto h-5 w-16 bg-zinc-800/50 rounded-full" />
              </div>
              {/* Content */}
              <div className="space-y-2 mb-4">
                <div className="h-4 w-48 bg-zinc-800/80 rounded-lg" />
                <div className="h-3 w-full bg-zinc-800/40 rounded" />
                <div className="h-3 w-4/5 bg-zinc-800/30 rounded" />
              </div>
              {/* Footer */}
              <div className="flex items-center gap-4">
                <div className="h-3 w-12 bg-zinc-800/40 rounded" />
                <div className="h-3 w-14 bg-zinc-800/40 rounded" />
                <div className="h-3 w-10 bg-zinc-800/30 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top traders */}
          <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 animate-pulse">
            <div className="h-4 w-28 bg-zinc-800/80 rounded-lg mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <div className="h-3 w-4 bg-zinc-800/40 rounded" />
                <div className="w-7 h-7 rounded-lg bg-zinc-800/70" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-zinc-800/60 rounded" />
                  <div className="h-2.5 w-12 bg-zinc-800/30 rounded" />
                </div>
                <div className="h-3.5 w-14 bg-zinc-800/50 rounded" />
              </div>
            ))}
          </div>
          {/* Teams */}
          <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 animate-pulse">
            <div className="h-4 w-20 bg-zinc-800/80 rounded-lg mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800/70" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-zinc-800/60 rounded" />
                  <div className="h-2.5 w-16 bg-zinc-800/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
