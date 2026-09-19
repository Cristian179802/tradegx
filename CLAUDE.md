# TradeGX — monorepo

Turborepo cu npm workspaces: `apps/web` (Next.js 15, App Router) și
`packages/core` (matematica de trading, pură, fără dependințe).

Managerul de pachete e **npm** (`packageManager: npm@11.12.1`), nu pnpm.

## Porți care trebuie să treacă înainte de push

`npm run build --workspace=tradegx` rulează exact ce rulează Vercel:

1. `scripts/i18n-scan.mjs` — pică dacă apare text românesc scris direct în UI
2. `vitest run` — testele
3. `next build`

Dacă una pică local, pică și deploy-ul. Nu împinge sperând.

## Reguli care s-au născut din greșeli reale

- **Nu `git add -A`, nu `git add <director>`.** Repo-ul are uneori modificări
  vechi necomise; Vercel face deploy automat din push. Adaugă explicit doar
  fișierele tale.
- **Rută API publică nouă** → obligatoriu în `publicPrefixes` din
  `middleware.ts`, altfel primește 307 spre `/login`. Nu se vede local (ești
  mereu logat), se vede doar cu un curl neautentificat pe live.
- **`auth.ts` e importat de middleware-ul Edge** → niciun `node:crypto` sau
  `otplib` la nivel de modul. Import leneș, înăuntrul lui `authorize`. Altfel
  500 pe tot site-ul.
- **Nimic nedeterminist la randare.** `Math.random()`, `new Date()`,
  `toLocaleString()` în corpul unei componente rup hidratarea. Pentru decor
  stabil există `aleatorStabil()` în `src/lib/pseudo-random.ts`.
- **`*.sh` și `Dockerfile` rămân cu LF** (`.gitattributes`). CRLF le strică în
  Linux cu un mesaj care nu seamănă cu cauza.

## Design system — „Institutional Futurism"

Tokenii și utilitarele stau în `src/app/globals.css`:

- suprafețe `--s-*`, text `--ink-*`, linii `--line-*`, accent `--accent`
- **un singur** accent decorativ (indigo/violet). Verde și roșu se folosesc
  DOAR pentru semantica P&L — profit și pierdere. Niciodată ca decor.
- utilitarele publice sunt `.tg-*`. Ce nu e `.tg-*` e vechi și pe cale de
  dispariție; nu adăuga în dialectul vechi.
- cifrele-titlu se afișează prin `<RollingNumber/>`, nu ca text simplu.

## i18n

RO + EN, complete și egale (`messages/*.json`). Proza din Academie stă în
dicționare `I18nText` în `.ts`, nu în `messages/` — poarta i18n scanează și
paginile ei.
