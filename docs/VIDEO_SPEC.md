# TradeGX — Specificație video marketing (automatizat)

Document de dat direct în Claude Code. Scop: pipeline reproductibil care generează
videoul de marketing la fiecare deploy, fără screen recording manual.

## 0. Principiul care decide totul

Videoul are un singur money shot: cadrul în care valoarea devine incontestabilă.
Restul de 40 de secunde există doar ca să-l pregătească.

Pentru TradeGX, money shot-ul este descoperirea:

Același setup, sesiune diferită, rezultat complet diferit.
FVG · London → 61% WR vs FVG · Asia → 23% WR

Asta nu se vede într-un tur de funcții. Se vede într-un flux narativ. De aceea
structura de mai jos urmărește un singur trade, de la închidere la insight,
și atinge funcțiile ca o consecință naturală, nu ca o listă.

## 1. Structura video — 45s

| Timp | Beat | Ce se vede | Funcție |
|------|------|-----------|---------|
| 0–3s | Hook | Equity curve care cade. Text: „Pierzi. Dar știi exact de ce?" | — |
| 3–9s | Sync | Trade se închide în MT5 → apare singur în TradeGX. Zero input. | MetaAPI |
| 9–17s | Jurnal | Tagging: FVG · London · 2.4R. Screenshot atașat. | Jurnal |
| 17–28s | MONEY SHOT | Filtru pe setup → statistica se recalculează → contrastul London/Asia | Analytics |
| 28–36s | Context | Equity curve completă, expectancy, risk calculator (2s) | Analytics + Risk |
| 36–41s | Scale | Multi-account, flash pe mobile app | Platformă |
| 41–45s | CTA | Domeniu + logo. Logo apare abia acum. | — |

Reguli de cadru:
- Fără voice-over în v1. Text on screen, font-ul din design system-ul TradeGX.
- Trebuie să funcționeze 100% mut.
- Fiecare cadru are mișcare. Static peste 2s = pierdut.
- Logo-ul nu apare înainte de secunda 41.

Hook-ul acoperă ambele audiențe (challenge + live): durerea e comună, nu știi
de ce pierzi. Nu segmenta în v1.

## 2. Seed script — datele demo

scripts/seed-demo-account.ts — seed fix, rezultat identic la fiecare rulare.

Datele demo decid dacă videoul convertește. Publicul e SMC/ICT, miroase fake-ul
instant.

Trade-uri:    87, pe 4 luni
Win rate:     47%
Avg win:      +2.6R
Avg loss:     -1.0R
Expectancy:   ~+0.69R
Equity curve: +34% net, cu 2 drawdown-uri (-12% și -8%)

NU: win rate peste 60%, equity curve liniar, zero drawdown. Toate trei sunt
semnale de fake pentru un trader real.

Setup-uri:   FVG, Order Block, Liquidity Sweep, SMT Divergence, BOS
Sesiuni:     London 45%, New York 40%, Asia 15%
Instrumente: EURUSD, GBPUSD, XAUUSD, US30, NAS100

Insight-ul plantat (obligatoriu în date):
- FVG + London → 61% WR pe ~23 trade-uri
- FVG + Asia → 23% WR pe ~13 trade-uri

Contrastul trebuie să fie real în date, calculat de aplicație, nu hardcodat în
UI. Dacă e hardcodat, se vede la prima demonstrație live.

## 3. Selectori stabili

Adaugă data-testid pe toate elementele atinse de script:

  trade-row-{id}
  setup-filter-fvg
  session-filter-london
  stat-winrate
  equity-chart
  data-chart-ready   (atribut setat după randare completă, nu după fetch)

Chartul trebuie să expună un semnal de „gata randat". Fără el, scriptul
filmează spinnere.

## 4. Director script (Playwright) — video/director.ts

Timeline declarativ. Flow-ul e DATE, nu cod:

type Beat = {
  id: string
  action: 'move' | 'click' | 'type' | 'scroll' | 'hold'
  target?: string
  text?: string
  duration: number
  hold: number
  waitFor?: string
  zoom?: { scale: number, easing: string }
}

Avantaj: schimbi ritmul editând un array. Vei face asta de 15 ori.

Cursor fals (Playwright nu randează cursor vizibil):
- div absolut poziționat, SVG de cursor, z-index maxim
- interpolare cu requestAnimationFrame
- easing cubic-bezier(0.4, 0.0, 0.2, 1) — liniar arată robotic
- micro-overshoot 3-4px la destinație, apoi settle
- ripple pe click, 300ms

Sincronizare:
- page.waitForFunction pe data-chart-ready, nu waitForTimeout
- viewport fix 1920x1080, deviceScaleFactor 2
- seed-uiește orice randomness din UI

Output secundar — keyframes.json (partea cea mai importantă):

{ "t": 8420, "type": "click", "x": 1240, "y": 618, "zoom": 1.8 }

Consumat de ffmpeg pentru zoom automat pe click. Marchează cu "dead"
intervalele de așteptare de rețea.

## 5. Captură — Docker + Xvfb + ffmpeg

NU folosi recordVideo din Playwright: webm VP8, framerate variabil, arată
prost pe text mic de UI.

Xvfb :99 -screen 0 1920x1080x24 &
# playwright headed pe DISPLAY=:99
ffmpeg -f x11grab -framerate 60 -video_size 1920x1080 -i :99 \
       -c:v libx264 -preset ultrafast -qp 0 raw.mkv

Intermediar lossless. Encodarea finală în post, nu la captură.

## 6. Post-procesare — video/compose.ts

Citește keyframes.json, generează filter graph ffmpeg:

1. Auto-zoom pe fiecare click: scale + crop cu expresii pe t, 400ms in/out,
   cu easing. NU zoompan, e imprecis.
2. Taie automat intervalele "dead".
3. Text overlay cu drawtext, fontul din design system, fade 250ms.
4. Muzică: duck sub overlay-uri, fade out ultimele 2s. Cale configurabilă.
5. Grade final ușor: contrast + saturație, subtil.

Output: video/out/hero-16x9.mp4, H.264, 1080p.

## 7. Livrabile — dintr-o singură rulare

1. 16:9 MP4, 45s — buton „Watch demo"
2. 16:9 webm mut autoplay, 15s loop — hero pe landing
3. 9:16 MP4, 15s — Reels/Shorts/TikTok, hook mai agresiv
4. 4× webm loops de 5s — secțiunile de features
5. Frame-uri PNG — poster, OG image, App Store

Variantele 2-5 se derivă din același raw prin crop + trim. Zero re-înregistrare.

## 8. Ordinea de execuție

1. Seed script + verificare vizuală a datelor (totul depinde de ele)
2. data-testid + semnal chart-ready
3. Docker capture — validare cu un beat simplu
4. Director script cu timeline complet
5. Pipeline ffmpeg + keyframes
6. Iterații pe timing — aici sunt cele 5-10 runde reale
7. Derivarea variantelor

## 9. Ce rămâne judecată umană

Pipeline-ul rezolvă execuția, nu decizia. Rămân la utilizator: ritmul, copy-ul
de pe ecran, alegerea muzicii, decizia dacă money shot-ul lovește.

Bucla: rulezi → te uiți → „prea lent la secunda 12" → ajustezi hold în
timeline → re-rulezi. 3 minute per iterație.
