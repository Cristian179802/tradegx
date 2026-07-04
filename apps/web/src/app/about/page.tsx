import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Despre TradeGx — cine suntem și de ce construim asta",
  description:
    "Povestea TradeGx: un jurnal de trading construit în public, de un trader român, pentru traderii SMC/ICT.",
};

export default function AboutPage() {
  return (
    <LegalPage title="Despre TradeGx">
      <LegalSection title="De ce există TradeGx">
        <p>
          TradeGx a pornit dintr-o frustrare simplă: jurnalele de trading existente sunt fie
          scumpe și generice, fie tabele Excel care mor după două săptămâni. Niciunul nu vorbea
          limba traderilor moderni — Smart Money Concepts, ICT, killzones, order blocks — și
          niciunul nu îți spunea lucrul care contează cu adevărat:{" "}
          <strong className="text-zinc-300">unde anume câștigi și unde pierzi bani, statistic</strong>.
        </p>
        <p>
          Așa că l-am construit noi. Un jurnal care etichetează setup-urile așa cum le gândești,
          se sincronizează singur cu brokerul, îți detectează revenge trading-ul înainte să-ți
          ardă contul și îți arată edge-ul real din date — nu din impresii.
        </p>
      </LegalSection>

      <LegalSection title="Cine construiește">
        <p>
          TradeGx este fondat și dezvoltat în România de <strong className="text-zinc-300">Cristian</strong> —
          trader și builder — împreună cu instrumente moderne de dezvoltare asistată de AI.
          Nu suntem o corporație: suntem un produs mic, rapid și obsedat de calitate, în care
          fiecare sugestie de la utilizatori ajunge direct la persoana care scrie codul.
        </p>
        <p>
          Nu venim să-ți vindem vise de îmbogățire. Venim din aceeași piață în care tranzacționezi
          și tu — cu aceleași stop loss-uri luate, aceleași lecții plătite scump. Exact de aceea
          platforma pune risk management-ul și disciplina înaintea oricărui „semnal magic”.
        </p>
      </LegalSection>

      <LegalSection title="Construit în public">
        <p>
          TradeGx se dezvoltă transparent: actualizări livrate constant, un{" "}
          <a href="/roadmap" className="text-indigo-400 hover:text-indigo-300">roadmap public</a>{" "}
          cu ce urmează, și zero testimoniale inventate pe site. Ce vezi în{" "}
          <a href="/#preturi" className="text-indigo-400 hover:text-indigo-300">pagina de prețuri</a>{" "}
          este exact ce primești — verificabil în cele 14 zile de probă, fără card.
        </p>
      </LegalSection>

      <LegalSection title="Principiile noastre">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-zinc-300">Datele tale sunt ale tale.</strong> Găzduire în UE,
            acces la broker doar read-only, zero vânzare de date.
          </li>
          <li>
            <strong className="text-zinc-300">Educație înainte de vânzare.</strong> Academia completă
            (41 de lecții) este gratuită pentru oricine, pentru totdeauna.
          </li>
          <li>
            <strong className="text-zinc-300">Onestitate statistică.</strong> Nu promitem profituri.
            Tradingul implică risc real, iar noi îți dăm instrumente ca să-l gestionezi — nu garanții.
          </li>
          <li>
            <strong className="text-zinc-300">Feedback cu putere de lege.</strong> Funcțiile se
            construiesc din cererile utilizatorilor reali, nu din prezentări de marketing.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Vorbește cu noi">
        <p>
          Orice întrebare, sugestie sau problemă:{" "}
          <a href="/contact" className="text-indigo-400 hover:text-indigo-300">pagina de contact</a>{" "}
          — răspundem de regulă în aceeași zi.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
