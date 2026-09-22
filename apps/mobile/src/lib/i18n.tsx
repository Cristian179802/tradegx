import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EN } from "./en";

// ── Traducerea aplicației ────────────────────────────────────────────────────
//
// CHEIA E CHIAR TEXTUL ROMÂNESC, nu un identificator inventat. Adică
// `t("Bine ai revenit")`, nu `t("login.welcome")`. Trei motive:
//
// 1. Codul rămâne citibil. Cine deschide ecranul vede ce scrie acolo, nu o
//    cheie pe care trebuie s-o caute în altă parte ca să afle ce afișează.
// 2. Un text fără traducere cade pe română, adică pe ceva corect. Cu chei
//    inventate, o cheie greșită afișează „login.welcom" în interfață.
// 3. Nu trebuie botezate 600 de chei, și nici ținute sincronizate două liste.
//
// Costul: dacă schimb textul românesc, trebuie schimbată și cheia din `en.ts`.
// De asta există poarta `scripts/i18n-scan.mjs`, care pică dacă un `t()` din
// cod n-are pereche în dicționar.
//
// LIMBA E ȘI PE SERVER. Ecranul de profil o salvează în contul tău, ca site-ul
// și emailurile să fie în aceeași limbă. Dar aplicația o ține ȘI local, în
// AsyncStorage: altfel primul ecran de după pornire ar apărea în română și ar
// sări în engleză când răspunde serverul.

export type Limba = "RO" | "EN";

const CHEIE = "tradegx-limba";

// Citită sincron de funcțiile din afara componentelor (`src/lib/*`), care n-au
// cum să folosească un hook.
let limbaCurenta: Limba = "RO";

/** Traduce în afara React-ului. În componente folosește `useT()`. */
export function tr(ro: string): string {
  if (limbaCurenta === "RO") return ro;
  return EN[ro] ?? ro;
}

export function limba(): Limba {
  return limbaCurenta;
}

/**
 * Texte cu valori în ele: `umple("acum {n} min", { n: 3 })`.
 *
 * DE CE NU UN ȘABLON OBIȘNUIT. Un template literal nu poate fi cheie de
 * dicționar — cheia s-ar schimba la fiecare valoare. Aici cheia e tiparul
 * întreg, cu găurile în el, deci are o singură traducere: "{n} min ago".
 *
 * Asta rezolvă și ORDINEA CUVINTELOR, care diferă între limbi: româna spune
 * „acum 3 minute", engleza „3 minutes ago". Traduse bucată cu bucată, ar fi
 * ieșit „ago 3 minutes".
 *
 * PLURALUL rămâne o alegere între două tipare, nu o regulă automată: limbile
 * n-au toate aceleași forme, iar două chei sunt mai ieftine decât o bibliotecă
 * de reguli. Scrie `umple(n === 1 ? "{n} zi" : "{n} zile", { n })`.
 */
export function umple(sablon: string, valori: Record<string, string | number>): string {
  let text = tr(sablon);
  for (const [cheie, val] of Object.entries(valori)) {
    text = text.split("{" + cheie + "}").join(String(val));
  }
  return text;
}

interface Context {
  limba: Limba;
  seteaza(l: Limba): void;
  gata: boolean;
}

const Ctx = React.createContext<Context | null>(null);

export function ProvizorLimba({ children }: { children: React.ReactNode }) {
  const [l, setL] = React.useState<Limba>("RO");
  const [gata, setGata] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const salvat = await AsyncStorage.getItem(CHEIE);
        if (salvat === "EN" || salvat === "RO") {
          limbaCurenta = salvat;
          setL(salvat);
        }
      } catch {
        // Fără preferință salvată rămânem pe română, care e limba scrisă în cod.
      } finally {
        setGata(true);
      }
    })();
  }, []);

  const seteaza = React.useCallback((noua: Limba) => {
    limbaCurenta = noua;
    setL(noua);
    AsyncStorage.setItem(CHEIE, noua).catch(() => {});
  }, []);

  const valoare = React.useMemo(() => ({ limba: l, seteaza, gata }), [l, seteaza, gata]);
  return <Ctx.Provider value={valoare}>{children}</Ctx.Provider>;
}

export function useLimba(): Context {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useLimba în afara lui <ProvizorLimba>");
  return c;
}

/**
 * Traducătorul pentru componente. Se re-randează singur la schimbarea limbii,
 * fiindcă depinde de context.
 */
export function useT(): (ro: string) => string {
  const { limba: l } = useLimba();
  return React.useCallback((ro: string) => (l === "RO" ? ro : EN[ro] ?? ro), [l]);
}
