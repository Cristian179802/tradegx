import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Pagina e componentă client, deci nu poate exporta `metadata`. Titlul de tab se
// pune de aici — altfel cade pe cel implicit al site-ului.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageTitles");
  return { title: t("glossary") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
