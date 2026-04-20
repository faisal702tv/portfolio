'use client';

import { createContext, useContext, ReactNode, useCallback, useRef, useSyncExternalStore, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (next: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth store for useSyncExternalStore
type AuthState = { user: User | null; token: string | null; refreshToken: string | null; isLoading: boolean };
let authState: AuthState = { user: null, token: null, refreshToken: null, isLoading: true };
const listeners = new Set<() => void>();

function getAuthSnapshot(): AuthState {
  return authState;
}

const SERVER_SNAPSHOT: AuthState = { user: null, token: null, refreshToken: null, isLoading: true };
function getServerSnapshot(): AuthState {
  return SERVER_SNAPSHOT;
}

function setAuthState(newState: Partial<AuthState>) {
  authState = { ...authState, ...newState };
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // Refresh 5 min before expiry
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const REFRESH_TOKEN_KEY = 'refreshToken';

function saveAuth(token: string, refreshToken: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setAuthState({ token, refreshToken, user });
}

function persistUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthState({ user });
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  setAuthState({ token: null, refreshToken: null, user: null });
}

// Initialize from localStorage (client-side only)
function initializeAuth() {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (storedToken && storedUser) {
      setAuthState({
        token: storedToken,
        user: JSON.parse(storedUser) as User,
        refreshToken: storedRefreshToken,
        isLoading: false,
      });
    } else {
      setAuthState({ isLoading: false });
    }
  } catch {
    clearAuth();
    setAuthState({ isLoading: false });
  }
}

if (typeof window !== 'undefined') {
  try {
    initializeAuth();
  } catch {
    setTimeout(initializeAuth, 0);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const state = useSyncExternalStore(subscribe, getAuthSnapshot, getServerSnapshot);

  const doRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefresh) return false;

      const response = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });

      if (!response.ok) {
        clearAuth();
        router.push('/login');
        return false;
      }

      const data = await response.json();
      const currentUser = authState.user ?? state.user;
      if (!currentUser) {
        clearAuth();
        router.push('/login');
        return false;
      }

      saveAuth(data.token, data.refreshToken, currentUser);
      return true;
    } catch {
      return false;
    }
  }, [router, state.user]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    if (state.token) {
      // Access token is 15 min, refresh 5 min before
      refreshTimerRef.current = setTimeout(() => {
        doRefresh();
      }, REFRESH_BEFORE_EXPIRY_MS);
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [doRefresh, state.token]);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      saveAuth(data.token, data.refreshToken, data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  }, []);

  const register = useCallback(async (email: string, username: string, password: string, name?: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, username, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      saveAuth(data.token, data.refreshToken, data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async () => {
    return doRefresh();
  }, [doRefresh]);

  const updateUser = useCallback((next: Partial<User>) => {
    const currentUser = authState.user;
    if (!currentUser) return;
    const merged: User = { ...currentUser, ...next };
    persistUser(merged);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isLoading: state.isLoading,
        isAuthenticated: !!state.user && !!state.token,
        login,
        register,
        logout,
        refreshToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
