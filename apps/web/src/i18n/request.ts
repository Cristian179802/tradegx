import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { esteLimba, LIMBA_IMPLICITA } from "./locales";

// ── Limba fiecărei cereri ────────────────────────────────────────────────────
//
// DOUĂ SURSE, în ordinea asta:
//
// 1. Limba cerută EXPLICIT de cod — `getTranslations({ locale: "en" })`.
//    next-intl o trimite aici ca `locale`. O folosesc rutele de API pe care le
//    cheamă aplicația de telefon (`/api/pricing?lang=en`, `/api/roadmap`) și
//    PDF-ul raportului fiscal: toate știu exact în ce limbă vor răspunsul.
//
// 2. Cookie-ul `locale`, pus de comutatorul de limbă de pe site. E sursa
//    pentru paginile obișnuite, unde nimeni nu cere o limbă anume.
//
// Prima versiune citea DOAR cookie-ul și ignora limba cerută. Pe site nu se
// vedea nimic, fiindcă paginile nu cer limbă explicit. Dar aplicația nu trimite
// cookie — așa că `/api/pricing?lang=en` răspundea în română, iar ecranul de
// Abonament ieșea românesc chiar cu aplicația pusă pe engleză. Același lucru
// păța și PDF-ul raportului fiscal cerut în engleză.
//
// Cookie-ul se citește DOAR dacă nu s-a cerut explicit o limbă: o limbă cerută
// în cod e o decizie, cookie-ul e doar o preferință implicită.

export default getRequestConfig(async ({ locale: limbaCeruta }) => {
  const locale =
    limbaCeruta ?? (await cookies()).get("locale")?.value ?? LIMBA_IMPLICITA;

  // Lista limbilor active stă într-un singur loc: src/i18n/locales.ts.
  const resolvedLocale = esteLimba(locale) ? locale : LIMBA_IMPLICITA;

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
