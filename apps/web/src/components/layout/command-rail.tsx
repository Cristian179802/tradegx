"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, Target, BookOpen, NotebookPen, ListChecks, Trophy,
  Calculator, Shield, Award, TrendingUp, BarChart3, Landmark, Crosshair,
  Dices, FlaskConical, Receipt, Brain, BellRing, GraduationCap, Medal,
  LineChart, Globe, Gauge, CalendarDays, Newspaper, Users, Rocket,
  Settings, CreditCard, Search, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavPulse, compactMoney } from "@/lib/use-nav-pulse";

// ── Șina de comandă ──────────────────────────────────────────────────────────
//
// Înlocuiește lista verticală de 29 de linkuri. Problema ei nu era estetică, ci
// structurală: grupul „Trading" singur avea 16 intrări, iar meniul se derula.
// Într-un meniu care se derulează nu cauți — te resemnezi și folosești trei
// pagini din douăzeci și nouă.
//
// Aici sunt două niveluri. Șina, mereu vizibilă, are șase glife — câte domenii
// există. Domeniul deschis afișează un panou cu paginile lui, așezate pe
// coloane. Nimic nu se derulează, nimic nu se ascunde sub un „vezi mai mult",
// iar drumul până la orice pagină e: privire pe șină, un pas lateral, clic.
//
// Rutele NU s-au mutat între domenii. Prezentarea e nouă, harta e aceeași —
// altfel fiecare utilizator ar fi trebuit să reînvețe unde stau lucrurile, ceea
// ce e un preț mare pentru o îmbunătățire de formă.

interface NavItem {
  href: string;
  /** Cheie în `nav.*`. */
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  proOnly?: boolean;
}

interface NavColumn {
  /** Cheie în `nav.*`; lipsă = coloană fără titlu. */
  title?: string;
  items: NavItem[];
}

interface Domain {
  id: string;
  /** Cheie în `nav.*`. */
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  columns: NavColumn[];
}

const DOMAINS: Domain[] = [
  {
    id: "trading",
    label: "groupTrading",
    icon: LayoutDashboard,
    // Cele 16 pagini de trading, împărțite pe intenții. Subtitlurile nu schimbă
    // ierarhia — sunt doar repere care fac lista scanabilă dintr-o privire.
    columns: [
      {
        title: "subJournal",
        items: [
          { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
          { href: "/trades",    label: "trades",    icon: BookOpen },
          { href: "/journal",   label: "journal",   icon: NotebookPen },
          { href: "/checklist", label: "checklist", icon: ListChecks },
          { href: "/accounts",  label: "accounts",  icon: TrendingUp },
        ],
      },
      {
        title: "subAnalysis",
        items: [
          { href: "/analytics",     label: "analytics",     icon: BarChart3 },
          { href: "/edge",          label: "edge",          icon: Crosshair, badge: "NOU" },
          { href: "/monte-carlo",   label: "monteCarlo",    icon: Dices, badge: "NOU" },
          { href: "/backtesting",   label: "backtesting",   icon: FlaskConical },
          { href: "/institutional", label: "institutional", icon: Landmark, badge: "PRO" },
        ],
      },
      {
        title: "subRisk",
        items: [
          { href: "/risk-manager", label: "riskManager", icon: Shield },
          { href: "/calculator",   label: "calculator",  icon: Calculator },
          { href: "/goals",        label: "goals",       icon: Trophy },
          { href: "/prop-firm",    label: "propFirm",    icon: Award },
          { href: "/tax-report",   label: "taxReport",   icon: Receipt },
        ],
      },
    ],
  },
  {
    id: "ai",
    label: "groupAI",
    icon: Brain,
    columns: [{
      items: [
        { href: "/signals",      label: "signals",     icon: Target, badge: "HPS" },
        { href: "/ai-assistant", label: "aiAssistant", icon: Brain },
        { href: "/alerts",       label: "alerts",      icon: BellRing },
      ],
    }],
  },
  {
    id: "markets",
    label: "groupMarkets",
    icon: LineChart,
    columns: [{
      items: [
        { href: "/charts",   label: "charts",   icon: LineChart },
        { href: "/market",   label: "market",   icon: Globe },
        { href: "/tools",    label: "tools",    icon: Gauge },
        { href: "/calendar", label: "calendar", icon: CalendarDays },
        { href: "/news",     label: "news",     icon: Newspaper },
      ],
    }],
  },
  {
    id: "education",
    label: "groupEducation",
    icon: GraduationCap,
    columns: [{
      items: [
        { href: "/academy",      label: "academy",      icon: GraduationCap },
        { href: "/achievements", label: "achievements", icon: Medal, badge: "NOU" },
      ],
    }],
  },
  {
    id: "community",
    label: "groupCommunity",
    icon: Users,
    columns: [{
      items: [
        { href: "/community", label: "community", icon: Users, proOnly: true },
        { href: "/roadmap",   label: "roadmap",   icon: Rocket },
      ],
    }],
  },
  {
    id: "account",
    label: "groupAccount",
    icon: Settings,
    columns: [{
      items: [
        { href: "/settings", label: "settings", icon: Settings },
        { href: "/billing",  label: "billing",  icon: CreditCard },
      ],
    }],
  },
];

/** Toate rutele, ca să putem afla cărui domeniu îi aparține pagina curentă. */
const ROUTE_DOMAIN = new Map<string, string>(
  DOMAINS.flatMap((d) => d.columns.flatMap((c) => c.items.map((i) => [i.href, d.id] as const)))
);

/**
 * Ce pagină e deschisă, după rută: iconița, eticheta ei și domeniul din care face
 * parte.
 *
 * Exportat pentru bara de sus, ca cele două să nu se contrazică niciodată. Înainte
 * bara își ținea propria hartă de rute, cu emoji — deci o pagină nouă adăugată în
 * meniu apărea în șină și lipsea din titlu, iar nimeni nu observa până nu se uita
 * cineva la ecran.
 */
export function navMetaForRoute(pathname: string): {
  labelKey: string;
  domainKey: string;
  icon: React.ComponentType<{ className?: string }>;
} | null {
  let best: { labelKey: string; domainKey: string; icon: NavItem["icon"] } | null = null;
  let bestLen = 0;
  for (const d of DOMAINS) {
    for (const col of d.columns) {
      for (const it of col.items) {
        if ((pathname === it.href || pathname.startsWith(it.href + "/")) && it.href.length > bestLen) {
          best = { labelKey: it.label, domainKey: d.label, icon: it.icon };
          bestLen = it.href.length;
        }
      }
    }
  }
  return best;
}

export function CommandRail() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPro = session?.user?.plan === "PRO" || session?.user?.isTrialing;

  const pulse = useNavPulse();
  const [open, setOpen] = React.useState<string | null>(null);
  /** Deschis cu clic = rămâne; deschis cu mouse-ul = se închide la ieșire. */
  const [pinned, setPinned] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Referințe către glife, ca săgețile să poată muta focusul între ele.
  const glyphRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // Handler-ul de tastatură e montat o dată, deci nu poate citi starea direct.
  const openRef = React.useRef<string | null>(null);

  // Domeniul paginii curente. Potrivirea e pe prefix, ca `/trades/123` să
  // marcheze tot „Trading".
  const activeDomain = React.useMemo(() => {
    let best: string | null = null;
    let bestLen = 0;
    for (const [href, dom] of ROUTE_DOMAIN) {
      if ((pathname === href || pathname.startsWith(href + "/")) && href.length > bestLen) {
        best = dom; bestLen = href.length;
      }
    }
    return best;
  }, [pathname]);

  React.useEffect(() => { openRef.current = open; }, [open]);

  // Navigarea închide panoul: altfel ar rămâne deschis peste pagina nouă.
  React.useEffect(() => { setOpen(null); setPinned(false); }, [pathname]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      setPinned(false);
      // Focusul se ÎNTOARCE la glifa de unde a plecat. Fără asta, Escape îl
      // aruncă la începutul paginii, iar cine navighează cu tastatura trebuie să
      // refacă tot drumul până unde era — pedeapsă pentru că a închis un meniu.
      const i = DOMAINS.findIndex((d) => d.id === openRef.current);
      if (i >= 0) glyphRefs.current[i]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Întârzierea la deschidere există ca traversarea șinei spre conținut să nu
  // aprindă trei panouri pe drum. La închidere, întârzierea acoperă drumul
  // diagonal al mouse-ului de la glifă spre panou.
  const hoverOpen = (id: string) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    if (!pinned) setOpen(id);
  };
  const hoverClose = () => {
    if (pinned) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 180);
  };

  /**
   * Săgețile mută focusul între glife, ca într-o bară de instrumente reală.
   *
   * Fără asta, un utilizator care navighează cu tastatura trebuie să apese Tab de
   * șase ori ca să treacă de navigație, la FIECARE pagină. Iar cine folosește
   * tastatura o face de obicei pentru că nu are altă opțiune, nu din preferință.
   *
   * Se face pe săgeți, nu pe Tab: convenția pentru un grup de comenzi înrudite e
   * un singur opritor de Tab pentru tot grupul, iar înăuntru te miști cu săgeți.
   */
  const onGlyphKey = (e: React.KeyboardEvent, index: number) => {
    const last = DOMAINS.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    glyphRefs.current[next]?.focus();
  };

  const openDomain = DOMAINS.find((d) => d.id === open) ?? null;
  const activeIndex = DOMAINS.findIndex((d) => d.id === (open ?? activeDomain));

  return (
    <>
      <nav
        aria-label={t("mainNav")}
        onMouseLeave={hoverClose}
        className="hidden md:flex fixed inset-y-0 left-0 z-50 w-[68px] flex-col items-center
                   border-r border-[color:var(--line-1)] bg-[color:var(--s-0)]/95 backdrop-blur-xl"
      >
        {/* Coloana vertebrală: un segment de lumină care alunecă între glife.
            E singurul indicator de poziție — nu mai marcăm și fundalul glifei,
            ca ochiul să aibă un singur lucru de urmărit. */}
        <span
          aria-hidden
          className="absolute left-0 w-[2px] rounded-r-full transition-[transform,opacity] duration-[320ms]"
          style={{
            height: 26,
            top: 0,
            opacity: activeIndex >= 0 ? 1 : 0,
            // Poziția e calculată, nu ghicită: logo 16+40+12, căutare 36+16 → prima
            // glifă începe la 120px. Pasul e 44 (înălțimea glifei) + 8 (spațiul) = 52.
            // Segmentul are 26px, deci se centrează la +9 față de marginea glifei.
            transform: `translateY(${129 + activeIndex * 52}px)`,
            background: "linear-gradient(180deg,#8b93f2,var(--accent))",
            boxShadow: "0 0 10px rgba(109,117,246,0.55)",
            transitionTimingFunction: "cubic-bezier(0.22,0.61,0.36,1)",
          }}
        />

        <Link href="/dashboard" className="mt-4 mb-3 grid place-items-center w-10 h-10 rounded-xl
                   bg-gradient-to-br from-[color:var(--accent)]/25 to-transparent
                   border border-[color:var(--accent-line)]">
          <span className="text-[15px] font-black tracking-tight text-[color:var(--ink-1)]">G</span>
        </Link>

        {/* Căutarea stă deasupra domeniilor fiindcă e cea mai rapidă cale spre
            orice pagină — mai rapidă decât șina însăși, odată ce o știi. */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          title={`${t("search")} — Ctrl+K`}
          className="mb-4 grid place-items-center w-9 h-9 rounded-xl border border-[color:var(--line-1)]
                     bg-[color:var(--s-2)] text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]
                     hover:border-[color:var(--accent-line)] transition-colors"
        >
          <Search className="w-[17px] h-[17px]" />
        </button>

        <div className="flex flex-col gap-2">
          {DOMAINS.map((d, i) => {
            const Icon = d.icon;
            const isOpen = open === d.id;
            const isHere = activeDomain === d.id;
            return (
              <button
                key={d.id}
                type="button"
                ref={(el) => { glyphRefs.current[i] = el; }}
                title={t(d.label)}
                aria-label={t(d.label)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-current={isHere ? "page" : undefined}
                // Un singur opritor de Tab pentru tot grupul; înăuntru, săgeți.
                tabIndex={isHere || (activeDomain === null && i === 0) ? 0 : -1}
                onKeyDown={(e) => onGlyphKey(e, i)}
                onFocus={() => hoverOpen(d.id)}
                onMouseEnter={() => hoverOpen(d.id)}
                onClick={() => {
                  if (isOpen && pinned) { setOpen(null); setPinned(false); }
                  else { setOpen(d.id); setPinned(true); }
                }}
                className={cn(
                  "relative grid place-items-center w-11 h-11 rounded-xl transition-all duration-200",
                  // Inelul de focus e OBLIGATORIU vizibil: pe un buton fără text,
                  // cine navighează cu tastatura n-are alt indiciu unde se află.
                  "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-[color:var(--s-0)]",
                  "border",
                  isOpen || isHere
                    ? "border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--ink-1)]"
                    : "border-transparent text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] hover:bg-[color:var(--s-2)]"
                )}
              >
                <Icon className="w-[19px] h-[19px]" />

                {/* Datele vii pe glifă. Doar CE SE SCHIMBĂ și cere o decizie —
                    alertele care așteaptă, pozițiile care sunt încă în piață.
                    Restul stă în panou, unde e loc de context. */}
                {d.id === "ai" && !!pulse?.alerts && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center
                                   rounded-full text-[9px] font-black tabular-nums
                                   bg-[color:var(--accent)] text-white
                                   shadow-[0_0_8px_rgba(109,117,246,0.6)]">
                    {pulse.alerts > 9 ? "9+" : pulse.alerts}
                  </span>
                )}
                {d.id === "trading" && !!pulse?.openPositions && (
                  // Punct, nu cifră: numărul de poziții deschise nu-ți cere nimic,
                  // doar te anunță că ai ceva în piață. Un număr ar striga.
                  <span
                    className="absolute top-1 right-1 w-[5px] h-[5px] rounded-full bg-[color:var(--accent)]"
                    style={{ boxShadow: "0 0 6px rgba(109,117,246,0.9)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Panoul domeniului ──
          Alunecă din șină, nu apare din neant: mișcarea spune de unde vine, deci
          nu trebuie să cauți cu ochii ce s-a schimbat pe ecran. */}
      {openDomain && (
        <div
          onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
          onMouseLeave={hoverClose}
          aria-label={t(openDomain.label)}
          className="hidden md:block fixed inset-y-0 left-[68px] z-40 w-auto min-w-[260px] max-w-[720px]
                     border-r border-[color:var(--line-1)] bg-[color:var(--s-1)]/97 backdrop-blur-2xl
                     shadow-[24px_0_60px_-30px_rgba(0,0,0,0.9)]"
          style={{ animation: "tg-rail-in 200ms cubic-bezier(0.22,0.61,0.36,1) both" }}
        >
          <div className="px-5 pt-6 pb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--ink-4)]">
              {t(openDomain.label)}
            </p>

            {/* Contextul viu al domeniului. În panou e loc de cifră ȘI de ce
                înseamnă ea — pe glifă încăpea doar semnalul.

                Verdele și roșul apar DOAR aici, pe P&L, fiindcă doar acolo au
                înțeles semantic. Soldul rămâne neutru: e cât ai, nu cât ai
                câștigat. */}
            {openDomain.id === "trading" && pulse && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-4)]">
                    {t("pulseBalance")}
                  </span>
                  <span className="text-[13px] font-bold tabular-nums text-[color:var(--ink-1)]">
                    {/* Soldul nu poartă semn: „+900" ar sugera un câștig, când
                        de fapt e cât ai în cont. Semnul aparține P&L-ului. */}
                    {compactMoney(pulse.balance, { plus: false })}
                  </span>
                </span>

                {pulse.tradesToday > 0 && (
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-4)]">
                      {t("pulseToday")}
                    </span>
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ color: pulse.pnlToday >= 0 ? "var(--gain)" : "var(--loss)" }}
                    >
                      {compactMoney(pulse.pnlToday)}
                    </span>
                  </span>
                )}

                {pulse.openPositions > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-[5px] h-[5px] rounded-full bg-[color:var(--accent)]"
                          style={{ boxShadow: "0 0 6px rgba(109,117,246,0.9)" }} />
                    <span className="text-[11px] font-semibold text-[color:var(--ink-2)]">
                      {t("pulseOpen", { count: pulse.openPositions })}
                    </span>
                  </span>
                )}
              </div>
            )}

            {openDomain.id === "ai" && !!pulse?.alerts && (
              <p className="mt-3 text-[11px] font-semibold text-[color:var(--accent)]">
                {t("pulseAlerts", { count: pulse.alerts })}
              </p>
            )}
          </div>

          <div className="flex gap-1 px-3 pb-6">
            {openDomain.columns.map((col, ci) => (
              <div key={ci} className="min-w-[196px] flex-1">
                {col.title && (
                  <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)]/70">
                    {t(col.title)}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {col.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const locked = item.proOnly && !isPro;
                    return (
                      <Link
                        key={item.href}
                        href={locked ? "/billing" : item.href}
                        className={cn(
                          "tg-nav group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px]",
                          active
                            ? "tg-nav-on text-[color:var(--ink-1)]"
                            : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)] hover:bg-[color:var(--s-2)]"
                        )}
                      >
                        <Icon className={cn(
                          "w-[15px] h-[15px] shrink-0 transition-colors",
                          active ? "text-[color:var(--accent)]" : "text-[color:var(--ink-4)] group-hover:text-[color:var(--ink-2)]"
                        )} />
                        <span className="text-[13px] font-medium truncate">{t(item.label)}</span>
                        {locked && <Lock className="w-3 h-3 shrink-0 text-[color:var(--ink-4)]" />}
                        {item.badge && !locked && (
                          <span className="ml-auto shrink-0 rounded px-1 py-px text-[9px] font-black tracking-wide
                                           border border-[color:var(--accent-line)] bg-[color:var(--accent-soft)]
                                           text-[color:var(--accent)]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
