import { describe, it, expect } from "vitest";
import { sesiuneaTranzactiei, sesiuneaDupaOra } from "@tradegx/core";

// Bugul pe care îl acoperă testele astea:
//
// Formularul de tranzacție scrie `killzone`. Matricea Setup × Sesiune citește
// `sessionType` și sare peste tot ce n-are. Nouă din zece căi prin care intră
// tranzacții în sistem nu completau `sessionType` deloc — deci o tranzacție
// etichetată de mână apărea peste tot, în afară de analiza pentru care ai
// etichetat-o.

describe("sesiuneaTranzactiei — ordinea surselor", () => {
  const ora = (h: number) => new Date(Date.UTC(2026, 0, 15, h, 30, 0));

  it("respectă sessionType explicit, chiar dacă killzone spune altceva", () => {
    expect(
      sesiuneaTranzactiei({ sessionType: "OVERLAP", killzone: "LONDON", entryTime: ora(9) })
    ).toBe("OVERLAP");
  });

  it("folosește killzone când sessionType lipsește — ăsta era cazul rupt", () => {
    expect(sesiuneaTranzactiei({ killzone: "LONDON", entryTime: ora(2) })).toBe("LONDON");
  });

  it("cade pe ora de intrare când n-are nici sessionType, nici killzone", () => {
    // Calea sincronizărilor automate: MetaAPI, burse, webhook-uri.
    expect(sesiuneaTranzactiei({ entryTime: ora(3) })).toBe("ASIAN");
    expect(sesiuneaTranzactiei({ entryTime: ora(9) })).toBe("LONDON");
    expect(sesiuneaTranzactiei({ entryTime: ora(15) })).toBe("NEW_YORK");
  });

  it("întoarce null doar când nu știe absolut nimic", () => {
    expect(sesiuneaTranzactiei({})).toBeNull();
    expect(sesiuneaTranzactiei({ sessionType: null, killzone: null, entryTime: null })).toBeNull();
  });

  it("ignoră valori care nu sunt sesiuni sau killzone-uri valide", () => {
    expect(sesiuneaTranzactiei({ sessionType: "TOKYO", entryTime: ora(9) })).toBe("LONDON");
    expect(sesiuneaTranzactiei({ killzone: "SYDNEY", entryTime: ora(3) })).toBe("ASIAN");
  });

  it("pune London Close în sesiunea New York", () => {
    // 16:00–17:00 e ultima oră a Londrei, dar piața tranzacționată e americană.
    expect(sesiuneaTranzactiei({ killzone: "LONDON_CLOSE" })).toBe("NEW_YORK");
  });
});

describe("sesiuneaDupaOra — ferestrele", () => {
  const la = (h: number) => sesiuneaDupaOra(new Date(Date.UTC(2026, 0, 15, h, 0, 0)));

  it("acoperă toate cele 24 de ore, fără goluri", () => {
    for (let h = 0; h < 24; h++) {
      expect(la(h)).not.toBeNull();
    }
  });

  it("respectă aceleași ferestre ca seed-ul demo", () => {
    // Dacă astea se schimbă, datele derivate cad în alte coloane decât cele
    // demonstrative, iar matricea din video și cea a unui client arată diferit.
    // Inclusive la ambele capete, ca `randInt(h0, h1)` din seed.
    expect(la(0)).toBe("ASIAN");
    expect(la(6)).toBe("ASIAN");     // ultima oră asiatică, nu prima londoneză
    expect(la(7)).toBe("LONDON");
    expect(la(12)).toBe("LONDON");   // ultima oră londoneză
    expect(la(13)).toBe("NEW_YORK");
    expect(la(20)).toBe("NEW_YORK");
    expect(la(21)).toBe("ASIAN");    // Sydney e deja deschis
  });

  it("nu deduce niciodată OVERLAP", () => {
    // E o sesiune reală, dar formularul n-o oferă ca opțiune — ar apărea o
    // coloană pe care utilizatorul n-o poate alege, iar tranzacțiile
    // sincronizate ar ajunge în altă coloană decât cele etichetate manual la
    // aceeași oră.
    for (let h = 0; h < 24; h++) {
      expect(la(h)).not.toBe("OVERLAP");
    }
  });

  it("nu se sufocă la o dată invalidă", () => {
    expect(sesiuneaDupaOra("nu e o dată")).toBeNull();
  });
});
