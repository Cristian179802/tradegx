# FAZA 4 — Regizorul

> **Pentru Claude Code:** implementează secțiunea 4 din `docs/VIDEO_SPEC.md`,
> cu constrângerile și adăugirile de mai jos. Doar faza asta. Nu trece la
> montaj. Oprește-te la final și raportează.

Cea mai complexă fază din pipeline. Tot ce vine după se construiește peste ea.

---

## 1. Separare motor / date — obligatoriu

Două fișiere distincte:

- `video/engine.ts` — motorul: execuția beat-urilor, cursorul, sincronizarea,
  emiterea de keyframes. **Nu se atinge după faza asta.**
- `video/timeline.ts` — doar datele: array-ul de `Beat`. **Singurul fișier
  editat în faza 6.**

Motivul: faza 6 înseamnă 15+ iterații pe ritm. Dacă ritmul stă în același
fișier cu logica, fiecare tweak riscă să strice motorul.

---

## 2. Cursorul — sincronizare reală/fals

Capcana: dacă animezi doar un div fals și muți mouse-ul real instantaneu,
stările de hover se declanșează **înainte** ca cursorul vizibil să ajungă.
Se vede clar în video și arată rupt.

- mouse-ul real al Playwright se mișcă pe **aceeași traiectorie**, în pași
  (`mouse.move` cu `steps`), sincron cu divul fals
- divul fals: `pointer-events: none`, `z-index` maxim
- easing `cubic-bezier(0.4, 0.0, 0.2, 1)`, micro-overshoot 3–4px, settle
- ripple pe click, 300ms
- durata mișcării scalează cu distanța: un om nu traversează ecranul în 200ms

Pentru `type`: delay per caracter cu variație aleatoare (dar seed-uit),
nu constant. Tastarea la interval fix arată robotic.

---

## 3. Marker de sincronizare — rezolvă offsetul din start

`keyframes.json` trebuie să aibă timestamp-uri raportate la **primul frame din
`raw.mkv`**, nu la pornirea scriptului. Diferența dintre cele două e de ordinul
sutelor de ms și face zoom-ul să sară în faza 5.

Soluție: la `t=0`, regizorul afișează un marker vizual distinct pe tot ecranul
timp de 2 frame-uri (culoare plată, ușor de detectat programatic). `compose.ts`
îl găsește în faza 5 și calibrează offsetul frame-accurate.

Markerul se taie la montaj, nu apare în livrabil.

---

## 4. Moduri de rulare

Trei, toate necesare pentru iterație rapidă:

- **`--dry`** — parcurge timeline-ul fără captură, raportează durata totală și
  durata fiecărui beat. Validezi structura în 5 secunde, nu în 3 minute.
- **`--beat=<id>`** — rulează un singur beat izolat. Esențial la debugging.
- **normal** — rulare completă cu captură.

---

## 5. Timeline-ul — cei 7 beats

Din secțiunea 1 a specului. Detalii care contează:

**Hook (0–3s)** — equity curve în cădere. Poate fi o secțiune existentă filtrată
pe perioada de drawdown, nu ceva construit special.

**Sync (3–9s)** — dacă simularea unei închideri live de trade în MT5 nu e
fezabilă, folosește un trade care intră în listă la refresh. Nu inventa UI
care nu există; spune-mi dacă nu se poate și găsim altă soluție.

**Jurnal (9–17s)** — tagging pe un trade: setup, sesiune, R. Screenshot atașat
dacă funcția există.

**MONEY SHOT (17–28s)** — atenție la ordine:
1. zoom-ul ajunge pe zona de statistici **înainte** de aplicarea filtrului
2. se aplică FVG + London, statistica se animă → hold
3. se schimbă pe FVG + Asia, statistica se animă → hold mai lung

Camera trebuie să fie deja acolo când se schimbă numerele. Dacă zoom-ul
pornește după, ratezi exact cadrul pentru care există tot videoul.

**Context (28–36s)** — equity curve completă, expectancy, risk calculator.

**Scale (36–41s)** — **amână-l.** Mobile app-ul e Expo, nu se filmează în
același pipeline. Lasă un beat gol marcat `TODO_MOBILE` cu durata rezervată.
Se completează separat, în post.

**CTA (41–45s)** — beat static, se face în montaj (faza 5). Aici doar rezervi
durata.

---

## 6. Ce livrezi

- `raw.mkv` complet, cu timeline-ul integral
- `keyframes.json` cu marker de sincronizare și intervale `dead`
- output-ul de la `--dry`, ca să văd distribuția duratelor pe beats

Raportează separat orice beat care nu s-a putut implementa ca în spec, și de ce.
Nu improviza soluții alternative fără să-mi spui.

Apoi oprește-te.
