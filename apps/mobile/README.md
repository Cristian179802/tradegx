# TradeGx Mobile (Expo)

App native iOS + Android, parte din monorepo. Consumă **exact aceleași API-uri** ca web-ul, prin `@tradegx/api-client`. Logica de risc/SMC/validări vine din `@tradegx/core`.

## Rulare locală (dezvoltare)

```bash
# 1. De la rădăcina monorepo-ului — instalează dependențele (inclusiv Expo)
npm install

# 2. Aliniază versiunile exacte Expo SDK (important)
npm --workspace mobile exec -- npx expo install --fix

# 3. Pornește serverul de dezvoltare
npm --workspace mobile run start
# sau: cd apps/mobile && npx expo start
```

Apoi:
- Instalează **Expo Go** pe telefon (App Store / Google Play)
- Scanează codul QR din terminal → app-ul rulează live pe telefon

## Configurare
- `extra.apiUrl` din `app.json` = backend-ul (implicit `https://www.tradegx.com`).
- Auth: login cu contul TradeGx → JWT salvat în `expo-secure-store`, refresh automat.

## Structură
- `app/` — rute (expo-router): `login`, `(tabs)/{index,signals,journal,settings}`
- `src/lib/` — `api` (client partajat), `auth` (context + secure-store)
- Stiluri: NativeWind (Tailwind), tokens din `@tradegx/ui-tokens`

## Build pentru store (Faza 4)
Necesită cont Expo (EAS) + Apple Developer / Google Play. Comenzi: `eas build`.
