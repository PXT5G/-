"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { OfficerProfile, Permission, UserRole } from "@/lib/auth/types";
import { hasPermission, isAdminRole } from "@/lib/auth/permissions";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
  officer: OfficerProfile;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string, redirectTo?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (perm: Permission) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string, redirectTo = "/") => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errors: Record<string, string> = {
          INVALID_CREDENTIALS: "اسم المستخدم أو كلمة المرور غير صحيحة",
          MAINTENANCE: "النظام قيد الصيانة حالياً",
          MISSING_CREDENTIALS: "يرجى إدخال بيانات الدخول",
        };
        return { ok: false, error: errors[data.error] ?? "فشل تسجيل الدخول" };
      }
      setUser(data.user);
      const safePath = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
      router.push(safePath);
      router.refresh();
      return { ok: true };
    },
    [router],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
      can: (perm: Permission) =>
        user ? hasPermission(user.permissions, perm, user.role) : false,
      isAdmin: user ? isAdminRole(user.role) : false,
    }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
