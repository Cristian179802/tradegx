"use client";

import * as React from "react";

// ── CountUp ─────────────────────────────────────────────────────────────────
// Animează un număr de la 0 la valoarea finală (ease-out), cu respect pentru
// prefers-reduced-motion. Formatare ro-RO cu zecimale/prefix/sufix.

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const raf = React.useRef<number>(0);

  React.useEffect(() => {
    // Fără animație dacă utilizatorul preferă mișcare redusă
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  const formatted = display.toLocaleString("ro-RO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
