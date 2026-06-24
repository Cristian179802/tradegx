import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_URL } from "./api";
import { getRefreshToken, setTokens, clearTokens } from "./secure-storage";

type User = { id: string; email: string; name: string | null };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: dacă avem refresh token valid, reînnoim sesiunea și luăm user-ul.
  useEffect(() => {
    (async () => {
      const rt = await getRefreshToken();
      if (rt) {
        try {
          const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (res.ok) {
            const d = await res.json();
            await setTokens(d.accessToken, d.refreshToken);
            setUser(d.user);
          } else {
            await clearTokens();
          }
        } catch {
          /* offline — rămânem pe ecranul de login */
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    try {
      const res = await fetch(`${API_URL}/api/auth/mobile/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) return { ok: false, error: d.error ?? "Eroare la autentificare" };
      await setTokens(d.accessToken, d.refreshToken);
      setUser(d.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Fără conexiune. Verifică internetul." };
    }
  }

  async function logout() {
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
