import * as SecureStore from "expo-secure-store";

// Stocare securizată a token-urilor JWT (Keychain iOS / Keystore Android).
const ACCESS = "tradegx_access_token";
const REFRESH = "tradegx_refresh_token";

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH);

export async function setTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS, accessToken);
  await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}
