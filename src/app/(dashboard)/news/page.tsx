import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ForexNews } from "@/components/dashboard/forex-news";

export const metadata: Metadata = { title: "Știri de Piață" };

export default async function NewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Știri de Piață</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Cele mai recente știri financiare, clasificate după impact. Reîmprospătare automată la 5 minute.
        </p>
      </div>
      <ForexNews className="max-w-3xl" />
    </div>
  );
}
