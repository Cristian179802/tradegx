"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Zap, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AccountSwitcher } from "@/components/layout/account-switcher";
import { navMetaForRoute } from "@/components/layout/command-rail";
import { useAuthStore } from "@/stores/auth.store";

// ── Bara de sus ──────────────────────────────────────────────────────────────
//
// Rescrisă după ce navigația a preluat greul. Ce s-a schimbat și de ce:
//
// EMOJI SCOASE. Titlul fiecărei pagini avea un emoji — 📋 📓 🧮 📈. Se randează
// diferit pe fiecare sistem de operare, nu se poate colora, nu se aliniază cu
// textul, și se ceartă cu setul de iconițe folosit în tot restul aplicației. Era
// cel mai învechit lucru vizibil din produs. Acum vine aceeași iconiță ca în
// șină, din aceeași sursă — deci o pagină nouă nu mai poate apărea într-un loc
// și lipsi din celălalt.
//
// „TRADEGX >" SCOS. Duplica logoul, care stă la doi centimetri în șină. În locul
// lui, un fir de ariadnă care chiar spune ceva: domeniul din care face parte
// pagina.
//
// ROATA DE SETĂRI SCOASĂ. Ruta există în șină, sub „Cont". Un al doilea drum
// spre aceeași pagină ocupă spațiu și pune utilizatorul să aleagă între două
// lucruri identice.
//
// CONTUL MUTAT LA STÂNGA, lângă titlu. Era centrat absolut — fragil la
// redimensionare, și, mai rău, arăta ca o decorațiune. E singurul lucru din bară
// care schimbă înțelesul a tot ce e pe ecran: dacă nu știi ce cont privești, nu
// știu ce înseamnă cifrele de dedesubt.

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleMobileSidebar } = useAuthStore();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const meta = navMetaForRoute(pathname);
  const Icon = meta?.icon;

  return (
    <div className="shrink-0">
      <header
        className="relative h-12 flex items-center gap-3 px-4 md:px-5
                   border-b border-[color:var(--line-1)] backdrop-blur-xl"
        style={{ background: "color-mix(in srgb, var(--s-1) 92%, transparent)" }}
      >
        {/* Firul de lumină de sub bară: aceeași grămadă de accent ca marginea
            șinei, ca cele două să pară o singură piesă, nu două componente lipite. */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, var(--accent-line), transparent 55%)" }}
        />

        {/* Meniul mobil: pe ecran îngust șina nu există, deci sertarul rămâne
            singura cale spre navigație. */}
        <button
          onClick={toggleMobileSidebar}
          className="tg-tap md:hidden grid place-items-center w-8 h-8 -ml-1 rounded-lg
                     text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]
                     hover:bg-[color:var(--s-2)] transition-colors"
          aria-label={tCommon("openMenu")}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Unde ești. Domeniul e stins, pagina e aprinsă — ierarhia se citește
            fără să fie nevoie de o săgeată între ele. */}
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0
                             border border-[color:var(--line-1)] bg-[color:var(--s-2)]">
              <Icon className="w-[15px] h-[15px] text-[color:var(--accent)]" />
            </span>
          )}
          <div className="min-w-0 leading-none">
            {meta && (
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)] mb-[3px]">
                {tNav(meta.domainKey)}
              </p>
            )}
            <h1 className="text-[13px] font-bold tracking-tight text-[color:var(--ink-1)] truncate">
              {meta ? tNav(meta.labelKey) : "TradeGx"}
            </h1>
          </div>
        </div>

        {/* Separator vertical: marchează că ce urmează e alt fel de informație —
            nu unde ești, ci ce privești. */}
        <span aria-hidden className="hidden md:block w-px h-5 bg-[color:var(--line-1)]" />

        {/* Contul. Singurul lucru din bară care schimbă înțelesul întregului ecran. */}
        <div className="hidden md:block min-w-0">
          <AccountSwitcher />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 shrink-0">
          {session?.user?.isTrialing && (
            <Link href="/pricing" className="hidden sm:block">
              <Badge className="gap-1 flex items-center text-[10px] px-2 py-0.5 cursor-pointer
                                border border-[color:var(--accent-line)] bg-[color:var(--accent-soft)]
                                text-[color:var(--accent)] hover:bg-[color:var(--accent)]/20 transition-colors">
                <Zap className="w-2.5 h-2.5" />
                {tCommon("trialPro")}
              </Badge>
            </Link>
          )}
          {session?.user?.plan === "PRO" && !session?.user?.isTrialing && (
            <Badge className="text-[10px] px-2 py-0.5 font-black tracking-wide
                              border border-[color:var(--accent-line)] bg-[color:var(--accent-soft)]
                              text-[color:var(--accent)]">
              PRO
            </Badge>
          )}
          <LanguageSwitcher compact />
          <NotificationDropdown />
        </div>
      </header>
    </div>
  );
}
