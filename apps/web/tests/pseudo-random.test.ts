import { describe, it, expect } from "vitest";
import { aleatorStabil } from "@/lib/pseudo-random";

// Testul ăsta există pentru un bug care a ajuns în producție: decorațiuni
// generate cu `Math.random()` în timpul randării, care ieșeau altfel pe server
// decât în browser. React se plângea cu „#418" pe /dashboard și /calculator, și
// pica de tot cu „removeChild" pe pagina principală.
//
// Proprietatea care repară asta e una singură — aceeași sămânță dă mereu
// aceleași numere — deci pe ea o verificăm.

describe("aleatorStabil — decorațiuni care nu sparg hidratarea", () => {
  it("dă exact aceeași serie pentru aceeași sămânță", () => {
    const a = aleatorStabil(1234);
    const b = aleatorStabil(1234);
    const seria = (r: () => number) => Array.from({ length: 20 }, () => r());
    expect(seria(a)).toEqual(seria(b));
  });

  it("dă serii diferite pentru semințe diferite", () => {
    const a = Array.from({ length: 5 }, aleatorStabil(1));
    const b = Array.from({ length: 5 }, aleatorStabil(2));
    expect(a).not.toEqual(b);
  });

  it("rămâne în [0, 1), ca Math.random", () => {
    const r = aleatorStabil(0xbeef);
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("se împrăștie rezonabil, nu se blochează într-un colț", () => {
    const r = aleatorStabil(7);
    const valori = Array.from({ length: 2000 }, () => r());
    const medie = valori.reduce((s, v) => s + v, 0) / valori.length;
    // O medie în jur de 0.5 nu dovedește calitatea generatorului, dar prinde
    // varianta în care cineva îl înlocuiește cu ceva care întoarce mereu 0.
    expect(medie).toBeGreaterThan(0.44);
    expect(medie).toBeLessThan(0.56);
  });
});
