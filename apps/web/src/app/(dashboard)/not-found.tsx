import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardNotFound() {
  const t = await getTranslations("errorPages");
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center px-4">
      {/* Glowing 404 */}
      <div className="relative">
        <p className="text-[120px] font-black text-zinc-900 leading-none select-none">404</p>
        <p className="absolute inset-0 text-[120px] font-black leading-none select-none bg-gradient-to-b from-zinc-700 to-zinc-900 bg-clip-text text-transparent blur-[1px]">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-indigo-500/8 border border-indigo-500/15 flex items-center justify-center">
            <Compass className="w-10 h-10 text-indigo-500/50" />
          </div>
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-black text-zinc-100 tracking-tight">{t("notFoundTitle")}</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          {t("notFoundRouteDesc")}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          asChild
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-2"
        >
          <Link href="javascript:history.back()">
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Link>
        </Button>
        <Button
          asChild
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 gap-2"
        >
          <Link href="/dashboard">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
