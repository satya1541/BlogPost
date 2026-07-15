import React, { createContext, useContext, useState, useEffect } from "react";
import { customFetch, setAuthTokenGetter } from "@workspace/api-client-react";

export interface User {
  id: number;
  email: string;
  role: string;
  displayName?: string | null;
  streakCount: number;
  lastActiveAt?: string | null;
  emailVerified?: boolean;
  age?: number | null;
  occupation?: string | null;
  onboardingCompleted?: boolean;
  createdAt: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string, action?: "login" | "signup") => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const data = await customFetch<User>("/api/auth/me");
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("session_token"));
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await customFetch<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem("session_token", data.token);
    }
    setUser(data);
  };

  const register = async (email: string, password: string) => {
    const data = await customFetch<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem("session_token", data.token);
    }
    setUser(data);
  };

  const loginWithGoogle = async (credential: string, action?: "login" | "signup") => {
    const data = await customFetch<User>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, action }),
    });
    if (data.token) {
      localStorage.setItem("session_token", data.token);
    }
    setUser(data);
  };

  const logout = async () => {
    try {
      await customFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // Ignore network errors on logout
    }
    localStorage.removeItem("session_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
