export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-8 w-28 bg-zinc-800 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 bg-zinc-800 rounded-2xl" />
        <div className="h-72 bg-zinc-800 rounded-2xl" />
      </div>
    </div>
  );
}
