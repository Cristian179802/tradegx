import Constants from "expo-constants";
import { createApiClient, ApiError } from "@tradegx/api-client";
import { tokenCurent, reimprospateaza } from "./auth";

// ── Clientul de API ──────────────────────────────────────────────────────────
//
// Același client ca web-ul (`@tradegx/api-client`), cu două diferențe: bază
// absolută și token din secure-store în loc de cookie.
//
// Reîncercarea după 401 stă ÎN client, nu aici: toate metodele lui se închid
// peste `request`-ul din interior, deci un strat pus pe deasupra ar fi prins
// doar apelurile manuale. `onUnauthorized` reîmprospătează perechea de
// token-uri și spune dacă merită repetată cererea.

const API =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://www.tradegx.com";

export const api = createApiClient({
  baseUrl: API,
  getToken: () => tokenCurent(),
  onUnauthorized: async () => (await reimprospateaza()) != null,
});

export { ApiError };
export const URL_API = API;
