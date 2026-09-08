import { describe, it, expect } from "vitest";
import { API_ERROR_EN, translateApiError } from "@/lib/api-error-dict";

// ── Erorile serverului, în limba clientului ──────────────────────────────────
//
// Rutele API răspund în română, iar clientul afișează textul ca atare. Un
// utilizator pe engleză primea română exact pe drumurile care contează:
// înregistrare, resetare parolă, conectare broker, import, plată.
//
// COMPLETITUDINEA dicționarului e verificată de `scripts/i18n-scan.mjs`, care
// pică build-ul dacă apare un mesaj românesc fără traducere. Aici verificăm
// COMPORTAMENTUL funcției și CALITATEA traducerilor — două lucruri pe care un
// scanner de literale nu le poate vedea.

describe("translateApiError", () => {
  it("lasă româna neatinsă pe locale ro", () => {
    expect(translateApiError("Cont negăsit", "ro")).toBe("Cont negăsit");
  });

  it("traduce pe locale en", () => {
    expect(translateApiError("Cont negăsit", "en")).toBe("Account not found");
  });

  it("traduce și mesajele lungi, scrise pe mai multe rânduri în sursă", () => {
    expect(translateApiError("Plățile nu sunt configurate momentan. Revino în curând.", "en")).toBe(
      "Payments aren't set up right now. Please check back soon."
    );
  });

  it("întoarce neatins un mesaj necunoscut", () => {
    // Mai bine română decât gol. Un mesaj lipsă lasă utilizatorul fără nicio
    // explicație; unul în limba greșită măcar poate fi copiat și tradus.
    expect(translateApiError("Mesaj care nu există în dicționar", "en")).toBe(
      "Mesaj care nu există în dicționar"
    );
  });

  it("întoarce undefined când serverul n-a trimis text", () => {
    // `undefined` e important: la afișare se folosește `?? t(\"fallback\")`, deci
    // un șir gol ar bloca alternativa tradusă a componentei.
    expect(translateApiError("", "en")).toBeUndefined();
    expect(translateApiError(undefined, "en")).toBeUndefined();
    expect(translateApiError(null, "en")).toBeUndefined();
    expect(translateApiError(42, "en")).toBeUndefined();
  });
});

describe("calitatea dicționarului", () => {
  it("nicio traducere engleză nu conține diacritice românești", () => {
    const cuDiacritice = Object.entries(API_ERROR_EN).filter(([, en]) => /[ăâîșțĂÂÎȘȚ]/.test(en));
    expect(cuDiacritice).toEqual([]);
  });

  it("nicio traducere nu e identică cu originalul românesc", () => {
    // O intrare copiată din greșeală („Cont negăsit": "Cont negăsit") trece
    // scannerul de completitudine, fiindcă cheia EXISTĂ — dar nu traduce nimic.
    const necopiate = Object.entries(API_ERROR_EN).filter(([ro, en]) => {
      if (ro !== en) return false;
      // Excepție legitimă: mesaje deja în engleză în sursă, ca „Invalid JSON".
      return /[ăâîșțĂÂÎȘȚ]/.test(ro) || /\b(Cont|Cod|Eroare|lipsă|invalidă)\b/.test(ro);
    });
    expect(necopiate).toEqual([]);
  });

  it("nicio traducere nu e goală", () => {
    const goale = Object.entries(API_ERROR_EN).filter(([, en]) => !en || !en.trim());
    expect(goale).toEqual([]);
  });

  it("niciun mesaj nu scurge nume de variabile de mediu", () => {
    // „ANTHROPIC_API_KEY lipsește din .env.local" a ajuns efectiv în fața unui
    // client. Un mesaj de eroare n-are ce căuta să spună cum e configurat serverul.
    const scurgeri = Object.entries(API_ERROR_EN).filter(([ro, en]) =>
      /\b[A-Z][A-Z0-9]*_[A-Z0-9_]{3,}\b|\.env/.test(ro + " " + en)
    );
    expect(scurgeri).toEqual([]);
  });
});
