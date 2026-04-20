'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotificationItem, NotificationKind } from '@/hooks/use-notifications';

// ─── Config ──────────────────────────────────────────────────

const POPUP_DURATION = 5000; // 5 seconds
const MAX_VISIBLE = 4;

interface PopupItem extends NotificationItem {
  /** internal: when this popup was shown */
  _shownAt: number;
  /** internal: is it dismissing (for exit animation) */
  _dismissing?: boolean;
}

const kindStyles: Record<NotificationKind, {
  bg: string;
  border: string;
  text: string;
  icon: typeof CheckCircle2;
  progress: string;
}> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle2,
    progress: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
    progress: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    icon: XCircle,
    progress: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-200',
    icon: Info,
    progress: 'bg-blue-500',
  },
};

// ─── Component ───────────────────────────────────────────────

export function NotificationPopup() {
  const [popups, setPopups] = useState<PopupItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setPopups((prev) =>
      prev.map((p) => (p.id === id ? { ...p, _dismissing: true } : p))
    );
    // Remove after animation
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 300);
  }, []);

  // Listen for notification events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<NotificationItem>).detail;
      if (!detail) return;

      const popup: PopupItem = { ...detail, _shownAt: Date.now() };
      setPopups((prev) => [popup, ...prev].slice(0, MAX_VISIBLE));

      // Auto-dismiss after duration
      setTimeout(() => dismiss(detail.id), POPUP_DURATION);
    };

    window.addEventListener('portfolio-notification', handler);
    return () => window.removeEventListener('portfolio-notification', handler);
  }, [dismiss]);

  if (popups.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-4 z-[200] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)] pointer-events-none"
      dir="rtl"
    >
      {popups.map((popup, index) => {
        const config = kindStyles[popup.kind];
        const IconComponent = config.icon;
        const elapsed = Date.now() - popup._shownAt;
        const remaining = Math.max(0, POPUP_DURATION - elapsed);

        return (
          <div
            key={popup.id}
            className={cn(
              'pointer-events-auto rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300',
              config.bg,
              config.border,
              popup._dismissing
                ? 'opacity-0 translate-x-full scale-95'
                : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-left-full fade-in duration-300',
            )}
            style={{ zIndex: 200 - index }}
          >
            {/* Main Content */}
            <div className="flex items-start gap-3 p-3.5">
              {/* Icon */}
              <div className={cn('rounded-lg p-1.5 shrink-0', config.bg)}>
                <IconComponent className={cn('h-4 w-4', config.text)} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold leading-tight', config.text)}>
                  {popup.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                  {popup.body}
                </p>
                {popup.source && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <Bell className="h-2.5 w-2.5" />
                    {popup.source}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                className={cn(
                  'shrink-0 rounded-md p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10',
                  config.text
                )}
                onClick={() => dismiss(popup.id)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Progress bar (auto-dismiss timer) */}
            <div className="h-0.5 w-full overflow-hidden rounded-b-xl bg-black/5 dark:bg-white/5">
              <div
                className={cn('h-full rounded-b-xl transition-all ease-linear', config.progress)}
                style={{
                  width: '100%',
                  animation: `shrink-width ${remaining}ms linear forwards`,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* CSS animation for progress bar */}
      <style jsx>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
