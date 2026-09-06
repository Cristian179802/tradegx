import { rateLimit } from "@/lib/rate-limit";
import { AI_QUOTA, type FunctieAI, type Tier } from "@/lib/plan";

// ── Cât AI intră într-un abonament ───────────────────────────────────────────
//
// DE CE EXISTĂ. Funcțiile AI aveau limite pe ORĂ, dar niciuna pe lună. 30 de
// mesaje pe oră înmulțit cu 720 de ore înseamnă 21.600 de mesaje permise de cod
// într-o singură lună — peste 450 $ în credit, pentru un abonament de 19 $.
// Limita pe oră oprește un scenariu de abuz; nu oprește deloc costul.
//
// Iar problema nu e abuzatorul. Un client entuziasmat care pune 33 de întrebări
// pe zi costă ~37 $ pe lună: unul singur mănâncă profitul de la alți patru.
//
// Cotele stau în `lib/plan.ts`, lângă definiția treptelor, fiindcă acolo e locul
// unde cineva se uită când schimbă prețurile — nu într-un fișier de infrastructură.

const O_LUNA_SEC = 30 * 24 * 3600;

export interface RezultatBuget {
  /** Cererea încape în cotă? */
  ok: boolean;
  /** Câte mai are după asta. */
  ramase: number;
  /** Când se reînnoiește cota (timestamp). */
  seReinnoieste: number;
  /** Cota treptei — 0 înseamnă funcție închisă pe treapta asta. */
  cota: number;
}

/**
 * Consumă o unitate din cota lunară a utilizatorului pentru o funcție AI.
 *
 * Se apelează DUPĂ limita pe oră, intenționat: aceea e o barieră de rafală, iar
 * cine e oprit de ea n-are de ce să piardă din cota lunii.
 *
 * Fereastra e ROTITOARE, de treizeci de zile de la prima folosire, nu
 * calendaristică. Așa nu apare valul de la întâi ale lunii, când toată lumea și-ar
 * primi cota în aceeași zi — pe un plan serverless, asta e diferența dintre o zi
 * scumpă și o factură neplăcută.
 *
 * Cheia NU include treapta: dacă cineva trece de la PRO la PREMIUM la mijlocul
 * lunii, contorul continuă de unde era, dar plafonul cu care se compară crește
 * imediat. Upgrade-ul se simte pe loc, fără să-i resetăm consumul — și fără să-i
 * dăm de două ori cota dacă face upgrade și downgrade.
 */
export async function consumaBugetLunar(
  functie: FunctieAI,
  userId: string,
  plan: Tier
): Promise<RezultatBuget> {
  const cota = AI_QUOTA[plan][functie];

  // Funcție închisă pe treapta asta: nu atingem contorul deloc. Altfel un
  // utilizator FREE ar consuma dintr-o cotă pe care n-o are, iar în ziua în care
  // face upgrade ar începe deja cu contorul umplut.
  if (cota === 0) {
    return { ok: false, ramase: 0, seReinnoieste: 0, cota: 0 };
  }

  const rl = await rateLimit(`ai-month:${functie}:${userId}`, {
    limit: cota,
    windowSecs: O_LUNA_SEC,
  });

  return { ok: rl.success, ramase: rl.remaining, seReinnoieste: rl.resetAt, cota };
}
