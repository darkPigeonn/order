"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { AuthResult, MeResult, Permission, SessionUser } from "./types";

const TOKEN_KEY = "manageorder.token";

interface AuthContextValue {
  ready: boolean;
  token: string | null;
  user: SessionUser | null;
  permissions: Permission[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setReady(true);
      return;
    }

    setToken(stored);
    api<MeResult>("/auth/me", { token: stored })
      .then((result) => {
        setUser(result.user);
        setPermissions(result.permissions);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      user,
      permissions,
      async login(email: string, password: string) {
        const result = await api<AuthResult>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        window.localStorage.setItem(TOKEN_KEY, result.accessToken);
        setToken(result.accessToken);
        setUser(result.user);
        setPermissions(result.permissions);
      },
      logout() {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setPermissions([]);
      },
    }),
    [permissions, ready, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return context;
}
