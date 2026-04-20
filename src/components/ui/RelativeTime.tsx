'use client';

import { useSyncExternalStore } from 'react';

interface RelativeTimeProps {
  date: Date | string;
  className?: string;
}

// Helper to format relative time
function formatRelativeTime(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;

  return d.toLocaleDateString('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Store for client-side time updates
let listeners: Array<() => void> = [];
let timeValue = 0;

function subscribe(callback: () => void) {
  listeners.push(callback);
  // Start interval only once
  if (listeners.length === 1) {
    const interval = setInterval(() => {
      timeValue++;
      listeners.forEach(l => l());
    }, 60000);
    // Store cleanup function
    return () => {
      listeners = listeners.filter(l => l !== callback);
      if (listeners.length === 0) {
        clearInterval(interval);
      }
    };
  }
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

function getSnapshot() {
  return timeValue;
}

function getServerSnapshot() {
  return -1;
}

// Client-side only relative time component to avoid hydration mismatch
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const timeCounter = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Return placeholder on server to avoid hydration mismatch
  if (timeCounter === -1) {
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formatRelativeTime(date)}</span>;
}
