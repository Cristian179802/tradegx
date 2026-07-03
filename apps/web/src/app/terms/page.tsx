import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Termeni și Condiții — TradeGx",
  description: "Termenii și condițiile de utilizare a platformei TradeGx.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termeni și Condiții" updated="3 iulie 2026">
      <LegalSection title="1. Despre serviciu">
        <p>
          TradeGx (www.tradegx.com) este o platformă software de tip SaaS pentru jurnalizarea,
          analiza și îmbunătățirea activității de tranzacționare (trade journal). Platforma oferă
          instrumente de evidență a tranzacțiilor, statistici de performanță, materiale educaționale,
          instrumente de gestionare a riscului și funcții asistate de inteligență artificială.
        </p>
        <p>
          <strong className="text-zinc-300">TradeGx NU este broker, dealer, bancă sau firmă de investiții.</strong>{" "}
          Platforma nu execută tranzacții, nu deține și nu administrează fondurile utilizatorilor și nu
          intermediază accesul la piețe financiare.
        </p>
      </LegalSection>

      <LegalSection title="2. Fără consultanță financiară">
        <p>
          Tot conținutul platformei — inclusiv semnalele generate de AI, statisticile, rapoartele,
          materialele din Academie și răspunsurile asistentului AI — are exclusiv scop informativ și
          educațional. Nimic din TradeGx nu constituie consultanță financiară, de investiții, juridică
          sau fiscală și nu reprezintă o recomandare de a cumpăra sau vinde vreun instrument financiar.
        </p>
        <p>
          Deciziile de tranzacționare îți aparțin în totalitate. Tranzacționarea instrumentelor
          financiare implică un risc semnificativ de pierdere a capitalului.
        </p>
      </LegalSection>

      <LegalSection title="3. Contul de utilizator">
        <p>
          Pentru utilizarea platformei este necesar un cont. Ești responsabil pentru păstrarea
          confidențialității datelor de autentificare și pentru toată activitatea desfășurată în contul
          tău. Trebuie să ai cel puțin 18 ani pentru a folosi TradeGx.
        </p>
        <p>
          Conectarea la conturile de broker (MT4/MT5) se realizează exclusiv prin parola de investitor
          (read-only) sau prin mecanisme echivalente de acces în citire. Nu îți vom cere niciodată
          parola principală de tranzacționare.
        </p>
      </LegalSection>

      <LegalSection title="4. Abonamente și perioada de probă">
        <p>
          Anumite funcții sunt disponibile contra unui abonament, conform ofertei afișate pe pagina de
          prețuri. Perioada de probă gratuită (dacă este oferită) nu necesită card de credit și nu se
          convertește automat într-un abonament plătit fără acordul tău explicit.
        </p>
        <p>
          Plățile sunt procesate prin furnizori terți specializați. Poți anula abonamentul oricând din
          setările contului; anularea produce efecte la finalul perioadei de facturare curente.
        </p>
      </LegalSection>

      <LegalSection title="5. Utilizare acceptabilă">
        <p>Este interzis să folosești platforma pentru:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>activități ilegale sau frauduloase;</li>
          <li>încercări de acces neautorizat la sistemele TradeGx sau la conturile altor utilizatori;</li>
          <li>copierea, revânzarea sau redistribuirea conținutului platformei fără acord scris;</li>
          <li>încărcarea de conținut care încalcă drepturile terților.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Proprietate intelectuală">
        <p>
          Platforma, codul, designul, marca TradeGx și materialele educaționale sunt protejate de
          legislația privind proprietatea intelectuală. Datele pe care le introduci (tranzacții, note,
          capturi de ecran) rămân ale tale; ne acorzi doar licența tehnică necesară stocării și
          afișării lor în cadrul serviciului.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitarea răspunderii">
        <p>
          Serviciul este furnizat „așa cum este”. În limitele maxime permise de lege, TradeGx nu
          răspunde pentru pierderi financiare rezultate din deciziile tale de tranzacționare, pentru
          acuratețea datelor furnizate de terți (cotații, calendar economic, știri) sau pentru
          întreruperi temporare ale serviciului. Sincronizarea cu brokerii depinde de servicii terțe și
          poate suferi întârzieri.
        </p>
      </LegalSection>

      <LegalSection title="8. Încetarea">
        <p>
          Îți poți șterge contul oricând din setări. Ne rezervăm dreptul de a suspenda conturile care
          încalcă acești termeni, cu notificare prealabilă acolo unde este rezonabil posibil.
        </p>
      </LegalSection>

      <LegalSection title="9. Modificări și legea aplicabilă">
        <p>
          Putem actualiza acești termeni; modificările semnificative vor fi anunțate în aplicație.
          Continuarea utilizării după intrarea în vigoare a modificărilor înseamnă acceptarea lor.
          Acești termeni sunt guvernați de legea română și de reglementările UE aplicabile.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Pentru orice întrebare legată de acești termeni: <a href="mailto:palcristi1@gmail.com" className="text-indigo-400 hover:text-indigo-300">palcristi1@gmail.com</a>{" "}
          sau pagina de <a href="/contact" className="text-indigo-400 hover:text-indigo-300">contact</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
