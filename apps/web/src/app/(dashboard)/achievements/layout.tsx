import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Pagina e componentă client, deci nu poate exporta `metadata`. Titlul de tab se
// pune de aici — altfel cade pe cel implicit al site-ului, iar cu mai multe taburi
// deschise nu mai poți distinge paginile între ele.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageTitles");
  return { title: t("achievements") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
