"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, Eye, EyeOff, CheckCircle2, Zap, ArrowRight,
  ShieldCheck, Check, X, User
} from "lucide-react";
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
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: "Minim 8 caractere", ok: password.length >= 8 },
    { label: "Literă mare", ok: /[A-Z]/.test(password) },
    { label: "Literă mică", ok: /[a-z]/.test(password) },
    { label: "Cifră sau simbol", ok: /[\d!@#$%^&*]/.test(password) },
  ], [password]);

  const score = checks.filter(c => c.ok).length;
  const strength = score <= 1 ? "Slabă" : score === 2 ? "Medie" : score === 3 ? "Bună" : "Puternică";
  const color = score <= 1 ? "rose" : score === 2 ? "amber" : score === 3 ? "indigo" : "emerald";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-fade-in">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= score
                ? color === "rose" ? "bg-rose-500" : color === "amber" ? "bg-amber-500" : color === "indigo" ? "bg-indigo-500" : "bg-emerald-500"
                : "bg-zinc-800"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={cn("text-[11px] font-semibold",
          color === "rose" ? "text-rose-400" :
          color === "amber" ? "text-amber-400" :
          color === "indigo" ? "text-indigo-400" : "text-emerald-400"
        )}>
          Parolă {strength}
        </p>
        <div className="flex gap-3">
          {checks.map((c, i) => (
            <span key={i} className={cn(
              "text-[10px] flex items-center gap-0.5 transition-colors",
              c.ok ? "text-zinc-400" : "text-zinc-700"
            )}>
              {c.ok
                ? <Check className="w-2.5 h-2.5 text-emerald-500" />
                : <X className="w-2.5 h-2.5" />
              }
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const isLoading = form.formState.isSubmitting;
  const passwordValue = form.watch("password");

  async function onSubmit(data: RegisterInput) {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    const json = await res.json();

    if (!json.success) {
      setError(json.error ?? "Eroare la înregistrare");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="relative animate-fade-in">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/20 via-transparent to-indigo-500/15 blur-sm" />
        <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-10 text-center shadow-2xl shadow-black/40">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent rounded-full" />

          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Verifică emailul!</h2>
          <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
            Am trimis un link de confirmare la adresa ta.
          </p>
          <p className="text-zinc-600 text-xs mb-8">Nu uita să verifici și folderul Spam.</p>

          <div className="grid grid-cols-3 gap-3 mb-8 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
            {[
              { label: "Cont DEMO", value: "$10,000" },
              { label: "Trial PRO", value: "14 zile" },
              { label: "Setup", value: "< 2 min" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-white font-black text-lg">{value}</p>
                <p className="text-zinc-600 text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 h-11 font-semibold shadow-lg shadow-indigo-500/25"
          >
            Mergi la autentificare
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative animate-fade-in-up">
      {/* Outer glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/15 blur-sm" />

      {/* Card */}
      <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent rounded-full" />

        {/* PRO trial badge */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 mb-4">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">14 zile PRO gratuit</span>
            <span className="text-[10px] text-indigo-500/70">• Fără card necesar</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1.5 tracking-tight">
            Creează cont gratuit
          </h1>
          <p className="text-zinc-400 text-sm">
            Jurnalul profesional pentru traderi SMC / ICT
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {["AI Coach", "Jurnal ICT/SMC", "Analiză avansată", "Broker sync"].map((f) => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-500 font-medium">
              ✓ {f}
            </span>
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/8 border border-rose-500/20 rounded-xl px-4 py-3 mb-5 animate-fade-in">
            <p className="text-rose-300 text-sm font-medium">{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                    Nume complet
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Ion Popescu"
                        autoComplete="name"
                        className="bg-zinc-800/60 border-zinc-700/80 text-white placeholder:text-zinc-600 focus:border-indigo-500/70 focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/10 h-11 pl-10 transition-all duration-200"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

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
                  <FormLabel className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                    Parolă
                  </FormLabel>
                  <FormControl>
                    <div>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Minim 8 caractere"
                          autoComplete="new-password"
                          className="bg-zinc-800/60 border-zinc-700/80 text-white placeholder:text-zinc-600 focus:border-indigo-500/70 focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/10 h-11 pr-10 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrength password={passwordValue} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                    Confirmă parola
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repetă parola"
                        autoComplete="new-password"
                        className="bg-zinc-800/60 border-zinc-700/80 text-white placeholder:text-zinc-600 focus:border-indigo-500/70 focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/10 h-11 pr-10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                "w-full relative overflow-hidden h-11 font-semibold text-sm mt-2",
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
                  Creează cont gratuit
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
              <div className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] bg-white/10 transition-transform duration-700 ease-out" />
            </Button>

            {/* Consimțământ legal */}
            <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
              Prin crearea contului ești de acord cu{" "}
              <Link href="/terms" className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2">
                Termenii și Condițiile
              </Link>{" "}
              și{" "}
              <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2">
                Politica de Confidențialitate
              </Link>
              .
            </p>
          </form>
        </Form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-900/90 px-3 text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
              sau continuă cu
            </span>
          </div>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={async () => {
            setIsGoogleLoading(true);
            await signIn("google", { callbackUrl: "/dashboard" });
          }}
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
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google
        </button>

        {/* Trust */}
        <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SSL 256-bit</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="text-[11px] text-zinc-600">GDPR compliant</div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="text-[11px] text-zinc-600">Zero spam</div>
        </div>

        <p className="text-xs text-zinc-600 text-center mt-4 leading-relaxed">
          Prin înregistrare, ești de acord cu{" "}
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 underline transition-colors">
            Termenii
          </Link>{" "}
          și{" "}
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline transition-colors">
            Politica de Confidențialitate
          </Link>
          .
        </p>

        <p className="text-center text-sm text-zinc-500 mt-3">
          Ai deja cont?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Conectează-te →
          </Link>
        </p>
      </div>
    </div>
  );
}
