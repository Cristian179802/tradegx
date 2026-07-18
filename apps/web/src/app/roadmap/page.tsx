import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("roadmap");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

const SHIPPED = ["sh1","sh2","sh3","sh4","sh5","sh6","sh7","sh8","sh9","sh10","sh11","sh12","sh13","sh14","sh15","sh16","sh17","sh18","sh19","sh20","sh21","sh22"];
const IN_PROGRESS = ["ip1"];
const PLANNED = ["pl8","pl9","pl15","pl10","pl11","pl12","pl14","pl13","pl3","pl4","pl1","pl5","pl16","pl7"];
const VISION = ["vs1","vs2","vs3","vs10","vs11","vs12","vs4","vs5","vs6","vs13","vs7","vs8","vs14","vs9"];

function List({
  items,
  icon: Icon,
  iconClass,
  t,
}: {
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  t: (key: string) => string;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} />
          {t(item)}
        </li>
      ))}
    </ul>
  );
}

export default async function RoadmapPage() {
  const t = await getTranslations("roadmap");
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <p className="text-sm leading-relaxed text-zinc-400 -mt-4">
        {t.rich("intro", {
          contact: (c) => <a href="/contact" className="text-indigo-400 hover:text-indigo-300">{c}</a>,
        })}
      </p>

      <section>
        <h2 className="text-base font-bold text-emerald-400 mb-4">{t("shippedH")}</h2>
        <List items={SHIPPED} icon={CheckCircle2} iconClass="text-emerald-400" t={t} />
      </section>

      <section>
        <h2 className="text-base font-bold text-amber-400 mb-4">{t("progressH")}</h2>
        <List items={IN_PROGRESS} icon={Loader2} iconClass="text-amber-400" t={t} />
      </section>

      <section>
        <h2 className="text-base font-bold text-zinc-300 mb-4">{t("plannedH")}</h2>
        <List items={PLANNED} icon={Circle} iconClass="text-zinc-600" t={t} />
      </section>

      <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-500/[0.07] to-transparent p-5 -mx-1">
        <h2 className="text-base font-bold text-violet-300 mb-2">{t("visionH")}</h2>
        <p className="text-sm leading-relaxed text-zinc-400 italic mb-4">{t("visionIntro")}</p>
        <List items={VISION} icon={Sparkles} iconClass="text-violet-400" t={t} />
      </section>
    </LegalPage>
  );
}
