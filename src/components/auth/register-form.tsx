"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Chrome, Loader2, Eye, EyeOff, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerSchema, type RegisterInput } from "@/lib/validations";

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
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Verifică emailul</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Am trimis un link de confirmare la adresa ta. Verifică și folderul Spam.
        </p>
        <Button
          onClick={() => router.push("/login")}
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Mergi la autentificare
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
      <div className="mb-6">
        <Badge className="mb-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
          <Zap className="w-3 h-3 mr-1" />
          14 zile PRO gratuit
        </Badge>
        <h1 className="text-2xl font-bold text-white mb-1">Creează cont gratuit</h1>
        <p className="text-zinc-400 text-sm">Fără card de credit necesar</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 text-sm">Nume complet</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ion Popescu"
                    autoComplete="name"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500"
                  />
                </FormControl>
                <FormMessage className="text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 text-sm">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="trader@exemplu.com"
                    autoComplete="email"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500"
                  />
                </FormControl>
                <FormMessage className="text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 text-sm">Parolă</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Minim 8 caractere"
                      autoComplete="new-password"
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 text-sm">Confirmă parola</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repetă parola"
                      autoComplete="new-password"
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-rose-400" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-11 shadow-lg shadow-indigo-500/25 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Creează cont gratuit"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-900/50 px-3 text-xs text-zinc-500">sau</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={async () => {
          setIsGoogleLoading(true);
          await signIn("google", { callbackUrl: "/dashboard" });
        }}
        disabled={isGoogleLoading}
        className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Chrome className="w-4 h-4 mr-2" />
        )}
        Continuă cu Google
      </Button>

      <p className="text-xs text-zinc-600 text-center mt-5 leading-relaxed">
        Prin înregistrare, ești de acord cu{" "}
        <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 underline">
          Termenii
        </Link>{" "}
        și{" "}
        <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline">
          Confidențialitatea
        </Link>
        .
      </p>

      <p className="text-center text-sm text-zinc-500 mt-4">
        Ai deja cont?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Conectează-te
        </Link>
      </p>
    </div>
  );
}
