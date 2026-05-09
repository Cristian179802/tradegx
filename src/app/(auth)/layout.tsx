import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Autentificare — TradeGX",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex items-center p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 relative flex items-center justify-center shrink-0">
            <Image src="/logo.jpg" alt="TradeGX" width={32} height={32} className="object-contain" style={{ mixBlendMode: "screen" }} />
          </div>
          <span className="font-bold text-white tracking-tight">
            Trade<span className="text-emerald-400">GX</span>
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-zinc-600 text-xs">
          &copy; {new Date().getFullYear()} TradeGX. Toate drepturile rezervate.
        </p>
      </div>
    </div>
  );
}
