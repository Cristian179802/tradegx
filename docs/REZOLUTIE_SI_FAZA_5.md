# Rezoluție, apoi Faza 5 — montajul

> **Pentru Claude Code:** două task-uri, în ordine. Nu trece la faza 6 sau 7.

---

## TASK 1 — Verifică rezoluția de captură

Captura a ieșit **1280x720**. Specul cere **1920x1080** cu
`deviceScaleFactor: 2`.

La 720p textul mic din UI e moale, iar faza 5 face zoom până la 1.8× — deci
mărești pixeli deja insuficienți. Orice se construiește peste asta moștenește
problema.

Spune-mi:
1. de ce a ieșit 720p — e setare în `recorder.ts`, în Xvfb, sau downscale?
2. la 1920x1080 cu `nice -10` + `yuv420p`, ce procent din cadre ținem la 30fps?

Dacă 1080p la 30fps trece de ~90%, **repară și refilmează**. Rezoluția bate
framerate-ul: un 30fps curat la 1080p arată mai bine decât 60fps la 85% pe 720p.

Apoi `CAPTURE_NICE=-10` permanent, cum ai recomandat. De acord.

---

## TASK 2 — Faza 5, montajul

Secțiunea 6 din `docs/VIDEO_SPEC.md`. `video/compose.ts` citește
`keyframes.json` și generează filter graph-ul ffmpeg:

1. **Auto-zoom** pe fiecare click — `scale` + `crop` cu expresii pe `t`,
   400ms in / 400ms out cu easing. NU `zoompan`.
   Folosește markerul de sincronizare de la `t=0` ca să calibrezi offsetul
   frame-accurate față de primul cadru din raw.
2. **Tăieturi** — elimină cele 37s de timp mort marcate `dead`.
   Rezultat: 88s → 45s.
3. **Text overlay** — `drawtext`, fontul din design system, fade 250ms.
   Textele din secțiunea 1 a specului.
4. **Muzică** — lasă calea configurabilă și pune un placeholder tăcut
   deocamdată. Track-ul licențiat îl adaug eu.
5. **Grade final** — contrast + saturație, subtil.

Output: `video/out/hero-16x9.mp4`, H.264, 1080p.

Markerul de sincronizare se taie, nu apare în livrabil.

---

## La final

Livrează `hero-16x9.mp4` și confirmă:
- durata finală exactă
- că zoom-ul se aliniază cu clickurile (nu sare)
- rezoluția reală a livrabilului

Apoi oprește-te. Bugul `killzone` / `sessionType` rămâne separat.
