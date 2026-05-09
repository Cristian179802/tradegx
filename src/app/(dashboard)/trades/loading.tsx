export default function TradesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-zinc-800 rounded-md" />
        <div className="h-9 w-32 bg-zinc-800 rounded-md" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-zinc-800 rounded-md" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
