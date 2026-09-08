// ── Ajutoare pure pe textul erorilor ─────────────────────────────────────────
//
// Amprenta (gruparea) și rezumatul (alerta). Amândouă sunt transformări pure de
// text, deci stau împreună și se pot testa fără Prisma și fără `server-only`.
//
// Stă SEPARAT de `error-monitor.ts` din două motive:
//
// 1. Acolo e `server-only` și Prisma, deci nu se poate importa într-un test.
//    Prima variantă a testului își copia logica de aici — și copia a rămas în
//    urmă de original, iar eu am depanat replica, convins că repar codul.
//
// 2. `instrumentation.ts` se încarcă în AMBELE runtime-uri, Node și Edge.
//    Webpack urmărește chiar și un import dinamic, deci orice dependență de
//    `node:crypto` pe lanțul ăsta strică build-ul cu „Unhandled scheme".
//    De-aia hash-ul de mai jos e JavaScript pur: merge oriunde.
//
// Nu e nevoie de criptografie. Amprenta grupează mesaje de eroare — trebuie să
// fie stabilă și suficient de dispersată, nu rezistentă la un atacator. Nimeni
// nu câștigă nimic construind o coliziune într-o listă de erori.

/**
 * FNV-1a pe 64 de biți. Simplu, rapid, bine dispersat pentru șiruri scurte.
 *
 * `BigInt` fiindcă JavaScript n-are întregi pe 64 de biți: cu numere obișnuite
 * înmulțirea ar pierde biți de sus și dispersia s-ar strica exact acolo unde
 * contează.
 */
function fnv1a64(text: string, offset: bigint): string {
  const PRIM = 1099511628211n;
  const MASCA = 0xffffffffffffffffn;
  let h = offset;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * PRIM) & MASCA;
  }
  return h.toString(16).padStart(16, "0");
}

/**
 * Normalizează mesajul înainte de hash.
 *
 * Fără asta, „Trade cmr123 negăsit" și „Trade cmr456 negăsit" ar fi două grupuri
 * diferite — adică exact zgomotul pe care gruparea trebuie să-l elimine. O rută
 * care eșuează pe fiecare tranzacție ar produce un rând per tranzacție și ar
 * îneca tot restul.
 */
export function normalizeMessage(raw: string): string {
  return (
    raw
      // Ordinea contează: UUID-ul are cratime, deci trebuie prins ÎNAINTE ca
      // bucățile lui să fie înlocuite separat.
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "«id»")
      // CUID-urile bazei noastre (cmrqunlsr0010zz2d94tt8b46) NU sunt hexazecimale:
      // au litere dincolo de a-f. O regulă doar pe hex le lăsa să treacă, iar
      // atunci fiecare tranzacție își producea propriul grup.
      .replace(/\b[a-z0-9]{20,}\b/gi, "«id»")
      .replace(/\b[0-9a-f]{8,}\b/gi, "«id»")
      .replace(/\d{3,}/g, "«nr»")
      .slice(0, 200)
  );
}

/**
 * Identitatea grupului: etichetă + tipul erorii + mesajul normalizat.
 *
 * Două treceri cu baze diferite dau 128 de biți — la scara unei liste de erori,
 * probabilitatea unei coliziuni e neglijabilă.
 */
export function errorFingerprint(label: string, err: unknown): string {
  const tip = err instanceof Error ? err.name : typeof err;
  const mesaj = normalizeMessage(err instanceof Error ? err.message : String(err));
  const intrare = `${label}|${tip}|${mesaj}`;
  return fnv1a64(intrare, 14695981039346656037n) + fnv1a64(intrare, 1469598103934665603n);
}

/**
 * Rezumatul unei erori, pentru alerta de pe telefon.
 *
 * DE CE NU PUR ȘI SIMPLU PRIMELE 300 DE CARACTERE. Erorile Prisma încep prin a
 * reproduce ÎNTREAGA interogare și abia la final spun ce a fost greșit. Tăiate de
 * la început, alerta ajungea un dump de query rupt la jumătatea unui cuvânt, iar
 * diagnosticul — singurul lucru care contează — rămânea afară. Verificat pe
 * Telegramul real, nu presupus.
 *
 * Așa că luăm prima linie (CE a eșuat) și ultima linie utilă (DE CE), sărind
 * peste corpul interogării dintre ele. Stiva completă rămâne oricum în panou.
 */
export function summarizeError(raw: string, maxLen = 300): string {
  const linii = raw
    .split("\n")
    .map((l) => l.trim())
    // Liniile care sunt doar structură de obiect nu spun nimic.
    .filter((l) => l.length > 0 && !/^[{}\[\],]+$/.test(l));

  if (linii.length === 0) return raw.slice(0, maxLen);

  const prima = linii[0];
  const ultima = linii[linii.length - 1];

  const rezumat = prima === ultima ? prima : `${prima} … ${ultima}`;
  return rezumat.length > maxLen ? rezumat.slice(0, maxLen - 1) + "…" : rezumat;
}
