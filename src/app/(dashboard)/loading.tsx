export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-800 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
    </div>
  );
}
