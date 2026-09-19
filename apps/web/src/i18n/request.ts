import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { esteLimba, LIMBA_IMPLICITA } from "./locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ro";
  // Lista limbilor active sta intr-un singur loc: src/i18n/locales.ts.
  const resolvedLocale = esteLimba(locale) ? locale : LIMBA_IMPLICITA;

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
