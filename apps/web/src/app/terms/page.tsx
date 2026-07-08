import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

export default async function TermsPage() {
  const t = await getTranslations("terms");
  const b = (c: React.ReactNode) => <strong className="text-zinc-300">{c}</strong>;
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <LegalSection title={t("s1Title")}>
        <p>{t("s1p1")}</p>
        <p>{t.rich("s1p2", { b })}</p>
      </LegalSection>

      <LegalSection title={t("s2Title")}>
        <p>{t("s2p1")}</p>
        <p>{t("s2p2")}</p>
      </LegalSection>

      <LegalSection title={t("s3Title")}>
        <p>{t("s3p1")}</p>
        <p>{t("s3p2")}</p>
      </LegalSection>

      <LegalSection title={t("s4Title")}>
        <p>{t("s4p1")}</p>
        <p>{t("s4p2")}</p>
      </LegalSection>

      <LegalSection title={t("s5Title")}>
        <p>{t("s5intro")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("s5l1")}</li>
          <li>{t("s5l2")}</li>
          <li>{t("s5l3")}</li>
          <li>{t("s5l4")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("s6Title")}>
        <p>{t("s6p1")}</p>
      </LegalSection>

      <LegalSection title={t("s7Title")}>
        <p>{t("s7p1")}</p>
      </LegalSection>

      <LegalSection title={t("s8Title")}>
        <p>{t("s8p1")}</p>
      </LegalSection>

      <LegalSection title={t("s9Title")}>
        <p>{t("s9p1")}</p>
      </LegalSection>

      <LegalSection title={t("s10Title")}>
        <p>
          {t.rich("s10p1", {
            mail: (c) => <a href="mailto:palcristi1@gmail.com" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
            contact: (c) => <a href="/contact" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
          })}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
