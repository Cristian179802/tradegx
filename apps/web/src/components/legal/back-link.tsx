"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft } from "lucide-react";

/**
 * „Înapoi" din paginile publice — dar înapoi UNDE.
 *
 * Roadmap-ul, termenii și celelalte pagini de acest fel trăiesc în afara
 * aplicației. Linkul de întoarcere ducea mereu la pagina publică de start, unde
 * scrie „Autentificare" și „Dashboard". Pentru un utilizator conectat, care
 * tocmai venise din aplicație, asta arăta ca o deconectare — deși sesiunea era
 * intactă tot timpul.
 *
 * Acum întoarcerea duce de unde ai venit: dacă ești conectat, în aplicație; dacă
 * nu, pe site. Un buton „înapoi" care te duce în altă parte decât de unde ai
 * plecat nu e un buton înapoi.
 *
 * Componentă de client, ca paginile să rămână generate static: se rezolvă după
 * hidratare. Până atunci arată varianta publică, ceea ce e și starea corectă
 * pentru vizitatorul nelogat, adică pentru majoritatea traficului de aici.
 */
export function BackLink({
  toSite,
  toApp,
}: {
  toSite: string;
  toApp: string;
}) {
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <Link
      href={authed ? "/dashboard" : "/"}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300
                 transition-colors font-medium"
    >
      <ChevronLeft className="w-3.5 h-3.5" />
      {authed ? toApp : toSite}
    </Link>
  );
}
