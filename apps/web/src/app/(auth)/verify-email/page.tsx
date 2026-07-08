"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => {
        if (res.redirected && res.url.includes("verified=true")) {
          setStatus("success");
          setTimeout(() => router.push("/login?verified=true"), 2000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token, router]);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t("verifyingTitle")}</h2>
          <p className="text-zinc-400 text-sm">{t("verifyingDesc")}</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t("emailVerified")}</h2>
          <p className="text-zinc-400 text-sm mb-4">
            {t("accountActive")}
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t("linkInvalid")}</h2>
          <p className="text-zinc-400 text-sm mb-6">
            {t("linkExpired")}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                {t("registerLink")}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                {t("signIn")}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
