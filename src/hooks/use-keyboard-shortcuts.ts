'use client';

import { useEffect } from 'react';

type Action = 'toggleCommandPalette' | 'toggleShortcutsHelp' | 'refresh' | 'exportExcel';

interface UseKeyboardShortcutsOptions {
  onNavigate: (href: string) => void;
  onAction: (action: Action) => void;
  enabled?: boolean;
}

const quickLinks: Record<string, string> = {
  '1': '/',
  '2': '/stocks',
  '3': '/market',
  w: '/watchlist',
  a: '/alerts',
  s: '/settings',
  b: '/backup',
};

export function useKeyboardShortcuts({
  onNavigate,
  onAction,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!enabled) return;

      const activeTag = (document.activeElement?.tagName ?? '').toUpperCase();
      const typing = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onAction('toggleCommandPalette');
        return;
      }

      if (typing) {
        if (event.key === 'Escape') (document.activeElement as HTMLElement | null)?.blur();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        onAction('toggleShortcutsHelp');
        return;
      }

      if (!event.altKey) return;

      const key = event.key.toLowerCase();
      if (quickLinks[key]) {
        event.preventDefault();
        onNavigate(quickLinks[key]);
        return;
      }

      if (key === 'r') {
        event.preventDefault();
        onAction('refresh');
      }

      if (key === 'e') {
        event.preventDefault();
        onAction('exportExcel');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onAction, onNavigate]);
}

export const SHORTCUTS_GROUPS = [
  {
    title: 'التنقل السريع',
    items: [
      { keys: 'Alt + 1', label: 'لوحة المعلومات' },
      { keys: 'Alt + 2', label: 'الأسهم' },
      { keys: 'Alt + 3', label: 'السوق اليومي' },
      { keys: 'Alt + W', label: 'قائمة المتابعة' },
      { keys: 'Alt + A', label: 'التنبيهات' },
      { keys: 'Alt + S', label: 'الإعدادات' },
      { keys: 'Alt + B', label: 'النسخ الاحتياطي' },
    ],
  },
  {
    title: 'الإجراءات',
    items: [
      { keys: 'Ctrl/Cmd + K', label: 'لوحة الأوامر' },
      { keys: 'Alt + R', label: 'تحديث البيانات' },
      { keys: 'Alt + E', label: 'تصدير Excel' },
    ],
  },
  {
    title: 'عام',
    items: [
      { keys: '?', label: 'عرض الاختصارات' },
      { keys: 'Esc', label: 'إغلاق النوافذ' },
    ],
  },
];
