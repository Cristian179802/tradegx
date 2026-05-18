export default function AIAssistantLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1.5">
          <div className="h-7 w-36 bg-zinc-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-60 bg-zinc-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/60 rounded-xl px-3 py-1.5 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
            <div className="h-3 w-16 bg-zinc-800/50 rounded" />
          </div>
          <div className="h-8 w-8 bg-zinc-800/60 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-5 overflow-hidden animate-pulse space-y-5">
        {/* AI message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/20 shrink-0" />
          <div className="flex-1 space-y-2 max-w-xl">
            <div className="h-4 w-24 bg-zinc-800/60 rounded" />
            <div className="bg-zinc-800/40 rounded-2xl rounded-tl-sm p-4 space-y-2">
              <div className="h-3.5 w-full bg-zinc-700/40 rounded" />
              <div className="h-3.5 w-5/6 bg-zinc-700/30 rounded" />
              <div className="h-3.5 w-4/5 bg-zinc-700/30 rounded" />
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex items-start gap-3 justify-end">
          <div className="flex-1 space-y-2 max-w-md items-end flex flex-col">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tr-sm p-4 space-y-2 w-full">
              <div className="h-3.5 w-full bg-indigo-500/20 rounded" />
              <div className="h-3.5 w-2/3 bg-indigo-500/15 rounded" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 border border-indigo-500/30 shrink-0" />
        </div>

        {/* AI typing indicator */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/20 shrink-0" />
          <div className="bg-zinc-800/40 rounded-2xl rounded-tl-sm px-4 py-3.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-3 flex items-end gap-3 animate-pulse">
        <div className="flex-1 h-11 bg-zinc-800/60 rounded-xl" />
        <div className="h-11 w-11 bg-indigo-500/20 border border-indigo-500/20 rounded-xl shrink-0" />
      </div>
    </div>
  );
}
