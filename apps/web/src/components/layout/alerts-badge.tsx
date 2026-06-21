"use client";
import { useEffect, useState } from "react";

export function AlertsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/alerts?unread=true&limit=1")
      .then((r) => r.json())
      .then((d) => setCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white px-1">
      {count > 9 ? "9+" : count}
    </span>
  );
}
