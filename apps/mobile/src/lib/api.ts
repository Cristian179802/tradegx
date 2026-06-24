import Constants from "expo-constants";
import { createApiClient } from "@tradegx/api-client";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./secure-storage";

// Aceeași definiție a apelurilor ca pe web (packages/api-client).
// Diferența: baseUrl absolut + Bearer token din secure-store, cu refresh automat.
export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://www.tradegx.com";

// Decodează `exp` dintr-un JWT (fără verificare — doar pentru a ști dacă a expirat).
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      decodeURIComponent(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

// Token valid garantat: dacă e expirat (sau aproape), îl reînnoiește proactiv.
async function getValidAccessToken(): Promise<string | null> {
  const access = await getAccessToken();
  if (access && !isExpired(access)) return access;
  if (!refreshing) refreshing = refreshTokens().finally(() => { refreshing = null; });
  return refreshing;
}

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: getValidAccessToken,
});
