import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Politica de Confidențialitate — TradeGx",
  description: "Cum colectează, folosește și protejează TradeGx datele tale (GDPR).",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Politica de Confidențialitate" updated="3 iulie 2026">
      <LegalSection title="1. Cine suntem">
        <p>
          Această politică explică modul în care platforma TradeGx (www.tradegx.com) colectează,
          utilizează și protejează datele cu caracter personal, în conformitate cu Regulamentul (UE)
          2016/679 (GDPR). Operatorul datelor este operatorul platformei TradeGx; ne poți contacta la{" "}
          <a href="mailto:palcristi1@gmail.com" className="text-indigo-400 hover:text-indigo-300">palcristi1@gmail.com</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Ce date colectăm">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-zinc-300">Date de cont:</strong> nume, adresă de email, parolă (stocată exclusiv criptat/hash).</li>
          <li><strong className="text-zinc-300">Date de tranzacționare:</strong> tranzacțiile introduse manual, importate sau sincronizate de la broker (simbol, prețuri, volume, profit/pierdere), notele de jurnal, capturile de ecran încărcate.</li>
          <li><strong className="text-zinc-300">Date de conectare broker:</strong> pentru sincronizare folosim exclusiv acces de tip read-only (parolă de investitor); credențialele necesare integrărilor sunt stocate criptat.</li>
          <li><strong className="text-zinc-300">Date tehnice:</strong> jurnale de server minimale necesare securității și funcționării (adresă IP, tip browser).</li>
        </ul>
        <p>Nu colectăm mai multe date decât sunt necesare funcționării serviciului (principiul minimizării).</p>
      </LegalSection>

      <LegalSection title="3. În ce scopuri folosim datele">
        <ul className="list-disc pl-5 space-y-1">
          <li>furnizarea serviciului (jurnal, statistici, alerte, rapoarte) — temei: executarea contractului;</li>
          <li>funcțiile AI (analiză, semnale, coach) — datele statistice relevante sunt transmise punctual furnizorului de AI pentru generarea răspunsului — temei: executarea contractului;</li>
          <li>notificări pe care le activezi tu (Telegram, push, email) — temei: consimțământ;</li>
          <li>securitate și prevenirea abuzurilor — temei: interes legitim.</li>
        </ul>
        <p><strong className="text-zinc-300">Nu vindem și nu închiriem datele tale nimănui.</strong></p>
      </LegalSection>

      <LegalSection title="4. Unde sunt stocate datele">
        <p>
          Baza de date este găzduită în Uniunea Europeană (regiunea Frankfurt, Germania). Aplicația
          rulează pe infrastructură cloud cu criptare în tranzit (HTTPS/TLS) și criptare la stocare.
        </p>
      </LegalSection>

      <LegalSection title="5. Împuterniciți (subprocesatori)">
        <p>Folosim un număr limitat de furnizori pentru funcționarea serviciului:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-zinc-300">Vercel</strong> — găzduirea aplicației;</li>
          <li><strong className="text-zinc-300">Neon</strong> — baza de date (UE, Frankfurt);</li>
          <li><strong className="text-zinc-300">Anthropic</strong> — funcțiile de inteligență artificială;</li>
          <li><strong className="text-zinc-300">Telegram</strong> — doar dacă activezi notificările Telegram;</li>
          <li><strong className="text-zinc-300">MetaApi</strong> — doar dacă activezi sincronizarea cloud cu brokerul;</li>
          <li><strong className="text-zinc-300">Cloudinary</strong> — stocarea capturilor de ecran încărcate.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cât timp păstrăm datele">
        <p>
          Datele contului sunt păstrate cât timp contul este activ. La ștergerea contului, datele
          personale sunt șterse sau anonimizate într-un termen rezonabil, cu excepția situațiilor în
          care legea impune păstrarea lor.
        </p>
      </LegalSection>

      <LegalSection title="7. Drepturile tale (GDPR)">
        <p>Ai dreptul de acces, rectificare, ștergere („dreptul de a fi uitat”), restricționare,
          portabilitate și opoziție, precum și dreptul de a-ți retrage consimțământul oricând.
          Pentru exercitarea lor, scrie-ne la{" "}
          <a href="mailto:palcristi1@gmail.com" className="text-indigo-400 hover:text-indigo-300">palcristi1@gmail.com</a>.
          Ai de asemenea dreptul de a depune o plângere la ANSPDCP (www.dataprotection.ro).
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          TradeGx folosește doar cookies strict necesare funcționării: cookie-ul de sesiune pentru
          autentificare. Nu folosim cookies de publicitate sau de urmărire terță. Preferințele de
          interfață (temă, limbă, progres Academie) sunt stocate local în browserul tău
          (localStorage) și nu părăsesc dispozitivul.
        </p>
      </LegalSection>

      <LegalSection title="9. Modificări">
        <p>
          Vom anunța în aplicație orice modificare semnificativă a acestei politici înainte ca ea să
          intre în vigoare.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
