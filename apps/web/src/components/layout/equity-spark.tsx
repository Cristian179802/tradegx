"use client";

import * as React from "react";
import { Sparkline } from "@/components/charts/sparkline";
import { Puls } from "@/components/fx/puls";

// ── Coloana vertebrală ───────────────────────────────────────────────────────
//
// Curba contului, în bara de sus, pe ORICE pagină. Motivul nu e decorativ: o
// aplicație cu douăzeci de ecrane are nevoie de un element care rămâne același
// peste tot, altfel fiecare pagină pare un produs diferit. Aici, elementul ăla
// e chiar lucrul pentru care omul a venit.
//
// Aceeași cerere alimentează și tonul de fundal al zilei (`<Puls/>`).
//
// ECONOMIE. Se cere O SINGURĂ DATĂ pe sesiune și se ține în `sessionStorage`.
// Baza de date se suspendă singură când nu e interogată; o cerere la fiecare
// navigare ar ține-o trează degeaba pentru o linie de 90 de pixeli.

const CHEIE = "tgx:spark";
const VALABIL_MS = 10 * 60 * 1000;

interface Date_ {
  curba: number[];
  pnlAzi: number | null;
  sold: number | null;
  moneda: string;
}

export function EquitySpark() {
  const [date, setDate] = React.useState<Date_ | null>(null);

  React.useEffect(() => {
    let anulat = false;

    // Din sesiune, dacă e încă proaspăt.
    try {
      const brut = sessionStorage.getItem(CHEIE);
      if (brut) {
        const { la, date: d } = JSON.parse(brut) as { la: number; date: Date_ };
        if (Date.now() - la < VALABIL_MS) {
          setDate(d);
          return;
        }
      }
    } catch {
      // sessionStorage poate arunca (fereastră privată, setări de cookie-uri).
      // Nu e un motiv să nu afișăm linia — doar o cerem de fiecare dată.
    }

    (async () => {
      try {
        const r = await fetch("/api/equity/spark");
        if (!r.ok) return;
        const d = (await r.json()) as Date_;
        if (anulat) return;
        setDate(d);
        try {
          sessionStorage.setItem(CHEIE, JSON.stringify({ la: Date.now(), date: d }));
        } catch { /* vezi mai sus */ }
      } catch { /* fără rețea: bara rămâne fără linie, restul merge */ }
    })();

    return () => { anulat = true; };
  }, []);

  if (!date || date.curba.length < 2) return null;

  const primul = date.curba[0]!;
  const ultimul = date.curba[date.curba.length - 1]!;
  const sus = ultimul >= primul;

  return (
    <>
      <Puls pnlAzi={date.pnlAzi} sold={date.sold} />
      <div className="hidden lg:flex items-center" aria-hidden>
        <Sparkline
          data={date.curba}
          color={sus ? "var(--gain)" : "var(--loss)"}
          width={92}
          height={22}
          traseaza
          intarziere={220}
        />
      </div>
    </>
  );
}
