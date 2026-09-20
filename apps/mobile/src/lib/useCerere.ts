import * as React from "react";
import { ApiError } from "./api";

// ── Un singur fel de a cere date ─────────────────────────────────────────────
//
// Fiecare ecran are nevoie de aceleași patru stări: încarcă, are date, a dat
// eroare, se reîmprospătează prin tragere. Scrise de mână în fiecare ecran ar
// fi patru variante ușor diferite și patru feluri de a greși.
//
// DOUĂ LUCRURI CARE PAR MICI ȘI NU SUNT:
//
// 1. La reîmprospătare NU ștergem datele vechi. Ecranul arată în continuare
//    cifrele de acum zece secunde cât timp vin cele noi. Alternativa — schelet
//    peste tot la fiecare tragere — face aplicația să pară că se resetează.
//
// 2. Cererea anulată nu mai scrie în stare. Fără asta, cineva care intră și
//    iese repede dintr-un ecran primește un avertisment React și, mai rău, o
//    stare scrisă peste alta.

export interface StareCerere<T> {
  date: T | null;
  incarca: boolean;
  reimprospateaza: boolean;
  eroare: string | null;
  /**
   * Codul HTTP al ultimei erori. Ecranele au nevoie de el ca să deosebească
   * „a picat rețeaua" de 402 — a doua nu e o defecțiune, e o ușă spre PRO, iar
   * textul crud al erorii pe fundal roșu ar arăta ca prima.
   */
  stare: number | null;
  /** Reia cererea păstrând datele afișate. */
  reia: () => void;
}

export function useCerere<T>(
  aducator: () => Promise<T>,
  dependinte: React.DependencyList = [],
): StareCerere<T> {
  const [date, setDate] = React.useState<T | null>(null);
  const [incarca, setIncarca] = React.useState(true);
  const [reimprospateaza, setReimprospateaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [stare, setStare] = React.useState<number | null>(null);
  const [tur, setTur] = React.useState(0);

  // `aducator` se schimbă la fiecare randare dacă e scris inline; îl ținem
  // într-un ref ca să nu declanșeze cereri la nesfârșit.
  const refAducator = React.useRef(aducator);
  refAducator.current = aducator;

  const areDate = date !== null;

  React.useEffect(() => {
    let anulat = false;
    if (areDate) setReimprospateaza(true);
    else setIncarca(true);

    refAducator
      .current()
      .then((d) => {
        if (anulat) return;
        setDate(d);
        setEroare(null);
        setStare(null);
      })
      .catch((e: unknown) => {
        if (anulat) return;
        if (e instanceof ApiError) {
          // 401 după reîmprospătare înseamnă sesiune moartă; poarta din layout
          // se ocupă de ieșire. Aici nu arătăm „Neautorizat" peste ecran.
          setStare(e.status);
          setEroare(e.status === 401 || e.status === 402 ? null : e.message);
        } else {
          setStare(null);
          setEroare("Fără conexiune. Trage în jos ca să reîncerci.");
        }
      })
      .finally(() => {
        if (anulat) return;
        setIncarca(false);
        setReimprospateaza(false);
      });

    return () => { anulat = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tur, ...dependinte]);

  const reia = React.useCallback(() => setTur((t) => t + 1), []);

  return { date, incarca, reimprospateaza, eroare, stare, reia };
}
