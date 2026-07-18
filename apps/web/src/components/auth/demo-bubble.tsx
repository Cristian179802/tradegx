"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Loader2, Radar } from "lucide-react";

// ── Bula plutitoare „Explorează demo" ────────────────────────────────────────
// Orb holografic pe paginile de autentificare: un click → intri în contul
// demo (read-only) cu date complete de trader avansat. Fără înregistrare.

const DEMO_EMAIL = "demo@tradegx.com";
const DEMO_PASSWORD = "DemoTrader2026!";

export function DemoBubble() {
  const t = useTranslations("auth");
  const [busy, setBusy] = React.useState(false);

  async function enterDemo() {
    if (busy) return;
    setBusy(true);
    try {
      await signIn("credentials", {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        callbackUrl: "/dashboard",
      });
    } catch {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
      className="fixed bottom-5 right-5 z-50"
    >
      {/* plutire lentă continuă */}
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
        <button
          onClick={enterDemo}
          disabled={busy}
          aria-label={t("demoTitle")}
          className="group relative flex items-center gap-3 rounded-2xl border border-emerald-500/35 bg-zinc-950/85 backdrop-blur-xl pl-3 pr-4 py-3 shadow-2xl shadow-emerald-500/10 hover:border-emerald-400/60 transition-all text-left disabled:cursor-wait"
        >
          {/* inel radar pulsând în jurul orbului */}
          <span className="relative flex items-center justify-center w-10 h-10 shrink-0">
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-emerald-400/60"
            />
            <span className="absolute inset-0 rounded-full bg-emerald-500/15 blur-sm" aria-hidden />
            <span className="relative flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/25 to-teal-500/10">
              {busy
                ? <Loader2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-emerald-300 animate-spin" />
                : <Radar className="w-[18px] h-[18px] text-emerald-300" />}
            </span>
          </span>

          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-black text-zinc-100">{busy ? t("demoLoading") : t("demoTitle")}</span>
              <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded px-1.5 py-0.5">LIVE</span>
            </span>
            <span className="text-[11px] text-zinc-500 leading-tight mt-0.5 max-w-[210px]">{t("demoSub")}</span>
          </span>

          {/* fascicul pe muchia de sus */}
          <span className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" aria-hidden />
        </button>
      </motion.div>
    </motion.div>
  );
}
