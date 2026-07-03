import type { Metadata } from "next";
import { Mail, MessageCircle, ShieldCheck, Clock } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Contact — TradeGx",
  description: "Contactează echipa TradeGx: suport, feedback, raportare probleme de securitate.",
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <p className="text-sm leading-relaxed text-zinc-400 -mt-4">
        TradeGx este un produs nou, dezvoltat activ — fiecare mesaj ajunge direct la fondator.
        Răspundem de regulă în aceeași zi.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:palcristi1@gmail.com"
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 hover:border-indigo-500/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">Email</h2>
          <p className="text-sm text-indigo-400 group-hover:text-indigo-300 font-semibold">
            palcristi1@gmail.com
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Suport, întrebări despre abonamente, feedback, parteneriate.
          </p>
        </a>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">Securitate</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Ai găsit o vulnerabilitate? Scrie-ne cu subiectul{" "}
            <span className="text-zinc-300 font-semibold">[SECURITY]</span> — tratăm raportările
            responsabile cu prioritate maximă. Detalii și în{" "}
            <span className="text-zinc-400 font-mono text-[11px]">/.well-known/security.txt</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <MessageCircle className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">Feedback de produs</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            O funcție lipsă? Un bug? Spune-ne exact ce ai pățit și pe ce dispozitiv — construim
            public, iar sugestiile utilizatorilor intră direct în planul de dezvoltare.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-sm font-black text-zinc-100 mb-1">Timp de răspuns</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            De regulă în aceeași zi, maximum 48 de ore lucrătoare. Cererile GDPR (acces/ștergere
            date) sunt procesate cu prioritate.
          </p>
        </div>
      </div>

      <LegalSection title="Date de identificare">
        <p>
          Platforma TradeGx este operată din România. Detaliile complete despre prelucrarea datelor
          se află în <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">Politica de Confidențialitate</a>,
          iar condițiile de utilizare în <a href="/terms" className="text-indigo-400 hover:text-indigo-300">Termeni și Condiții</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
