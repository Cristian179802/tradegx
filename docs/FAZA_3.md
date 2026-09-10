# FAZA 3 — Mediul de captură

> **Pentru Claude Code:** execută doar ce e în acest fișier. Implementează
> secțiunea 5 din `docs/VIDEO_SPEC.md`, cu constrângerile de mai jos.
> Nu trece la faza 4. Oprește-te la final și raportează.

---

## Constrângeri de mediu — obligatorii

Astea nu sunt detalii. Fiecare dintre ele strică videoul dacă e greșită, și se
descoperă abia după ce ai filmat.

### 1. Reduced motion — DEZACTIVAT explicit

Componenta de analytics respectă `prefers-reduced-motion: reduce`. Dacă mediul
de captură cere reduced motion, **numerele sar** în loc să se anime — și fix
animația de recalculare e money shot-ul de la secunda 17.

- setează explicit `reducedMotion: 'no-preference'` în contextul Playwright
- **nu** pasa `--force-prefers-reduced-motion` la Chromium
- verifică în container că `matchMedia('(prefers-reduced-motion: reduce)').matches`
  întoarce `false`

### 2. Fonturi

Chromium în Docker fără fonturi instalate randează fallback-uri sau pătrate.
Instalează fontul din design system-ul TradeGX în imagine, plus fontconfig.
Verifică vizual într-un screenshot, nu presupune.

### 3. Timezone și locale

Containerul pe UTC față de aplicație poate afișa alte ore de sesiune și alt
format de dată. Setează explicit timezone-ul și locale-ul în context, aceleași
cu cele pe care le vezi tu în browser.

### 4. Scrollbar

`--hide-scrollbars` la Chromium. Un scrollbar vizibil în cadru arată amatoricesc.

### 5. Randare software

În Xvfb nu ai GPU. Animațiile pot să sacadeze la 60fps sub randare software.
Verifică în `raw.mkv` că tranziția de numere e fluidă. Dacă sacadează,
configurează SwiftShader și re-testează.

---

## Ce implementezi

- Dockerfile: chromium, Xvfb, ffmpeg, Playwright, fonturi
- Xvfb `:99` la 1920x1080x24
- Playwright headed pe `DISPLAY=:99`, viewport 1920x1080, `deviceScaleFactor: 2`
- ffmpeg x11grab, 60fps constant, intermediar lossless (`-qp 0`)
- script de pornire care sincronizează: ffmpeg pornește **după** ce pagina e
  încărcată, se oprește curat la final, fără frame-uri tăiate

## Script de validare

Minimal, cât să confirme mediul:
1. deschide analytics pe contul demo
2. așteaptă `data-chart-ready`
3. aplică filtrul FVG + Asia
4. stă 3 secunde cât se recalculează statistica
5. gata

Ăsta e testul real: dacă animația de recalculare se vede fluidă în `raw.mkv`,
mediul e bun pentru tot restul.

---

## La final

Livrează `raw.mkv` și raportează:
- rezultatul verificării `prefers-reduced-motion`
- dacă fontul e cel corect (screenshot)
- dacă tranziția de numere e fluidă sau sacadează

Apoi oprește-te.
