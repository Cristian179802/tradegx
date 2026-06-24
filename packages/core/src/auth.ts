// @tradegx/core/auth — tipuri și constante shared pentru auth mobil.

export const ACCESS_TOKEN_TTL = 15 * 60; // 15 minute
export const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 zile

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface MobileUser {
  id: string;
  email: string;
  name: string | null;
}
