# TradeGX — monorepo

## Video marketing

- Specificația completă e în `docs/VIDEO_SPEC.md`. Orice fază de lucru pe video
  pornește de acolo, nu din presupuneri.
- Tot codul de video stă în `video/`, la rădăcina monorepo-ului.
- `video/` NU se buildează cu aplicația și **NU e workspace npm**, deliberat.

  Prima variantă îl avea în `workspaces`. L-am scos când a primit dependința de
  Playwright: `npm install` la rădăcină instalează dependințele TUTUROR
  workspace-urilor, iar Vercel rulează exact asta la fiecare deploy. Site-ul ar
  fi început să descarce Playwright și browserele lui (~150 MB) ca să
  construiască o pagină de Next — cost și risc, pentru zero câștig.

  `video/` are deci propriul `package.json` și propriul `node_modules`,
  instalate DOAR înăuntrul containerului (vezi `video/Dockerfile`). Nimic din el
  nu atinge drumul de deploy al aplicației.

- Managerul de pachete al repo-ului e **npm** (`packageManager: npm@11.12.1`),
  nu pnpm. Comenzile din documentele de lucru scrise cu `pnpm ...` se rulează
  ca `npm run ...`.
