import Constants from "expo-constants";
import { createApiClient } from "@tradegx/api-client";
import { getAccessToken } from "./secure-storage";

// Aceeași definiție a apelurilor ca pe web (packages/api-client).
// Diferența: baseUrl absolut + Bearer token din secure-store (în loc de cookie).
export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://www.tradegx.com";

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: getAccessToken,
});
