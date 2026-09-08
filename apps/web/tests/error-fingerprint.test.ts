import { describe, it, expect } from "vitest";
import { errorFingerprint, normalizeMessage } from "@/lib/error-fingerprint";

// ── Gruparea erorilor ────────────────────────────────────────────────────────
//
// Monitorul grupează erorile după amprentă. Dacă gruparea e prea îngustă, o rută
// care eșuează pe fiecare tranzacție produce un rând per tranzacție și îneacă
// tot restul. Dacă e prea largă, două defecte diferite ajung în același rând și
// unul dintre ele rămâne nevăzut.
//
// Prima versiune a acestor teste își COPIA logica din monitor, în loc s-o
// importe. Copia a rămas în urmă de original, iar eu am depanat replica —
// convins că repar codul. De-aia funcția stă acum într-un fișier propriu, pur,
// pe care testul îl cheamă direct.

describe("normalizeMessage", () => {
  it("înlocuiește CUID-urile bazei", () => {
    // Id-urile noastre nu sunt hexazecimale: au litere dincolo de a-f. O regulă
    // scrisă doar pentru hex le lasă să treacă — exact bug-ul care a existat aici.
    expect(normalizeMessage("Trade cmrqunlsr0010zz2d94tt8b46 negăsit")).toBe("Trade «id» negăsit");
  });

  it("înlocuiește UUID-urile, cu tot cu cratime", () => {
    expect(normalizeMessage("User 3f2504e0-4f89-11d3-9a0c-0305e82c3301 lipsă")).toBe(
      "User «id» lipsă"
    );
  });

  it("înlocuiește numerele", () => {
    // Numerele de 3-7 cifre devin «nr». Cele mai lungi sunt prinse mai devreme
    // de regula de id — cifrele sunt si ele hexazecimale. Eticheta interna
    // difera, gruparea e aceeasi, deci nu merita o regula in plus.
    expect(normalizeMessage("Contul 5100 a eșuat")).toBe("Contul «nr» a eșuat");
    expect(normalizeMessage("Contul 5100539416 a eșuat")).toBe("Contul «id» a eșuat");
  });

  it("lasă textul scurt neatins", () => {
    // Dacă ar înlocui și cuvintele obișnuite, toate erorile ar ajunge un singur
    // grup — la fel de inutil ca niciun grup.
    expect(normalizeMessage("Cont negăsit")).toBe("Cont negăsit");
    expect(normalizeMessage("Eroare la bursă")).toBe("Eroare la bursă");
  });

  it("taie mesajele foarte lungi", () => {
    expect(normalizeMessage("x".repeat(500)).length).toBeLessThanOrEqual(200);
  });
});

describe("errorFingerprint", () => {
  const E = "TestLabel";

  it("aceeași eroare pe id-uri diferite = ACELAȘI grup", () => {
    const a = errorFingerprint(E, new Error("Trade cmrqunlsr0010zz2d94tt8b46 negăsit"));
    const b = errorFingerprint(E, new Error("Trade cmt08x88r0001ydxcbqarmiex negăsit"));
    expect(a).toBe(b);
  });

  it("erori chiar diferite = grupuri diferite", () => {
    const a = errorFingerprint(E, new Error("Cont negăsit"));
    const b = errorFingerprint(E, new Error("Eroare la bursă"));
    expect(a).not.toBe(b);
  });

  it("aceeași eroare din locuri diferite = grupuri diferite", () => {
    // Eticheta face parte din identitate: „Cont negăsit" la import e altă
    // problemă decât „Cont negăsit" la sincronizare, chiar dacă textul e identic.
    const a = errorFingerprint("Import", new Error("Cont negăsit"));
    const b = errorFingerprint("Sync", new Error("Cont negăsit"));
    expect(a).not.toBe(b);
  });

  it("tipuri diferite de excepție = grupuri diferite", () => {
    const a = errorFingerprint(E, new TypeError("ceva"));
    const b = errorFingerprint(E, new RangeError("ceva"));
    expect(a).not.toBe(b);
  });

  it("acceptă și ce nu e Error, fără să arunce", () => {
    // `catch` prinde orice, nu doar Error. Un monitor care crapă pe un string
    // aruncat ar transforma o eroare mică într-una mare.
    expect(() => errorFingerprint(E, "un șir simplu")).not.toThrow();
    expect(() => errorFingerprint(E, null)).not.toThrow();
    expect(() => errorFingerprint(E, { cod: 500 })).not.toThrow();
  });

  it("e stabilă între apeluri", () => {
    const err = new Error("Cont negăsit");
    expect(errorFingerprint(E, err)).toBe(errorFingerprint(E, err));
  });
});
