// ── Analiză pe două dimensiuni: setup × sesiune ──────────────────────────────
//
// Restul paginii de analytics grupează pe O SINGURĂ dimensiune: win rate pe
// setup, win rate pe sesiune, win rate pe instrument. Fiecare răspunde la
// „ce merge?", dar niciuna la întrebarea care schimbă cu adevărat felul în care
// tranzacționezi cineva:
//
//   Același setup, sesiune diferită — merge la fel?
//
// Un FVG la 47% pe total pare mediocru și îl abandonezi. Împărțit pe sesiuni,
// se poate dovedi 61% în London și 23% în Asia — adică nu setup-ul e problema,
// ci ORA la care îl tranzacționezi. Cifra pe o dimensiune ascunde exact asta.
//
// ── DE CE STATISTICI SUFICIENTE, nu tranzacțiile brute ──────────────────────
//
// Serverul trimite un tabel de celule, nu lista de tranzacții. Fiecare celulă
// poartă sumele din care se poate reconstitui ORICE combinație de filtre prin
// simplă adunare — exact, nu aproximativ.
//
// Câștigul e dublu: încape într-un răspuns mic (cel mult câteva zeci de celule,
// indiferent dacă utilizatorul are 87 sau 8.000 de tranzacții), iar filtrarea în
// browser e instantanee, deci recalcularea se poate ANIMA. Cu refiltrare pe
// server, între apăsare și cifră ar exista o pauză de rețea, adică exact ce nu
// vrei să vezi în momentul în care descoperi ceva.
//
// Metricile aditive (număr, câștiguri, brut, sumă de R) se adună. Cele care
// depind de ORDINE — drawdown, serii — NU se pot obține din celule, și de aceea
// nu apar aici: mai bine lipsesc decât să fie calculate greșit.

export interface CelulaCrossTab {
  setup: string;
  sesiune: string;
  tranzactii: number;
  castiguri: number;
  /** suma câștigurilor, în bani (pozitivă) */
  brutCastig: number;
  /** suma pierderilor, în bani (pozitivă) */
  brutPierdere: number;
  /** suma R-multiplilor, doar pentru tranzacțiile care au risc înregistrat */
  sumaR: number;
  /** câte tranzacții au avut risc înregistrat (numitorul pentru media R) */
  cuR: number;
}

export interface AgregatCrossTab {
  tranzactii: number;
  castiguri: number;
  pierderi: number;
  winRate: number | null;
  net: number;
  profitFactor: number | null;
  castigMediu: number | null;
  pierdereMedie: number | null;
  expectancyR: number | null;
}

/** Tranzacția, redusă la ce contează pentru tabel. */
export interface TranzactieCrossTab {
  setupType: string | null;
  sessionType: string | null;
  pnlMoney: number | null;
  riskMoney: number | null;
}

/**
 * Construiește tabelul. Tranzacțiile fără setup SAU fără sesiune sunt
 * IGNORATE, nu puse la „altele": o celulă „necunoscut × necunoscut" nu spune
 * nimic despre ce funcționează, dar umflă totalurile și face procentele să nu
 * se potrivească cu restul paginii.
 */
export function construiesteCrossTab(tranzactii: TranzactieCrossTab[]): CelulaCrossTab[] {
  const celule = new Map<string, CelulaCrossTab>();

  for (const t of tranzactii) {
    if (!t.setupType || !t.sessionType) continue;
    const pnl = t.pnlMoney;
    if (pnl == null) continue;

    const cheie = `${t.setupType}|${t.sessionType}`;
    let c = celule.get(cheie);
    if (!c) {
      c = {
        setup: t.setupType,
        sesiune: t.sessionType,
        tranzactii: 0,
        castiguri: 0,
        brutCastig: 0,
        brutPierdere: 0,
        sumaR: 0,
        cuR: 0,
      };
      celule.set(cheie, c);
    }

    c.tranzactii++;
    if (pnl > 0) {
      c.castiguri++;
      c.brutCastig += pnl;
    } else {
      c.brutPierdere += Math.abs(pnl);
    }

    // R-ul se calculează doar unde există riscul înregistrat. O tranzacție
    // importată de la broker adesea nu-l are, iar a presupune unul ar produce
    // o expectanță inventată.
    if (t.riskMoney && t.riskMoney > 0) {
      c.sumaR += pnl / t.riskMoney;
      c.cuR++;
    }
  }

  return [...celule.values()];
}

/** Adună celulele care trec de filtru. Filtrele goale înseamnă „tot". */
export function agregaCelule(
  celule: CelulaCrossTab[],
  filtru: { setupuri?: string[]; sesiuni?: string[] } = {}
): AgregatCrossTab {
  const { setupuri, sesiuni } = filtru;
  const potrivite = celule.filter(
    (c) =>
      (!setupuri?.length || setupuri.includes(c.setup)) &&
      (!sesiuni?.length || sesiuni.includes(c.sesiune))
  );

  const s = potrivite.reduce(
    (a, c) => ({
      tranzactii: a.tranzactii + c.tranzactii,
      castiguri: a.castiguri + c.castiguri,
      brutCastig: a.brutCastig + c.brutCastig,
      brutPierdere: a.brutPierdere + c.brutPierdere,
      sumaR: a.sumaR + c.sumaR,
      cuR: a.cuR + c.cuR,
    }),
    { tranzactii: 0, castiguri: 0, brutCastig: 0, brutPierdere: 0, sumaR: 0, cuR: 0 }
  );

  const pierderi = s.tranzactii - s.castiguri;

  return {
    tranzactii: s.tranzactii,
    castiguri: s.castiguri,
    pierderi,
    winRate: s.tranzactii ? (s.castiguri / s.tranzactii) * 100 : null,
    net: s.brutCastig - s.brutPierdere,
    // profitFactor cu zero pierderi e infinit, nu un număr mare: întoarcem null
    // și lăsăm afișarea să pună „—", nu „999".
    profitFactor: s.brutPierdere > 0 ? s.brutCastig / s.brutPierdere : null,
    castigMediu: s.castiguri ? s.brutCastig / s.castiguri : null,
    pierdereMedie: pierderi ? s.brutPierdere / pierderi : null,
    expectancyR: s.cuR ? s.sumaR / s.cuR : null,
  };
}

/**
 * Sub câte tranzacții un procent nu mai e o statistică.
 *
 * 2 din 3 înseamnă 67%, dar nu înseamnă nimic — o singură tranzacție în plus îl
 * mută cu 17 puncte. Publicul SMC știe asta, și o celulă verde aprins pe trei
 * tranzacții e felul cel mai rapid de a pierde încrederea cuiva care se pricepe.
 *
 * 10 e pragul de la care ne permitem să spunem ceva, cu prudență.
 */
export const PRAG_ESANTION = 10;

export function esantionMic(tranzactii: number): boolean {
  return tranzactii > 0 && tranzactii < PRAG_ESANTION;
}
