import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { MobileAuthResponse, MobileUser } from "@tradegx/core";
import { API_URL } from "./api";
import { getRefreshToken, setTokens, clearTokens } from "./secure-storage";

interface AuthState {
  user: MobileUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // La pornire: dacă există refresh token, reînnoiește sesiunea
  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return;
        const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
          const data: MobileAuthResponse = await res.json();
          await setTokens(data.accessToken, data.refreshToken);
          setUser(data.user);
        } else {
          await clearTokens();
        }
      } catch {
        /* offline / eroare — rămâne delogat */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/mobile/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Autentificare eșuată");
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth trebuie folosit în AuthProvider");
  return ctx;
}
