export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-28 bg-zinc-800 rounded-md" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-zinc-800 rounded-md" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-44 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="h-44 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
