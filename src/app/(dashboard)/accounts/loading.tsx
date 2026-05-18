export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-52 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
      </div>

      {/* Account cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Account header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800/80 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-zinc-800 rounded-lg" />
                  <div className="h-3 w-16 bg-zinc-800/50 rounded" />
                </div>
              </div>
              <div className="h-5 w-12 bg-zinc-800/60 rounded-full" />
            </div>

            {/* Balance */}
            <div className="mb-4">
              <div className="h-2.5 w-16 bg-zinc-800/40 rounded mb-1.5" />
              <div className="h-8 w-32 bg-zinc-800 rounded-xl" />
            </div>

            {/* P&L row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-zinc-800/40 rounded-xl p-3">
                <div className="h-2.5 w-10 bg-zinc-800/60 rounded mb-1.5" />
                <div className="h-5 w-16 bg-zinc-800/80 rounded-lg" />
              </div>
              <div className="flex-1 bg-zinc-800/40 rounded-xl p-3">
                <div className="h-2.5 w-10 bg-zinc-800/60 rounded mb-1.5" />
                <div className="h-5 w-12 bg-zinc-800/80 rounded-lg" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-zinc-800/40 rounded-full mb-4" />

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="h-3 w-20 bg-zinc-800/40 rounded" />
              <div className="flex gap-1.5">
                <div className="h-7 w-7 bg-zinc-800/60 rounded-lg" />
                <div className="h-7 w-7 bg-zinc-800/60 rounded-lg" />
              </div>
            </div>
          </div>
        ))}

        {/* Add account card placeholder */}
        <div className="border-2 border-dashed border-zinc-800/60 rounded-2xl p-5 animate-pulse flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-zinc-800/40 rounded-xl mx-auto" />
            <div className="h-3 w-28 bg-zinc-800/30 rounded mx-auto" />
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3.5 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="h-2.5 w-20 bg-zinc-800/50 rounded mb-2" />
            <div className="h-6 w-24 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
