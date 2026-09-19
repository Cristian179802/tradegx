import { cn } from "@/lib/utils";

// ── Schelet de încărcare ─────────────────────────────────────────────────────
//
// Nu mai pulsează, ci e măturat de o linie de lumină.
//
// Pulsul spune „mai așteaptă” — un semnal pasiv, care după două secunde începe
// să semene cu ceva blocat. Linia care mătură spune „se măsoară”: are direcție,
// deci are progres. Aceeași informație, alt sentiment, zero cost în plus.
//
// Regula `.tg-scan` stă în `globals.css` și se oprește singură la
// `prefers-reduced-motion`.

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("tg-scan rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
