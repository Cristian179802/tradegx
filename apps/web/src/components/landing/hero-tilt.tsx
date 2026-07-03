"use client";

import * as React from "react";

// ── HeroTilt ────────────────────────────────────────────────────────────────
// Parallax 3D subtil pe mockup-ul din hero: urmărește mouse-ul cu rotații de
// max ±5°, revine lin la poziție la ieșire. Dezactivat pe touch și la
// prefers-reduced-motion (acolo rămâne static — fără efecte enervante).

export function HeroTilt({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && motionOk);
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(1100px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
  };

  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
