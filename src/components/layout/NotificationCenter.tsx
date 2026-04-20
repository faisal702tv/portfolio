'use client';

import { useMemo, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, X, ExternalLink, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import {
  useNotifications,
  type NotificationKind,
  type NotificationItem,
} from '@/hooks/use-notifications';

// ─── Color & Icon Mapping ─────────────────────────────────────

const kindConfig: Record<NotificationKind, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  icon: typeof CheckCircle2;
  label: string;
  dot: string;
}> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700',
    icon: CheckCircle2,
    label: 'نجاح',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700',
    icon: AlertTriangle,
    label: 'تحذير',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700',
    icon: XCircle,
    label: 'خطأ',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700',
    icon: Info,
    label: 'معلومة',
    dot: 'bg-blue-500',
  },
};

// ─── Time Helpers ─────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short', day: 'numeric' });
}

function groupByDay(items: NotificationItem[]) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const groups: { label: string; items: NotificationItem[] }[] = [];
  const todayItems: NotificationItem[] = [];
  const yesterdayItems: NotificationItem[] = [];
  const olderItems: NotificationItem[] = [];

  for (const item of items) {
    const d = new Date(item.createdAt).toDateString();
    if (d === today) todayItems.push(item);
    else if (d === yesterday) yesterdayItems.push(item);
    else olderItems.push(item);
  }

  if (todayItems.length > 0) groups.push({ label: 'اليوم', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'أمس', items: yesterdayItems });
  if (olderItems.length > 0) groups.push({ label: 'سابقًا', items: olderItems });
  return groups;
}

// ─── Component ────────────────────────────────────────────────

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

  const groups = useMemo(() => groupByDay(notifications), [notifications]);

  const handleClick = useCallback((item: NotificationItem) => {
    if (!item.read) markAsRead(item.id);
  }, [markAsRead]);

  return (
    <>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        title="مركز الإشعارات"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
          {/* Header */}
          <div className="border-b px-5 py-4">
            <SheetHeader className="pr-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-right flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  مركز الإشعارات
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </SheetTitle>
              </div>
              <SheetDescription className="text-right text-xs">
                متابعة تنبيهات السوق والمحفظة في مكان واحد
              </SheetDescription>
            </SheetHeader>

            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  تعليم الكل كمقروء
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={clearAll}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  مسح الكل
                </Button>
              </div>
            )}
          </div>

          {/* Notification List */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-5 py-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const config = kindConfig[item.kind];
                      const IconComponent = config.icon;

                      const content = (
                        <div
                          className={cn(
                            'group relative rounded-lg border p-3 transition-all cursor-pointer hover:shadow-sm',
                            !item.read
                              ? `${config.bg} ${config.border}`
                              : 'bg-background border-border hover:bg-muted/50'
                          )}
                          onClick={() => handleClick(item)}
                        >
                          {/* Remove button */}
                          <button
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); removeNotification(item.id); }}
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>

                          <div className="flex items-start gap-2.5">
                            {/* Icon */}
                            <div className={cn('mt-0.5 rounded-full p-1', config.bg)}>
                              <IconComponent className={cn('h-3.5 w-3.5', config.text)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Title + Badge */}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={cn('text-sm font-semibold leading-tight', !item.read && config.text)}>
                                  {item.title}
                                </p>
                                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 shrink-0', config.badge)}>
                                  {config.label}
                                </Badge>
                              </div>

                              {/* Body */}
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.body}
                              </p>

                              {/* Footer: time + source + link */}
                              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>{timeAgo(item.createdAt)}</span>
                                {item.source && (
                                  <span className="flex items-center gap-0.5">
                                    <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                                    {item.source}
                                  </span>
                                )}
                                {item.href && (
                                  <span className="flex items-center gap-0.5 text-primary hover:underline">
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    عرض
                                  </span>
                                )}
                              </div>

                              {/* Unread dot */}
                              {!item.read && (
                                <span className={cn('absolute top-3 left-8 h-2 w-2 rounded-full', config.dot)} />
                              )}
                            </div>
                          </div>
                        </div>
                      );

                      if (item.href) {
                        return (
                          <Link key={item.id} href={item.href} onClick={() => { handleClick(item); setOpen(false); }}>
                            {content}
                          </Link>
                        );
                      }
                      return <div key={item.id}>{content}</div>;
                    })}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">لا توجد إشعارات</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر هنا تنبيهات السوق والمحفظة</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
