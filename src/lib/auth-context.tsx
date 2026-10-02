import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginAccount, logoutAccount, readSession, registerAccount, type AccountRole, type AuthUser } from "./auth.functions";

const SESSION_KEY = "ableo:session-token";
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
    const token = window.localStorage.getItem(SESSION_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    sessionFn({ data: { token } })
      .then((result) => {
        setUser(result.user);
        if (!result.user) window.localStorage.removeItem(SESSION_KEY);
      })
      .catch(() => window.localStorage.removeItem(SESSION_KEY))
      .finally(() => setIsLoading(false));
  }, [sessionFn]);

  const finish = (result: Awaited<ReturnType<typeof loginFn>>) => {
    if (!result.ok) return { ok: false, error: result.error };
    window.localStorage.setItem(SESSION_KEY, result.token);
    setUser(result.user);
    return { ok: true, user: result.user };
  };

  const value = useMemo<AuthState>(() => ({
    user,
    isLoading,
    login: async (data) => finish(await loginFn({ data })),
    register: async (data) => finish(await registerFn({ data })),
    logout: () => {
      const token = window.localStorage.getItem(SESSION_KEY);
      window.localStorage.removeItem(SESSION_KEY);
      setUser(null);
      if (token) void logoutFn({ data: { token } });
    },
  }), [isLoading, loginFn, logoutFn, registerFn, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
