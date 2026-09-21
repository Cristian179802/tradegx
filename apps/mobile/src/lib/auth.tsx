import * as React from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// ── Autentificare nativă ─────────────────────────────────────────────────────
//
// Backend-ul emite o pereche de token-uri (`/api/auth/mobile/login`), semnate
// HMAC-SHA256, cu rotație completă la reîmprospătare. Web-ul rămâne pe cookie-ul
// NextAuth — cele două nu se ating.
//
// UNDE STAU TOKEN-URILE. `expo-secure-store`, adică Keychain pe iOS și
// EncryptedSharedPreferences pe Android. NU `AsyncStorage`: acolo sunt text
// simplu, citibile de orice proces cu acces la sandbox-ul aplicației pe un
// telefon cu root. Un token de acces la jurnalul de tranzacții al cuiva nu are
// ce căuta în text simplu.
//
// CUM SE REÎNNOIESC. O singură reîmprospătare în zbor, oricâte cereri ar pica
// în același timp cu 401: toate așteaptă aceeași promisiune. Fără asta, un
// ecran care lansează cinci cereri deodată ar trimite cinci refresh-uri, iar
// rotația le-ar invalida pe rând — utilizatorul ar fi deconectat fix când
// aplicația funcționează normal.

const API =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://www.tradegx.com";

const CHEIE_ACCESS = "tgx.access";
const CHEIE_REFRESH = "tgx.refresh";
const CHEIE_USER = "tgx.user";

export interface Utilizator {
  id: string;
  email: string;
  name: string | null;
}

interface Stare {
  utilizator: Utilizator | null;
  /** `null` cât timp încă citim din secure-store la pornire. */
  pornit: boolean;
}

export class EroareAuth extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Serverul cere codul de doi factori. */
    readonly cere2FA = false,
  ) {
    super(message);
  }
}

// ── Depozitul de token-uri ───────────────────────────────────────────────────

async function scrie(cheie: string, valoare: string | null) {
  if (valoare == null) await SecureStore.deleteItemAsync(cheie);
  else await SecureStore.setItemAsync(cheie, valoare);
}

async function citeste(cheie: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(cheie);
  } catch {
    // Keychain poate refuza înainte de primul deblocaj al telefonului.
    return null;
  }
}

let accessInMemorie: string | null = null;
let refreshInMemorie: string | null = null;
let reimprospatareInZbor: Promise<string | null> | null = null;

/** Tokenul curent, pentru clientul de API. Nu atinge rețeaua. */
export function tokenCurent(): string | null {
  return accessInMemorie;
}

async function salveazaSesiune(d: {
  accessToken: string;
  refreshToken: string;
  user: Utilizator;
}) {
  accessInMemorie = d.accessToken;
  refreshInMemorie = d.refreshToken;
  await Promise.all([
    scrie(CHEIE_ACCESS, d.accessToken),
    scrie(CHEIE_REFRESH, d.refreshToken),
    scrie(CHEIE_USER, JSON.stringify(d.user)),
  ]);
}

async function stergeSesiune() {
  accessInMemorie = null;
  refreshInMemorie = null;
  await Promise.all([
    scrie(CHEIE_ACCESS, null),
    scrie(CHEIE_REFRESH, null),
    scrie(CHEIE_USER, null),
  ]);
}

/**
 * Reîmprospătează perechea de token-uri. Întoarce noul access token, sau `null`
 * dacă sesiunea nu mai e validă — caz în care apelantul trebuie să deconecteze.
 */
export async function reimprospateaza(): Promise<string | null> {
  if (reimprospatareInZbor) return reimprospatareInZbor;

  reimprospatareInZbor = (async () => {
    const refresh = refreshInMemorie ?? (await citeste(CHEIE_REFRESH));
    if (!refresh) return null;
    try {
      const r = await fetch(`${API}/api/auth/mobile/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!r.ok) return null;
      const d = await r.json();
      if (!d?.accessToken || !d?.refreshToken || !d?.user) return null;
      await salveazaSesiune(d);
      return d.accessToken as string;
    } catch {
      // Fără rețea: NU stingem sesiunea. Tokenul vechi poate fi încă valid, iar
      // deconectarea cuiva fiindcă a intrat în metrou e un defect, nu o măsură
      // de securitate.
      return accessInMemorie;
    } finally {
      reimprospatareInZbor = null;
    }
  })();

  return reimprospatareInZbor;
}

// ── Contextul ────────────────────────────────────────────────────────────────

interface Context extends Stare {
  autentifica(email: string, parola: string, cod?: string): Promise<void>;
  /** Sesiunea vine gata făcută din fluxul Google — vezi `lib/google.ts`. */
  preiaSesiunea(d: { accessToken: string; refreshToken: string; user: Utilizator }): Promise<void>;
  deconecteaza(): Promise<void>;
}

const Ctx = React.createContext<Context | null>(null);

export function ProvizorAuth({ children }: { children: React.ReactNode }) {
  const [stare, setStare] = React.useState<Stare>({ utilizator: null, pornit: false });

  // La pornire: citim sesiunea salvată și o reîmprospătăm în fundal. Arătăm
  // imediat utilizatorul din secure-store ca să nu clipească ecranul de login
  // pentru cineva care e conectat de trei săptămâni.
  React.useEffect(() => {
    let anulat = false;
    (async () => {
      const [acc, ref, brutUser] = await Promise.all([
        citeste(CHEIE_ACCESS),
        citeste(CHEIE_REFRESH),
        citeste(CHEIE_USER),
      ]);
      accessInMemorie = acc;
      refreshInMemorie = ref;

      let utilizator: Utilizator | null = null;
      try {
        utilizator = brutUser ? (JSON.parse(brutUser) as Utilizator) : null;
      } catch {
        utilizator = null;
      }

      if (!anulat) setStare({ utilizator, pornit: true });

      if (ref) {
        const nou = await reimprospateaza();
        if (!nou && !anulat) {
          await stergeSesiune();
          setStare({ utilizator: null, pornit: true });
        }
      }
    })();
    return () => { anulat = true; };
  }, []);

  const autentifica = React.useCallback(
    async (email: string, parola: string, cod?: string) => {
      const r = await fetch(`${API}/api/auth/mobile/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: parola, ...(cod ? { code: cod } : {}) }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        throw new EroareAuth(
          d?.error ?? "Nu m-am putut conecta.",
          r.status,
          Boolean(d?.twoFARequired),
        );
      }
      await salveazaSesiune(d);
      setStare({ utilizator: d.user, pornit: true });
    },
    [],
  );

  const preiaSesiunea = React.useCallback(
    async (d: { accessToken: string; refreshToken: string; user: Utilizator }) => {
      await salveazaSesiune(d);
      setStare({ utilizator: d.user, pornit: true });
    },
    [],
  );

  const deconecteaza = React.useCallback(async () => {
    // Scoatem telefonul de pe lista de notificari INAINTE sa pierdem tokenul:
    // dupa stergerea sesiunii n-am mai avea cu ce autoriza cererea, iar
    // telefonul ar continua sa primeasca alerte pentru un cont din care a iesit.
    const { scoateNotificari } = await import("./notificari");
    await scoateNotificari();
    await stergeSesiune();
    setStare({ utilizator: null, pornit: true });
  }, []);

  const valoare = React.useMemo<Context>(
    () => ({ ...stare, autentifica, preiaSesiunea, deconecteaza }),
    [stare, autentifica, preiaSesiunea, deconecteaza],
  );

  return <Ctx.Provider value={valoare}>{children}</Ctx.Provider>;
}

export function useAuth(): Context {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useAuth în afara lui <ProvizorAuth>");
  return c;
}
