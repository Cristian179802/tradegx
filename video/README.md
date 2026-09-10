# Studioul de captură

Un browser real, pe un ecran virtual, filmat cu ffmpeg. Implementează secțiunea 5
din `docs/VIDEO_SPEC.md`, cu constrângerile din `docs/FAZA_3.md`.

## Rulare

```bash
cd video
npm run studio          # build + run, scoate out/raw.mkv
```

Sau pe bucăți:

```bash
npm run studio:build
npm run studio:run
```

Cere **Docker**. Nu rulează pe Windows fără Docker Desktop sau WSL2.

Reglaje prin variabile de mediu (`docker run -e ...`):

| variabilă | implicit | ce face |
|---|---|---|
| `APP_URL` | `https://www.tradegx.com` | ce instanță se filmează |
| `CAPTURE_TZ` | `Europe/Bucharest` | fusul din care se văd orele de sesiune |
| `CAPTURE_LOCALE` | `ro-RO` | limba și formatul de dată |
| `CAPTURE_FPS` | `60` | cadre pe secundă |
| `CAPTURE_WIDTH` / `_HEIGHT` | `1920` / `1080` | ecranul Xvfb ȘI cadrul ffmpeg |

## Ce verifică singur, înainte să filmeze

Cele cinci constrângeri strică filmul **tăcut** — nu dau eroare, le descoperi la
montaj. Deci scriptul le întreabă pe browserul care chiar filmează și se oprește
înainte de prima secundă dacă ceva critic nu răspunde cum trebuie:

| verificare | de ce | critic |
|---|---|---|
| `prefers-reduced-motion` = `no-preference` | altfel cifrele **sar** în loc să se rostogolească, iar animația aia e cadrul de la secunda 17 | **da** |
| fonturile de brand chiar aplicate | `document.fonts.check` întoarce `true` și pentru un înlocuitor; măsurăm lățimea textului față de un font inexistent | nu |
| fus orar și limbă | un container pe UTC arată alte ore de sesiune — iar orele sunt subiectul | nu |
| scrollbar ascuns | o bară în cadru arată amatoricesc | nu |
| ce randează | în Xvfb nu există GPU; util de știut dacă animația sacadează | nu |

## Două lucruri care contrazic specul, deliberat

### Fonturile de brand NU se instalează în imagine

`VIDEO_SPEC` §5 și `FAZA_3` cer instalarea fontului din design system. Nu e
nevoie: aplicația folosește `next/font/google`, care descarcă Inter și Space
Grotesk **la build** și le servește de pe propriul domeniu. Browserul le ia de la
aplicație, nu din sistem — instalate în imagine, ar fi copii moarte.

Ce lipsește cu adevărat într-un container gol sunt fonturile de **rezervă** și
cele cu **simboluri**: fără ele, `×` din „Setup × Sesiune", `·`, `→` și
diacriticele românești apar ca dreptunghiuri. Alea se instalează, plus
`fontconfig`.

### `deviceScaleFactor` e 1, nu 2

`VIDEO_SPEC` §4 cere `deviceScaleFactor: 2`, iar §5 cere ecran și captură la
1920×1080. Cele două nu pot fi adevărate deodată: la scale factor 2, o fereastră
de 1920 pixeli CSS are nevoie de 3840 pixeli fizici, care nu încap pe un ecran de
1920.

Implicit rulăm 1920×1080 la scale 1 — exact comanda ffmpeg din §5, adică
nativ 1080p.

Pentru text mai fin există calea de supraeșantionare: ecran și captură la
3840×2160 cu `deviceScaleFactor: 2`, apoi redimensionare la 1080p în montaj.
Iese vizibil mai curat, dar înseamnă de patru ori mai mulți pixeli la 60fps sub
randare software — exact riscul de sacadare despre care avertizează `FAZA_3` §5.
De încercat abia după ce varianta sigură se dovedește fluidă:

```bash
docker run --rm --shm-size=1g \
  -e CAPTURE_WIDTH=3840 -e CAPTURE_HEIGHT=2160 \
  -v "$PWD/out:/studio/out" tradegx-studio
```

(`deviceScaleFactor` se schimbă în `capture/run.ts`, unde e comentat de ce.)

## De ce `video/` nu e workspace npm

A fost, în faza de setup. L-am scos când a primit dependința de Playwright:
`npm install` la rădăcină instalează dependințele tuturor workspace-urilor, iar
Vercel rulează exact asta la fiecare deploy — site-ul ar fi început să descarce
Playwright și browserele lui ca să construiască o pagină de Next.

Deci `video/` are propriul `node_modules`, instalat doar înăuntrul containerului.

## Fișiere

```
Dockerfile          chromium + Xvfb + ffmpeg + fonturi
entrypoint.sh       pornește ecranul și atât — sincronizarea NU e aici
capture/run.ts      orchestratorul: browser, verificări, filmare, oprire curată
capture/env.ts      cele cinci verificări de mediu
capture/recorder.ts ffmpeg pe x11grab, pornit și oprit din TypeScript
out/raw.mkv         rezultatul (ignorat de git)
```

Sincronizarea dintre pagină și ffmpeg stă în `run.ts`, nu în shell: „pagina e
gata" e ceva ce doar browserul știe. În shell s-ar ghici cu un `sleep`, iar un
`sleep` ghicit fie taie începutul, fie lasă trei secunde de pagină goală în cap.
