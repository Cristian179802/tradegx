# FAZA 2.5 — Filtre + analytics pe două dimensiuni

> **Pentru Claude Code:** execută doar ce e în acest fișier. Nu trece la faza 3
> din `docs/VIDEO_SPEC.md`. Oprește-te la final și raportează.

Nu e doar pentru video — e funcție de produs reală. Se implementează ca atare,
nu ca hack de demo.

---

## 1. Filtre

Filtru de setup și filtru de sesiune în analytics. **Combinabile** — se pot
aplica simultan.

## 2. Cross-tab (partea critică)

Analytics trebuie să grupeze pe **combinația setup × sesiune**, nu pe o singură
dimensiune.

Fără asta, `FVG în London → 61% WR` vs `FVG în Asia → 23% WR` nu se poate afișa
nicăieri. Ăla e întreg punctul videoului și al funcției. Gruparea pe o singură
dimensiune nu e suficientă.

Metrici per celulă: win rate, număr de trade-uri, expectancy în R.
Celulele cu eșantion prea mic trebuie marcate ca atare — un procent pe 3
trade-uri nu e o statistică, iar publicul SMC știe asta.

## 3. Recalculare vizibilă

Statistica se recalculează **vizibil** la aplicarea filtrului. Tranziție pe
valori, nu re-render brusc. Momentul ăsta se filmează la secunda 17 și e cadrul
cel mai important din video.

## 4. Netezire în seed

`GBPUSD` la 18.8% e un semnal nedorit care concurează cu povestea FVG/Asia.

Ajustează atribuirea instrumentelor în `scripts/seed-demo-account.ts`: toate
instrumentele plate, în jurul mediei globale, fără outlieri.

**Nu atinge restul distribuțiilor** — win rate global, R-uri, drawdown-uri,
contrastul FVG/London vs FVG/Asia rămân exact cum sunt.

---

## Ce NU se face acum

- Fără `data-testid` — aia e faza 3
- Fără cod de Playwright sau captură
- Fără modificări de design system

---

## La final

Rulează seed-ul din nou și raportează:
- distribuția pe instrumente după netezire
- tabelul cross-tab setup × sesiune, cu win rate și număr de trade-uri per celulă

Apoi oprește-te.
