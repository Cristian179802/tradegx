import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ro";
  const validLocales = ["ro", "en", "es", "de", "fr", "it"];
  const resolvedLocale = validLocales.includes(locale) ? locale : "ro";

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
