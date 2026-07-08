import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, MessageCircle, ShieldCheck, Clock } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contactPage");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  return (
    <LegalPage title={t("title")}>
      <p className="text-sm leading-relaxed text-zinc-400 -mt-4">
        {t("intro")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:palcristi1@gmail.com"
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 hover:border-indigo-500/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">{t("emailTitle")}</h2>
          <p className="text-sm text-indigo-400 group-hover:text-indigo-300 font-semibold">
            palcristi1@gmail.com
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            {t("emailDesc")}
          </p>
        </a>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">{t("secTitle")}</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {t.rich("secDesc", {
              b: (c) => <span className="text-zinc-300 font-semibold">{c}</span>,
              code: (c) => <span className="text-zinc-400 font-mono text-[11px]">{c}</span>,
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <MessageCircle className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">{t("fbTitle")}</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {t("fbDesc")}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">{t("timeTitle")}</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {t("timeDesc")}
          </p>
        </div>
      </div>

      <LegalSection title={t("idTitle")}>
        <p>
          {t.rich("idP", {
            privacy: (c) => <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
            terms: (c) => <a href="/terms" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
          })}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
