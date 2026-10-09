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

export type { AccountRole };

export type Credentials = {
  email: string;
  password?: string;
  role: AccountRole;
  rememberMe?: boolean | undefined;
};
export type Registration = Omit<Credentials, "password"> & { password: string; fullName: string };

export type AuthResult = {
  ok: boolean;
  error?: string | undefined;
  user?: AuthUser | undefined;
  requiresVerification?: boolean | undefined;
  email?: string | undefined;
  message?: string | undefined;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: Credentials) => Promise<AuthResult>;
  register: (data: Registration) => Promise<AuthResult>;
  logout: () => void;
  /** Set user from external auth flow (e.g. biometric) */
  setAuthUser: (user: AuthUser) => void;
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
    const localToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("ableo:session-token") || undefined
        : undefined;

    // Read session directly via HttpOnly cookie or token fallback
    sessionFn({ data: { token: localToken } })
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
      login: async (data): Promise<AuthResult> => {
        const res = (await loginFn({ data })) as {
          ok: boolean;
          error?: string;
          user?: AuthUser;
          token?: string;
          requiresVerification?: boolean;
          email?: string;
        };
        if (!res.ok) {
          return {
            ok: false,
            error: res.error,
            requiresVerification: res.requiresVerification,
            email: res.email,
          };
        }
        if (!res.user) return { ok: false, error: res.error };
        if (res.token && typeof window !== "undefined") {
          try {
            window.localStorage.setItem("ableo:session-token", res.token);
          } catch {}
        }
        setUser(res.user);
        return { ok: true, user: res.user };
      },
      register: async (data): Promise<AuthResult> => {
        const res = (await registerFn({ data })) as {
          ok: boolean;
          error?: string;
          user?: AuthUser;
          token?: string;
          requiresVerification?: boolean;
          message?: string;
        };
        if (!res.ok) return { ok: false, error: res.error };
        if (res.requiresVerification) {
          return {
            ok: true,
            requiresVerification: true,
            message: res.message,
            user: res.user,
          };
        }
        if (!res.user) return { ok: false, error: res.error };
        if (res.token && typeof window !== "undefined") {
          try {
            window.localStorage.setItem("ableo:session-token", res.token);
          } catch {}
        }
        setUser(res.user);
        return { ok: true, user: res.user };
      },
      logout: () => {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem("ableo:session-token");
          } catch {}
        }
        setUser(null);
        void logoutFn({ data: {} });
      },
      setAuthUser: (u: AuthUser) => {
        setUser(u);
      },
    }),
    [isLoading, loginFn, logoutFn, registerFn, user, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
