export default function CalendarLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-44 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-56 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-zinc-800/60 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-zinc-800/60 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="h-9 w-48 bg-zinc-800/70 rounded-xl animate-pulse" />
        <div className="flex gap-1.5">
          {[55, 65, 55].map((w, i) => (
            <div key={i} className="h-9 bg-zinc-800/60 rounded-xl animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {/* Day group */}
        {[
          { events: 3, dayW: 64 },
          { events: 5, dayW: 72 },
          { events: 2, dayW: 60 },
        ].map((group, gi) => (
          <div key={gi} className="space-y-1.5">
            {/* Day label */}
            <div className="flex items-center gap-3 py-1">
              <div
                className="h-4 bg-zinc-800/60 rounded animate-pulse"
                style={{ width: group.dayW }}
              />
              <div className="flex-1 h-px bg-zinc-800/40" />
            </div>

            {/* Events */}
            {Array.from({ length: group.events }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl px-5 py-3.5 flex items-center gap-4 animate-pulse"
                style={{ animationDelay: `${(gi * 5 + i) * 55}ms` }}
              >
                {/* Impact dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 shrink-0" />
                {/* Time */}
                <div className="h-3.5 w-12 bg-zinc-800/70 rounded shrink-0" />
                {/* Flag + title */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-4 bg-zinc-800/60 rounded" />
                  <div className="h-4 w-48 bg-zinc-800/70 rounded-lg" />
                </div>
                {/* Values */}
                <div className="hidden md:flex gap-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-1 text-right">
                      <div className="h-2.5 w-10 bg-zinc-800/40 rounded" />
                      <div className="h-3.5 w-14 bg-zinc-800/60 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
