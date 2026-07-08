import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home, SearchX } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("errorPages");
  return (
    <div className="bg-zinc-950 min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-zinc-800 mb-2 select-none">404</p>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
          <SearchX className="h-8 w-8 text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">{t("notFoundTitle")}</h1>
        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
          {t("notFoundDesc")}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Home className="h-4 w-4" />
          {t("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
