'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

// ─── Types ──────────────────────────────────────────────────
export type NotificationKind = 'success' | 'warning' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: number; // timestamp
  read: boolean;
  /** Optional link to navigate to when clicked */
  href?: string;
  /** Optional source page/feature that generated this notification */
  source?: string;
}

// ─── Storage key ────────────────────────────────────────────
const STORAGE_KEY = 'portfolio_notifications';
const MAX_NOTIFICATIONS = 100;

// ─── In-memory store with external sync ─────────────────────
let notifications: NotificationItem[] = [];
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach((fn) => fn());
}

function loadFromStorage(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: NotificationItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
  } catch { /* quota exceeded */ }
}

// Initialize from storage on first load
if (typeof window !== 'undefined') {
  notifications = loadFromStorage();
}

// ─── Public API ─────────────────────────────────────────────

let idCounter = Date.now();

/** Add a notification to the store and optionally show a popup toast */
export function addNotification(
  notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>
): NotificationItem {
  const item: NotificationItem = {
    ...notification,
    id: `notif_${++idCounter}`,
    createdAt: Date.now(),
    read: false,
  };
  notifications = [item, ...notifications].slice(0, MAX_NOTIFICATIONS);
  saveToStorage(notifications);
  emitChange();

  // Dispatch custom event for popup toast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('portfolio-notification', { detail: item })
    );
  }

  return item;
}

export function markAsRead(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveToStorage(notifications);
  emitChange();
}

export function markAllAsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  saveToStorage(notifications);
  emitChange();
}

export function removeNotification(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  saveToStorage(notifications);
  emitChange();
}

export function clearAllNotifications() {
  notifications = [];
  saveToStorage(notifications);
  emitChange();
}

// ─── React hook ─────────────────────────────────────────────

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

function getSnapshot() {
  return notifications;
}

function getServerSnapshot(): NotificationItem[] {
  return [];
}

export function useNotifications() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Re-hydrate from localStorage on mount (handles cross-tab sync)
  useEffect(() => {
    const handle = () => {
      notifications = loadFromStorage();
      emitChange();
    };
    window.addEventListener('storage', handle);
    // Initial hydration
    if (notifications.length === 0) {
      const stored = loadFromStorage();
      if (stored.length > 0) {
        notifications = stored;
        emitChange();
      }
    }
    return () => window.removeEventListener('storage', handle);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return {
    notifications: items,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll: clearAllNotifications,
  };
}

// ─── Convenience helpers for common notification patterns ───

export function notifySuccess(title: string, body: string, opts?: { href?: string; source?: string }) {
  return addNotification({ title, body, kind: 'success', ...opts });
}

export function notifyWarning(title: string, body: string, opts?: { href?: string; source?: string }) {
  return addNotification({ title, body, kind: 'warning', ...opts });
}

export function notifyError(title: string, body: string, opts?: { href?: string; source?: string }) {
  return addNotification({ title, body, kind: 'error', ...opts });
}

export function notifyInfo(title: string, body: string, opts?: { href?: string; source?: string }) {
  return addNotification({ title, body, kind: 'info', ...opts });
}
