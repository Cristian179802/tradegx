"use client";

import * as React from "react";

/**
 * `useState` care își ține minte valoarea între vizite, în `localStorage`.
 *
 * Există pentru că pagina de grafice își uita TOT la fiecare reîncărcare:
 * indicatorii bifați, tipul de lumânări, favoritele, modul SMC, layoutul. Îți
 * aranjai graficul, dădeai refresh, și o luai de la capăt. Pentru cineva care
 * deschide aplicația de zece ori pe zi, asta e o taxă zilnică.
 *
 * Citirea se face DUPĂ montare, nu la inițializare. Pe server `localStorage` nu
 * există, iar dacă am returna altceva la prima randare decât ce randează
 * serverul, React ar semnala nepotrivire de hidratare și ar rearanja DOM-ul.
 * Prețul e o clipire scurtă cu valorile implicite; alternativa e o pagină care
 * se randează de două ori diferit.
 *
 * Scrierile eșuate se ignoră intenționat: în navigare privată sau cu spațiul
 * plin, `localStorage` aruncă. Preferința e un moft, nu o funcție critică — n-are
 * voie să rupă pagina.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  /** Respinge valorile vechi sau stricate din stocare. */
  isValid?: (v: unknown) => boolean
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = React.useState<T>(initial);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!isValid || isValid(parsed)) setValue(parsed as T);
      }
    } catch {
      /* stocare indisponibilă sau JSON stricat — rămânem pe implicit */
    }
    setLoaded(true);
    // `isValid` e adesea o funcție anonimă, deci s-ar schimba la fiecare randare
    // și ar reciti la infinit. Cheia e singura care contează.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  React.useEffect(() => {
    // Nu scriem înainte de citire: am suprascrie preferința salvată cu valoarea
    // implicită, chiar în prima clipă după montare.
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* vezi mai sus */
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}
