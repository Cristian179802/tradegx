export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-zinc-800 rounded-md" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
