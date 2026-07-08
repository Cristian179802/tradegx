import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy_page");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy_page");
  const b = (c: React.ReactNode) => <strong className="text-zinc-300">{c}</strong>;
  const mail = (c: React.ReactNode) => <a href="mailto:palcristi1@gmail.com" className="text-indigo-400 hover:text-indigo-300">{c}</a>;
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <LegalSection title={t("s1Title")}>
        <p>{t.rich("s1p1", { mail })}</p>
      </LegalSection>

      <LegalSection title={t("s2Title")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t.rich("s2l1", { b })}</li>
          <li>{t.rich("s2l2", { b })}</li>
          <li>{t.rich("s2l3", { b })}</li>
          <li>{t.rich("s2l4", { b })}</li>
        </ul>
        <p>{t("s2p")}</p>
      </LegalSection>

      <LegalSection title={t("s3Title")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("s3l1")}</li>
          <li>{t("s3l2")}</li>
          <li>{t("s3l3")}</li>
          <li>{t("s3l4")}</li>
        </ul>
        <p>{t.rich("s3p", { b })}</p>
      </LegalSection>

      <LegalSection title={t("s4Title")}>
        <p>{t("s4p1")}</p>
      </LegalSection>

      <LegalSection title={t("s5Title")}>
        <p>{t("s5intro")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t.rich("s5l1", { b })}</li>
          <li>{t.rich("s5l2", { b })}</li>
          <li>{t.rich("s5l3", { b })}</li>
          <li>{t.rich("s5l4", { b })}</li>
          <li>{t.rich("s5l5", { b })}</li>
          <li>{t.rich("s5l6", { b })}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("s6Title")}>
        <p>{t("s6p1")}</p>
      </LegalSection>

      <LegalSection title={t("s7Title")}>
        <p>{t.rich("s7p1", { mail })}</p>
      </LegalSection>

      <LegalSection title={t("s8Title")}>
        <p>{t("s8p1")}</p>
      </LegalSection>

      <LegalSection title={t("s9Title")}>
        <p>{t("s9p1")}</p>
      </LegalSection>
    </LegalPage>
  );
}
