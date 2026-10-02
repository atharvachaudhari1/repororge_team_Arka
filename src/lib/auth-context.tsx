import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loginAccount,
  logoutAccount,
  readSession,
  registerAccount,
  type AccountRole,
  type AuthUser,
} from "./auth.functions";

type Credentials = { email: string; password: string; role: AccountRole };
type Registration = Credentials & { fullName: string };

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: Credentials) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>;
  register: (data: Registration) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const loginFn = useServerFn(loginAccount);
  const registerFn = useServerFn(registerAccount);
  const sessionFn = useServerFn(readSession);
  const logoutFn = useServerFn(logoutAccount);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear legacy localStorage session token from prior versions (prevent XSS exposure)
    try {
      window.localStorage.removeItem("ableo:session-token");
    } catch (err) {
      void err;
    }

    // Read session directly via HttpOnly cookie
    sessionFn({ data: {} })
      .then((result) => {
        setUser(result?.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [sessionFn]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      login: async (data) => {
        const res = await loginFn({ data });
        if (!res.ok || !res.user) return { ok: false, error: res.error };
        setUser(res.user);
        return { ok: true, user: res.user };
      },
      register: async (data) => {
        const res = await registerFn({ data });
        if (!res.ok || !res.user) return { ok: false, error: res.error };
        setUser(res.user);
        return { ok: true, user: res.user };
      },
      logout: () => {
        setUser(null);
        void logoutFn({ data: {} });
      },
    }),
    [isLoading, loginFn, logoutFn, registerFn, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
