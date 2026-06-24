import * as SecureStore from "expo-secure-store";

const ACCESS = "tradegx.accessToken";
const REFRESH = "tradegx.refreshToken";

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS);
}
export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH);
}
export async function setTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS, accessToken);
  await SecureStore.setItemAsync(REFRESH, refreshToken);
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}
