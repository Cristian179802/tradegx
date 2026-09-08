import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ── Nicio defecțiune nu are voie să fie tăcută ───────────────────────────────
//
// Gardele de aici apără un singur lucru: că atunci când ceva se strică pentru un
// client, cineva află. Nu sunt teste de comportament, sunt teste de obicei — iar
// obiceiul pe care îl opresc exista deja în cod, în trei locuri.
//
// Cel mai rău dintre ele: trimiterea emailului de resetare a parolei, într-un
// catch complet gol. Utilizatorul primește „dacă adresa există, vei primi un
// email" — formulare corectă, care nu divulgă dacă adresa e înregistrată — deci
// un om blocat în afara contului ar fi așteptat la infinit un email care nu
// pleacă, iar noi n-am fi aflat niciodată.

const RUTE_API = (() => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name === "route.ts") out.push(f);
    }
  };
  walk("src/app/api");
  return out;
})();

/**
 * Codul fără comentarii.
 *
 * Prima versiune a testului de mai jos își găsea PROPRIILE comentarii — care
 * descriu tocmai tiparul interzis — și raporta fișiere curate ca vinovate.
 */
function faraComentarii(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const TRIMITE_EMAIL = /send(?:Verification|PasswordReset)Email|sendEmail\s*\(/;

describe("trimiterea de emailuri nu eșuează în tăcere", () => {
  it("orice rută care trimite email raportează eșecul în monitor", () => {
    const vinovate = RUTE_API.filter((f) => {
      const src = fs.readFileSync(f, "utf8");
      return TRIMITE_EMAIL.test(src) && !src.includes("captureError");
    }).map((f) => f.replace(/\\/g, "/"));

    expect(
      vinovate,
      "o rută care trimite email trebuie să raporteze eșecul prin captureError"
    ).toEqual([]);
  });

  it("nicio trimitere de email nu stă într-un catch gol", () => {
    const vinovate = RUTE_API.filter((f) => {
      const brut = fs.readFileSync(f, "utf8");
      if (!TRIMITE_EMAIL.test(brut)) return false;
      return /catch\s*\{\s*\}/.test(faraComentarii(brut));
    }).map((f) => f.replace(/\\/g, "/"));

    expect(vinovate, "un catch gol pe o trimitere de email ascunde exact ce contează").toEqual([]);
  });
});

describe("cârligul global de erori rămâne conectat", () => {
  it("instrumentation.ts exportă onRequestError și îl leagă de monitor", () => {
    // Fără el, doar erorile pe care le prindem intenționat ajung în monitor —
    // adică exact cele la care ne-am gândit deja.
    const src = fs.readFileSync("src/instrumentation.ts", "utf8");
    expect(src).toMatch(/export (?:const|async function) onRequestError/);
    expect(src).toContain("captureError");
  });

  it("nu trage node:crypto pe lanțul Edge", () => {
    // `instrumentation.ts` se încarcă în AMBELE runtime-uri, iar webpack urmărește
    // și importurile dinamice: o dependență de node:crypto aici strică build-ul
    // cu „Unhandled scheme". S-a întâmplat deja o dată.
    for (const f of ["src/instrumentation.ts", "src/lib/error-fingerprint.ts"]) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, `${f} nu are voie să importe node:crypto`).not.toContain('from "node:crypto"');
    }
  });
});
