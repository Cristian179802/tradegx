"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Chrome, Loader2, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verified = searchParams.get("verified") === "true";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const isLoading = form.formState.isSubmitting;

  async function doSignIn(email: string, password: string, twoFactorCode?: string) {
    const res = await signIn("credentials", {
      email, password, code: twoFactorCode ?? "", redirect: false,
    });
    if (res?.error) {
      setError(twoFactorCode ? t("invalidCode") : t("invalidCredentials"));
      return false;
    }
    router.push(callbackUrl);
    router.refresh();
    return true;
  }

  // Pas 1: verifică parola și dacă e nevoie de 2FA (fără a crea sesiune)
  async function onSubmit(data: LoginInput) {
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa-required", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!json.ok) { setError(t("invalidCredentials")); return; }
      if (json.required) { setTwoFAStep(true); setCode(""); return; }
      await doSignIn(data.email, data.password);
    } catch {
      setError(t("invalidCredentials"));
    }
  }

  // Pas 2: cod 2FA
  async function verify2FA() {
    if (!code.trim()) return;
    setError(null);
    setVerifying(true);
    await doSignIn(form.getValues("email"), form.getValues("password"), code.trim());
    setVerifying(false);
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="relative animate-fade-in-up">
      {/* Outer glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/15 blur-sm" />

      {/* Card */}
      <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">

        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent rounded-full" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{t("secureAccess")}</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1.5 tracking-tight">
            {twoFAStep ? t("twoFATitle") : t("welcomeBack")}
          </h1>
          <p className="text-zinc-400 text-sm">{twoFAStep ? t("twoFADesc") : t("loginSubtitle")}</p>
        </div>

        {/* Verified banner */}
        {verified && (
          <div className="flex items-center gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-sm font-medium">{t("emailVerifiedBanner")}</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-rose-500/8 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 animate-fade-in">
            <p className="text-rose-300 text-sm font-medium">{error}</p>
          </div>
        )}

        {twoFAStep ? (
          <div className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9a-zA-Z-]/g, "").slice(0, 12))}
              inputMode="numeric"
              autoFocus
              placeholder="000000"
              onKeyDown={(e) => { if (e.key === "Enter") verify2FA(); }}
              className="bg-zinc-800/60 border-zinc-700/80 text-white text-center text-xl font-mono tracking-[0.35em] h-12 focus:border-indigo-500/70"
            />
            <Button
              onClick={verify2FA}
              disabled={verifying || !code.trim()}
              className="w-full h-11 font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <span className="flex items-center gap-2">{t("verify")}<ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
            <button
              type="button"
              onClick={() => { setTwoFAStep(false); setCode(""); setError(null); }}
              className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {t("backToLogin")}
            </button>
          </div>
        ) : (
        <>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="trader@exemplu.com"
                      autoComplete="email"
                      className="bg-zinc-800/60 border-zinc-700/80 text-white placeholder:text-zinc-600 focus:border-indigo-500/70 focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/10 h-11 transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                      {t("password")}
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="bg-zinc-800/60 border-zinc-700/80 text-white placeholder:text-zinc-600 focus:border-indigo-500/70 focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/10 h-11 pr-10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full relative overflow-hidden h-11 font-semibold text-sm",
                "bg-gradient-to-r from-indigo-600 to-violet-600",
                "hover:from-indigo-500 hover:to-violet-500",
                "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
                "transition-all duration-300 group"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {t("signIn")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
              {/* Shimmer effect */}
              <div className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] bg-white/10 transition-transform duration-700 ease-out" />
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-900/90 px-3 text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className={cn(
            "w-full flex items-center justify-center gap-3 h-11 rounded-xl",
            "border border-zinc-700/80 bg-zinc-800/50 hover:bg-zinc-800",
            "text-zinc-300 hover:text-white",
            "transition-all duration-200 text-sm font-medium",
            "hover:border-zinc-600",
            isGoogleLoading && "opacity-60 cursor-not-allowed"
          )}
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google
        </button>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SSL 256-bit</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            <span>{t("e2eEncryption")}</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="text-[11px] text-zinc-600">
            GDPR compliant
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            {t("registerFree")}
          </Link>
        </p>
        </>
        )}
      </div>
    </div>
  );
}
