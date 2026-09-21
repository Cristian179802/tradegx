# TradeGx Mobile

Aplicație nativă Android + iOS, parte din monorepo. Consumă **exact aceleași
API-uri** ca web-ul, prin `@tradegx/api-client`. Matematica de risc vine din
`@tradegx/core`, iar culorile din `@tradegx/ui-tokens` — adică aceleași cifre
ca `globals.css`.

## De ce nativ și nu un WebView

Prima variantă a acestui folder era un `WebView` care încărca tradegx.com.
Google Play respinge asta prin politica **Minimum Functionality**: „aplicații
care nu oferă funcționalitate dincolo de un site împachetat". Nu e o preferință
de design, e o condiție de publicare.

## Rulare locală

```bash
# de la rădăcina monorepo-ului
npm install
npm --workspace mobile run start
```

Apoi scanează codul QR cu **Expo Go**. Notificările push NU merg în Expo Go pe
Android — au nevoie de un development build (`eas build --profile development`).

## Ce conține

Treizeci și una de opțiuni de meniu, toate native. Nimic din meniu nu mai
scoate omul din aplicație.

Singurele lucruri care mai deschid browserul: **paginile legale**
(Confidențialitate, Termeni, Contact — Google Play cere link către politica de
confidențialitate) și **fereastra de plată**, care e un Custom Tab PESTE
aplicație, nu Chrome: la închidere ești exact unde erai.

⚠️ Plata stă izolată în `src/lib/plata.ts`. Google cere Play Billing pentru
abonamente digitale; Stripe într-un Custom Tab e „anti-steering". Trecerea
schimbă DOAR funcția `cumpara()`.

```
app/
  _layout.tsx            poarta de autentificare + bara de jos, peste toată stiva
  login.tsx              email + parolă, 2FA apare doar când serverul îl cere
  inregistrare.tsx       cont nou; regulile parolei se bifează în timp ce scrii
  parola-uitata.tsx      linkul de resetare, pe email
  (tabs)/                cele patru ecrane deschise des — își păstrează starea
    index.tsx            acasă: sold, ziua, performanță, ultimele tranzacții
    tranzactii.tsx       lista, cu filtre: toate / deschise / închise
    adauga.tsx           formular + calculator de lot, în același ecran
    setari.tsx           contul, notificările, ieșirea
  tranzactie/[id].tsx    detaliul unei tranzacții, cu capturi de ecran
  editare/[id].tsx       corectarea unei tranzacții; ieșirea completată o închide

  jurnal/                lista de notat + editorul unei note (înainte / după)
  checklist.tsx          singurul ecran fără server: se bifează în 30 de secunde
  conturi.tsx            alege contul pe care îl privește tot restul aplicației
  rapoarte.tsx           performanță + fiscal, PDF făcut pe telefon
  import-export.tsx      CSV / raport de broker în, CSV afară

  analitice.tsx          curba, lunile, zilele, orele, setup-urile, instrumentele
  edge.tsx               unde ai avantaj și unde pierzi (PRO)
  monte-carlo.tsx        mii de vieți alternative ale contului (PRO)
  backtesting/           strategiile salvate: rulare + rezultat
  institutional.tsx      Sharpe, Sortino, Calmar, CAGR (PRO)
  risc.tsx               mai am voie azi? limitele contului, regulile tale
  calculator.tsx         câte loturi, ca să risc exact cât am zis
  obiective.tsx          trei ținte lunare, cu progresul lor
  prop-firm.tsx          ținta și cele DOUĂ limite ale challenge-ului

  semnale.tsx            ideile zilei, cu invalidarea scrisă (PRO)
  asistent.tsx           chat pe statisticile contului tău
  alerte.tsx             ce a observat sistemul fără să-l întrebi
  watchlist.tsx          simbolurile tale și pragurile de preț
  grafice.tsx            lumânări native, cu tranzacțiile tale peste ele
  piata.tsx              pulsul contului + sesiuni + cotații
  calendar.tsx           evenimente grupate pe zile, în ora telefonului
  stiri.tsx              titluri filtrate după impact
  unelte.tsx             puterea valutelor, riscul de ruină, corelații

  academia/              nouă module, lecții, quiz-uri, glosar
  realizari.tsx          seria și obiceiurile măsurate
  comunitate.tsx         postări + echipe
  postare/[id].tsx       firul unei postări, cu comentarii
  abonament.tsx          planuri, comparație completă, plată
  roadmap.tsx            ce s-a livrat și ce urmează
  profil.tsx             toate setările: profil, notificări, 2FA, date

src/
  lib/auth.tsx           token-uri în expo-secure-store, reîmprospătare
  lib/api.ts             clientul comun, cu bază absolută și Bearer
  lib/asistent.ts        chatul — răspunsul e text, nu JSON, deci nu trece prin client
  lib/academia.ts        conținutul cursului, cache local + îmbinarea progresului
  lib/plata.ts           SINGURUL loc prin care trec banii
  lib/foaie.ts           PDF-urile, făcute pe telefon din HTML
  lib/fisiere.ts         poze și fișiere, prin foile de sistem
  lib/meniu.ts           domeniile din bară și ce e nativ
  lib/useCerere.ts       încarcă / reîmprospătează / eroare / status HTTP
  lib/notificari.ts      permisiune cerută DUPĂ autentificare
  lib/format.ts          bani, procente, date — un singur loc
  theme.ts               tokenii + ce e specific nativului (umbre, atingere)
  ui/Ecran.tsx           carcasa oricărui ecran: antet, tragere, eroare, schelet
  ui/grafice.tsx         curbă, bare, con, histogramă, diagrame de lecție
  ui/GraficInteractiv.tsx lumânări cu zoom, pan și unelte de desen
  ui/parti.tsx           pastile, stare goală, bară de progres, statistici
  ui/TextLectie.tsx      mini-markdown-ul lecțiilor, cu termeni de glosar
  ui/                    Card, Buton, Camp, RollingNumber, Sparkline, Reveal, Schelet
```

### Rute API care există pentru aplicație

Patru pagini web erau componente de server: interogau direct baza și nu
treceau prin niciun API, deci aplicația n-avea cum să ajungă la ele. Fiecare
are acum o rută care întoarce EXACT aceleași date:

| Rută | Pentru |
|---|---|
| `/api/journal` | Jurnal detaliat |
| `/api/risk-manager` | Manager de risc |
| `/api/institutional` | Vedere instituțională |
| `/api/academy/content` | Lecțiile, diagramele, quiz-urile, glosarul |
| `/api/report` | Raportul de performanță |
| `/api/tax-report` | Raportul fiscal |
| `/api/pricing` | Planurile și comparația (PUBLICĂ) |
| `/api/roadmap` | Ce s-a livrat și ce urmează (PUBLICĂ) |

Conținutul Academiei se descarcă o dată și se ține în `AsyncStorage`. Un pachet
partajat ar fi mers offline din prima, dar fiecare lecție nouă ar fi cerut o
versiune nouă în magazin; așa, o lecție scrisă azi ajunge azi pe telefon.

## Decizii care par mici și nu sunt

- **Fără Reanimated.** Versiunea 4 cere New Architecture, iar aplicația o are
  oprită (`newArchEnabled: false`) — ar fi fost un build stricat. `Animated` din
  React Native acoperă tot ce ne trebuie, cu driver nativ și zero module native
  în plus.
- **Token-urile în `expo-secure-store`**, nu `AsyncStorage`. Acolo ar fi text
  simplu, citibil pe un telefon cu root.
- **O singură reîmprospătare în zbor.** Cinci cereri care iau 401 deodată
  așteaptă aceeași promisiune; altfel rotația le invalidează pe rând.
- **Fără rețea ≠ deconectare.** Tokenul vechi poate fi încă valid.
- **Permisiunea de notificări se cere după login.** Pe Android, două refuzuri
  închid canalul permanent.
- **Ținta minimă de atingere: 48.** Maximul dintre pragul Apple (44) și
  Material (48).

## Publicare pe Google Play

### Ce trebuie o singură dată

1. **Cont Google Play Console** — 25 $, plată unică.
2. **Cont Expo / EAS** — proiectul există deja
   (`f8920b01-76c7-475e-a14e-f8292220fa00`, owner `cristianpp`).
   Dacă `eas` cere autentificare: `npx eas login`.

### Build

```bash
cd apps/mobile
npx eas build --platform android --profile production
```

`eas.json` produce deja **app-bundle** (`.aab`), formatul cerut de Play, cu
`autoIncrement` pe versionCode — deci nu trebuie ținut minte numărul.

### Ce cere Play la prima publicare

| Cerință | Unde e / ce se pune |
|---|---|
| Politică de confidențialitate | `https://www.tradegx.com/privacy` — există |
| Termeni | `https://www.tradegx.com/terms` — există |
| Iconiță 512×512 | din `assets/icon.png` |
| Feature graphic 1024×500 | assets/play-feature-graphic.png — gata |
| Capturi de ecran (min. 2, telefon) | **lipsesc** — se fac după primul build |
| Data safety | vezi mai jos |
| Clasificare de conținut | chestionar, aplicație financiară fără conținut sensibil |

### Data safety — ce se declară

Aplicația colectează și **transmite** către serverul propriu:

- **Email și nume** — pentru autentificare. Criptat în tranzit. Se poate șterge
  ștergând contul.
- **Date financiare introduse de utilizator** (tranzacții, solduri) — funcția
  principală a aplicației. Criptat în tranzit.
- **Identificator de dispozitiv** (token de notificări) — doar pentru alerte.

NU colectează: locație, contacte, fotografii, microfon, cameră, publicitate.
Permisiunile astea sunt blocate explicit în `app.json` (`blockedPermissions`),
ca să nu intre prin vreo dependință.

### Înainte de primul build

- [ ] `npx eas login` (tokenul actual e expirat)
- [ ] Capturi de ecran de pe un telefon real
- [ ] Verificat că `NEXTAUTH_SECRET` există pe Vercel — fără el, login-ul
      mobil cade cu 500 (vezi `lib/mobile-auth.ts`, aruncă deliberat)
