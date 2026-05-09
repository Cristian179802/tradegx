"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
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
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Eroare. Încearcă din nou.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
      {sent ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Verifică emailul</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Dacă adresa există, vei primi un email cu instrucțiuni pentru resetarea parolei.
          </p>
          <Link href="/login">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la autentificare
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Ai uitat parola?</h1>
            <p className="text-zinc-400 text-sm">
              Introdu emailul și îți trimitem instrucțiuni de resetare.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 mb-5">
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500"
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-11"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Trimite instrucțiuni"
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center mt-5">
            <Link
              href="/login"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Înapoi la autentificare
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
