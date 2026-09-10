# TradeGX — monorepo

## Video marketing

- Specificația completă e în `docs/VIDEO_SPEC.md`. Orice fază de lucru pe video
  pornește de acolo, nu din presupuneri.
- Tot codul de video stă în `video/`, la rădăcina monorepo-ului.
- `video/` NU se buildează cu aplicația — e tooling separat, rulat manual sau
  din CI, niciodată în drumul de deploy al site-ului.

  Regula nu e o convenție pe cuvânt, e ținută de structură: `video/package.json`
  nu are script `build`, iar Turbo rulează doar task-urile pe care un workspace
  le declară. Dacă cineva adaugă vreodată un `build` acolo, îl va trage în
  build-ul de producție — de aceea nu există.

- Managerul de pachete al repo-ului e **npm** (`packageManager: npm@11.12.1`),
  nu pnpm. Comenzile din documentele de lucru scrise cu `pnpm ...` se rulează
  ca `npm run ...`.
