import { describe, it, expect } from "vitest";
import { textSemnal, promptSemnale } from "@/lib/ai-signals";
import { limbaUtilizatorului } from "@/lib/limba-utilizator";

// ── Semnalele AI, fiecare om în limba lui ────────────────────────────────────
//
// Un semnal se generează O SINGURĂ DATĂ, cu textele în română și în engleză în
// același răspuns — ca un român și un englez să vadă același setup, cu aceleași
// niveluri. Aici verificăm alegerea limbii și căderea pe română, singura parte
// care nu depinde de model.

const semnal = {
  rationale: "Structură bullish pe H4.",
  confirmation: "Așteaptă un CHoCH pe M15.",
  invalidation: "Închidere sub 1.0820.",
  rationaleEn: "Bullish structure on H4.",
  confirmationEn: "Wait for a CHoCH on M15.",
  invalidationEn: "A close below 1.0820.",
};

describe("textSemnal", () => {
  it("dă româna pe ro", () => {
    expect(textSemnal(semnal, "ro")).toEqual({
      rationale: "Structură bullish pe H4.",
      confirmation: "Așteaptă un CHoCH pe M15.",
      invalidation: "Închidere sub 1.0820.",
    });
  });

  it("dă engleza pe en", () => {
    expect(textSemnal(semnal, "en")).toEqual({
      rationale: "Bullish structure on H4.",
      confirmation: "Wait for a CHoCH on M15.",
      invalidation: "A close below 1.0820.",
    });
  });

  it("cade pe română la semnalele generate înainte de varianta bilingvă", () => {
    const vechi = { ...semnal, rationaleEn: null, confirmationEn: null, invalidationEn: null };
    expect(textSemnal(vechi, "en").rationale).toBe("Structură bullish pe H4.");
  });

  it("nu amestecă limbile când lipsește doar un câmp englezesc", () => {
    const partial = { ...semnal, invalidationEn: null };
    const t = textSemnal(partial, "en");
    expect(t.rationale).toBe("Bullish structure on H4.");
    // Câmpul lipsă cade pe română, nu rămâne gol.
    expect(t.invalidation).toBe("Închidere sub 1.0820.");
  });
});

describe("limbaUtilizatorului", () => {
  it("română pentru RO și pentru cont fără preferință", () => {
    expect(limbaUtilizatorului("RO")).toBe("ro");
    expect(limbaUtilizatorului(null)).toBe("ro");
    expect(limbaUtilizatorului(undefined)).toBe("ro");
  });

  it("engleză pentru EN și pentru limbile pe care produsul nu le are", () => {
    expect(limbaUtilizatorului("EN")).toBe("en");
    expect(limbaUtilizatorului("DE")).toBe("en");
    expect(limbaUtilizatorului("ES")).toBe("en");
  });
});

describe("promptSemnale", () => {
  it("cere textele în ambele limbi, în același răspuns", () => {
    const { system, user } = promptSemnale(
      [{ symbol: "EUR/USD", instrument: "FOREX", price: 1.085, high24: 1.09, low24: 1.08, changePct: 0.2 }],
      "2026-10-06",
    );
    for (const camp of ["rationaleEn", "confirmationEn", "invalidationEn"]) {
      expect(system).toContain(camp);
    }
    expect(user).toContain("EUR/USD");
  });
});
