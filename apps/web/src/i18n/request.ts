import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ro";
  // Doar limbile cu dicționar existent (altfel import-ul aruncă la runtime)
  const validLocales = ["ro", "en"];
  const resolvedLocale = validLocales.includes(locale) ? locale : "ro";

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
