import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const b = (c: React.ReactNode) => <strong className="text-zinc-300">{c}</strong>;
  return (
    <LegalPage title={t("title")}>
      <LegalSection title={t("s1Title")}>
        <p>{t.rich("s1p1", { b })}</p>
        <p>{t("s1p2")}</p>
      </LegalSection>

      <LegalSection title={t("s2Title")}>
        <p>{t.rich("s2p1", { b })}</p>
        <p>{t("s2p2")}</p>
      </LegalSection>

      <LegalSection title={t("s3Title")}>
        <p>
          {t.rich("s3p1", {
            roadmap: (c) => <a href="/roadmap" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
            pricing: (c) => <a href="/#preturi" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
          })}
        </p>
      </LegalSection>

      <LegalSection title={t("s4Title")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t.rich("s4l1", { b })}</li>
          <li>{t.rich("s4l2", { b })}</li>
          <li>{t.rich("s4l3", { b })}</li>
          <li>{t.rich("s4l4", { b })}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("s5Title")}>
        <p>
          {t.rich("s5p1", {
            contact: (c) => <a href="/contact" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
          })}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
