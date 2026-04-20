'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AccessState {
  loading: boolean;
  loaded: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  permissions: string[];
  routePrefixes: string[];
  deniedRoutePrefixes: string[];
  assignedGroupIds: string[];
}

const OPEN_ALL_PREFIX = '*';

function normalizePath(path: string): string {
  const stripped = (path || '/').split('?')[0].split('#')[0] || '/';
  if (stripped === '/') return '/';
  return stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
}

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix === OPEN_ALL_PREFIX) return true;
  if (prefix === '/') return path === '/';
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function useAccessControl() {
  const { token, user, isAuthenticated } = useAuth();
  const [state, setState] = useState<AccessState>({
    loading: false,
    loaded: false,
    isAdmin: false,
    isBlocked: false,
    permissions: [],
    routePrefixes: [OPEN_ALL_PREFIX],
    deniedRoutePrefixes: [],
    assignedGroupIds: [],
  });

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      setState({
        loading: false,
        loaded: false,
        isAdmin: false,
        isBlocked: false,
        permissions: [],
        routePrefixes: [OPEN_ALL_PREFIX],
        deniedRoutePrefixes: [],
        assignedGroupIds: [],
      });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    (async () => {
      try {
        const response = await fetch('/api/access', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`access request failed: ${response.status}`);
        }

        const payload = await response.json();
        const access = payload?.access;
        const routePrefixes = Array.isArray(access?.routePrefixes) ? access.routePrefixes.filter((entry: unknown): entry is string => typeof entry === 'string') : [];
        const deniedRoutePrefixes = Array.isArray(access?.deniedRoutePrefixes)
          ? access.deniedRoutePrefixes.filter((entry: unknown): entry is string => typeof entry === 'string')
          : [];
        const permissions = Array.isArray(access?.permissions) ? access.permissions.filter((entry: unknown): entry is string => typeof entry === 'string') : [];
        const assignedGroupIds = Array.isArray(access?.assignedGroupIds)
          ? access.assignedGroupIds.filter((entry: unknown): entry is string => typeof entry === 'string')
          : [];

        if (cancelled) return;
        setState({
          loading: false,
          loaded: true,
          isAdmin: Boolean(access?.isAdmin) || user.role === 'admin',
          isBlocked: Boolean(access?.isBlocked),
          permissions,
          routePrefixes: routePrefixes.length > 0 ? routePrefixes : [OPEN_ALL_PREFIX],
          deniedRoutePrefixes,
          assignedGroupIds,
        });
      } catch {
        if (cancelled) return;
        setState({
          loading: false,
          loaded: true,
          isAdmin: user.role === 'admin',
          isBlocked: false,
          permissions: [],
          routePrefixes: [OPEN_ALL_PREFIX],
          deniedRoutePrefixes: [],
          assignedGroupIds: [],
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, user]);

  const canAccessPath = useCallback(
    (path: string) => {
      if (!user) return false;
      if (user.role === 'admin' || state.isAdmin) return true;
      const normalizedPath = normalizePath(path);
      const allowed = state.routePrefixes.some((prefix) => matchesPrefix(normalizedPath, normalizePath(prefix)));
      if (!allowed) return false;
      const denied = state.deniedRoutePrefixes.some((prefix) => matchesPrefix(normalizedPath, normalizePath(prefix)));
      return !denied;
    },
    [state.isAdmin, state.routePrefixes, state.deniedRoutePrefixes, user]
  );

  return useMemo(
    () => ({
      ...state,
      canAccessPath,
    }),
    [state, canAccessPath]
  );
}
