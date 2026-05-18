export default function CalculatorLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-7 w-40 bg-zinc-800/80 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Calculator form */}
        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-6 animate-pulse space-y-5">
          <div className="h-5 w-40 bg-zinc-800/80 rounded-lg" />

          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-zinc-800/50 rounded" />
              <div className="h-10 w-full bg-zinc-800/60 rounded-xl" />
            </div>
          ))}

          <div className="h-11 w-full bg-zinc-800/80 rounded-xl" />
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Main result */}
          <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-6 animate-pulse">
            <div className="h-4 w-28 bg-zinc-800/60 rounded mb-4" />
            <div className="h-14 w-40 bg-zinc-800 rounded-2xl mb-2" />
            <div className="h-3 w-32 bg-zinc-800/40 rounded" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-4 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="h-2.5 w-20 bg-zinc-800/50 rounded mb-2.5" />
                <div className="h-6 w-24 bg-zinc-800 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Info card */}
          <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 animate-pulse space-y-2">
            <div className="h-3 w-full bg-zinc-800/40 rounded" />
            <div className="h-3 w-3/4 bg-zinc-800/30 rounded" />
            <div className="h-3 w-5/6 bg-zinc-800/30 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
