/**
 * Numere „aleatoare" care ies la fel pe server și în browser.
 *
 * `Math.random()` chemat în timpul randării e una dintre cele mai frecvente
 * cauze de hidratare eșuată: serverul trimite un HTML cu un set de valori,
 * browserul randează altul, iar React fie se plânge („Minified React error
 * #418"), fie pică de tot încercând să împace nodurile („Failed to execute
 * 'removeChild' on 'Node'"). Amândouă apăreau în jurnalul de erori al
 * producției.
 *
 * Pentru decorațiuni ANIMATE, răspunsul e să le generezi după montare — nu se
 * vede că lipsesc un cadru.
 *
 * Pentru decorațiuni STATICE — un câmp de stele, un schelet de încărcare —
 * amânarea ar însemna un gol vizibil exact când pagina trebuie să pară deja
 * plină. Acolo nu vrem întâmplare, vrem doar variație: aceleași valori de
 * fiecare dată, pe ambele părți.
 *
 * mulberry32 — același generator ca în seed-ul demo, din același motiv:
 * ieftin, bine împrăștiat, și complet determinist pentru o sămânță dată.
 */
export function aleatorStabil(samanta: number): () => number {
  let a = samanta >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
