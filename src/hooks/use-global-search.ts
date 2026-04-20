'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface SearchResult {
  id: string;
  type: 'stock' | 'portfolio' | 'page' | 'action';
  title: string;
  subtitle?: string;
  icon?: string;
  href: string;
  keywords?: string[];
}

/**
 * Global search hook that searches across stocks, portfolios, and pages.
 */
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Pages/actions that are always available
  const staticItems: SearchResult[] = [
    { id: 'page-dashboard', type: 'page', title: 'لوحة التحكم', href: '/' },
    { id: 'page-portfolios', type: 'page', title: 'المحافظ', href: '/portfolios' },
    { id: 'page-stocks', type: 'page', title: 'الأسهم', href: '/stocks' },
    { id: 'page-watchlist', type: 'page', title: 'قوائم المتابعة', href: '/watchlist' },
    { id: 'page-markets', type: 'page', title: 'الأسواق', href: '/markets' },
    { id: 'page-crypto', type: 'page', title: 'العملات الرقمية', href: '/crypto' },
    { id: 'page-forex', type: 'page', title: 'فوركس', href: '/forex' },
    { id: 'page-news', type: 'page', title: 'الأخبار', href: '/news' },
    { id: 'page-ai', type: 'page', title: 'تحليل الذكاء الاصطناعي', href: '/ai-analysis' },
    { id: 'page-screener', type: 'page', title: 'فيلتر الأسهم', href: '/screener' },
    { id: 'page-alerts', type: 'page', title: 'التنبيهات', href: '/alerts' },
    { id: 'page-calc', type: 'page', title: 'حاسبة الاستثمار', href: '/calculator' },
    { id: 'page-settings', type: 'page', title: 'الإعدادات', href: '/settings' },
  ];

  const search = useCallback((q: string) => {
    setQuery(q);
    setSelectedIndex(0);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    const lower = q.toLowerCase();

    // Search static items
    const matchedStatic = staticItems.filter(
      item => item.title.includes(q) || (item.keywords?.some(k => k.includes(lower)))
    );

    // TODO: Add API search for stocks, portfolios when available
    // For now, combine with local search
    setResults(matchedStatic);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, []);

  const selectItem = useCallback((item: SearchResult) => {
    router.push(item.href);
    close();
  }, [router, close]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            selectItem(results[selectedIndex]);
          }
          break;
        case 'Escape':
          close();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, selectItem, close]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, open, close]);

  return {
    query,
    setQuery,
    results,
    isOpen,
    open,
    close,
    selectItem,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    search,
  };
}
