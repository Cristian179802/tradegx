// Tipuri de autentificare partajate web + mobile.

export interface MobileUser {
  id: string;
  email: string;
  name: string | null;
}

export interface TokenPair {
  accessToken: string;   // viață scurtă (~15 min)
  refreshToken: string;  // viață lungă (~30 zile)
}

export interface MobileAuthResponse extends TokenPair {
  user: MobileUser;
}

export const ACCESS_TOKEN_TTL = 15 * 60;          // 15 minute (secunde)
export const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 zile (secunde)
