"use client";

import * as React from "react";

// ── useIridescent ────────────────────────────────────────────────────────────
//
// Alimentează materialul holografic (.tg-iridescent din globals.css) cu poziția
// cursorului: unghiul peliculei se rotește după direcția din care „privești",
// exact ca o bandă holografică înclinată în lumină.
//
// De ce scriem direct în style și nu prin state React: mișcarea mouse-ului
// generează zeci de evenimente pe secundă; un setState per eveniment ar
// re-randa arborele degeaba. Aici doar setăm două custom properties pe nod, iar
// compozitorul face restul.
//
// Coalescăm prin rAF ca să nu scriem de mai multe ori în același frame.

export function useIridescent<T extends HTMLElement = HTMLDivElement>() {
  const ref = React.useRef<T>(null);
  const raf = React.useRef(0);
  const next = React.useRef({ x: 50, y: 0, angle: 135 });

  const onMouseMove = React.useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    // Unghiul peliculei = direcția de la centrul cardului spre cursor.
    const angle = (Math.atan2(py - 0.5, px - 0.5) * 180) / Math.PI + 90;

    next.current = { x: px * 100, y: py * 100, angle };
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const n = next.current;
      el.style.setProperty("--tg-ir-x", `${n.x.toFixed(1)}%`);
      el.style.setProperty("--tg-ir-y", `${n.y.toFixed(1)}%`);
      el.style.setProperty("--tg-ir-angle", `${n.angle.toFixed(1)}deg`);
    });
  }, []);

  React.useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return { ref, onMouseMove };
}
