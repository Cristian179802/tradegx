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

```
app/
  _layout.tsx          poarta de autentificare — UN SINGUR loc care decide
  login.tsx            email + parolă, 2FA apare doar când serverul îl cere
  (tabs)/
    index.tsx          acasă: sold, ziua, performanță, ultimele tranzacții
    tranzactii.tsx     lista, cu filtre: toate / deschise / închise
    adauga.tsx         formular + calculator de lot, în același ecran
    setari.tsx         ce are sens pe telefon; restul deschide web-ul
  tranzactie/[id].tsx  detaliul unei tranzacții
src/
  lib/auth.tsx         token-uri în expo-secure-store, reîmprospătare
  lib/api.ts           clientul comun, cu bază absolută și Bearer
  lib/useCerere.ts     încarcă / reîmprospătează / eroare, o singură dată
  lib/notificari.ts    permisiune cerută DUPĂ autentificare
  lib/format.ts        bani, procente, date — un singur loc
  theme.ts             tokenii + ce e specific nativului (umbre, atingere)
  ui/                  Card, Buton, Camp, RollingNumber, Sparkline, Reveal, Schelet
```

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
| Feature graphic 1024×500 |  — gata |
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
