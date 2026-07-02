"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Activity, BookOpen, BarChart3, GraduationCap } from "lucide-react";

// Bottom navigation — vizibil DOAR pe mobil (md:hidden). Dă senzația de app nativ.
// Glassmorphism + glow pe item-ul activ. Nu afectează desktop-ul.
// Setările rămân accesibile din sidebar-ul drawer — Academia are prioritate aici.
const items = [
  { href: "/dashboard", icon: LayoutGrid, label: "Acasă" },
  { href: "/signals", icon: Activity, label: "Semnale" },
  { href: "/journal", icon: BookOpen, label: "Jurnal" },
  { href: "/analytics", icon: BarChart3, label: "Analize" },
  { href: "/academy", icon: GraduationCap, label: "Academie" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10"
      style={{
        background: "rgba(9,9,11,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-1 flex-col items-center gap-1 py-1.5 rounded-xl transition-all active:scale-95"
            >
              <div
                className="flex items-center justify-center rounded-xl transition-all"
                style={{
                  width: 40,
                  height: 28,
                  background: active ? "rgba(99,102,241,0.18)" : "transparent",
                  boxShadow: active ? "0 0 16px rgba(99,102,241,0.35)" : "none",
                }}
              >
                <Icon size={20} color={active ? "#818cf8" : "#71717a"} strokeWidth={active ? 2.4 : 2} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#a5b4fc" : "#71717a",
                  letterSpacing: 0.2,
                }}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
