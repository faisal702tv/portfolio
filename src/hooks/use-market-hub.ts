'use client';

/**
 * useMarketHub — Unified React Hook
 *
 * الهدف: يستهلك `/api/market-hub` بحيث لا تحتاج أي صفحة لمعرفة الـ endpoint
 * الخلفي الفعلي. التغييرات المستقبلية في الـ API لا تتطلب لمس الصفحات.
 *
 * الميزات:
 *   - كاش مشترك في الذاكرة (singleton) لإلغاء تكرار الطلبات بين الصفحات.
 *   - اشتراك (subscription) بين المكوّنات: كلها تشترك في نفس مفتاح النطاق.
 *   - تحديث تلقائي بفاصل من registry (أو override).
 *   - إعادة تحميل يدوية عبر `refresh()`.
 *
 * الاستخدام:
 *   const { data, quotes, loading, refresh, lastUpdate } =
 *     useMarketHub({ domain: 'crypto' });
 *
 *   // مع رموز محددة:
 *   useMarketHub({ domain: 'stocks', symbols: ['2222.SR', 'AAPL'] });
 *
 *   // عدة نطاقات في نفس الصفحة (مثال لوحة التحكم):
 *   useMarketHub({ domain: 'indices' });
 *   useMarketHub({ domain: 'crypto' });
 *   useMarketHub({ domain: 'forex' });
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MARKET_DOMAINS,
  type MarketDomain,
  type MarketHubResponse,
  type MarketQuote,
} from '@/lib/market-hub';

interface UseMarketHubOptions {
  domain: MarketDomain;
  symbols?: string[];
  /** تجاوز الفاصل الافتراضي من الـ registry (ms). 0 لتعطيل التحديث. */
  refreshMs?: number;
  /** هل نجلب عند التهيئة (افتراضي true). */
  immediate?: boolean;
}

interface UseMarketHubReturn {
  /** البيانات الخام كقاموس symbol → quote. */
  data: Record<string, MarketQuote>;
  /** اختصار كمصفوفة مرتّبة. */
  quotes: MarketQuote[];
  loading: boolean;
  error: string | null;
  refresh: (opts?: { fresh?: boolean }) => Promise<void>;
  lastUpdate: Date | null;
}

// ===== Shared in-memory store (singleton across hook instances) =====

interface StoreEntry {
  data: Record<string, MarketQuote>;
  lastUpdate: number;
  inflight: Promise<void> | null;
  subscribers: Set<() => void>;
}

const STORE = new Map<string, StoreEntry>();

function storeKey(domain: MarketDomain, symbols?: string[]): string {
  const s = symbols && symbols.length > 0 ? symbols.slice().sort().join(',') : '*';
  return `${domain}::${s}`;
}

function ensureEntry(key: string): StoreEntry {
  let entry = STORE.get(key);
  if (!entry) {
    entry = { data: {}, lastUpdate: 0, inflight: null, subscribers: new Set() };
    STORE.set(key, entry);
  }
  return entry;
}

async function fetchInto(
  entry: StoreEntry,
  domain: MarketDomain,
  symbols: string[] | undefined,
  fresh: boolean,
): Promise<void> {
  if (entry.inflight) return entry.inflight;
  const qs = new URLSearchParams({ domain });
  if (symbols && symbols.length > 0) qs.set('symbols', symbols.join(','));
  if (fresh) qs.set('fresh', '1');

  const p = (async () => {
    try {
      const res = await fetch(`/api/market-hub?${qs}`, { cache: 'no-store' });
      const body = (await res.json()) as MarketHubResponse;
      if (body.success) {
        entry.data = body.data;
        entry.lastUpdate = body.timestamp;
      }
    } catch {
      // نحتفظ بالبيانات السابقة عند الفشل.
    } finally {
      entry.inflight = null;
      entry.subscribers.forEach((fn) => fn());
    }
  })();
  entry.inflight = p;
  return p;
}

export function useMarketHub(options: UseMarketHubOptions): UseMarketHubReturn {
  const { domain, symbols, refreshMs, immediate = true } = options;

  const interval = refreshMs ?? MARKET_DOMAINS[domain].refreshMs;
  const key = useMemo(() => storeKey(domain, symbols), [domain, symbols]);
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  const entry = ensureEntry(key);
  const [, forceRender] = useState(0);
  const [loading, setLoading] = useState<boolean>(immediate && entry.lastUpdate === 0);
  const [error, setError] = useState<string | null>(null);

  // اشتراك: أي تحديث للـ store يعيد الرسم.
  useEffect(() => {
    const e = ensureEntry(key);
    const notify = () => forceRender((n) => n + 1);
    e.subscribers.add(notify);
    return () => {
      e.subscribers.delete(notify);
    };
  }, [key]);

  const refresh = useCallback(
    async (opts: { fresh?: boolean } = {}) => {
      const e = ensureEntry(key);
      setLoading(e.lastUpdate === 0);
      try {
        await fetchInto(e, domain, symbolsRef.current, Boolean(opts.fresh));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'fetch failed');
      } finally {
        setLoading(false);
      }
    },
    [key, domain],
  );

  // الجلب الأوّلي + التحديث التلقائي.
  useEffect(() => {
    if (!immediate) return;
    void refresh();
    if (!interval || interval <= 0) return;
    const t = setInterval(() => {
      void refresh({ fresh: true });
    }, interval);
    return () => clearInterval(t);
  }, [refresh, interval, immediate]);

  const liveEntry = STORE.get(key);
  const data = liveEntry?.data ?? {};
  const quotes = useMemo(() => Object.values(data), [data]);
  const lastUpdate = liveEntry?.lastUpdate ? new Date(liveEntry.lastUpdate) : null;

  return { data, quotes, loading, error, refresh, lastUpdate };
}

/** مساعدة: جلب سعر واحد من أي نطاق. */
export function useMarketQuote(
  domain: MarketDomain,
  symbol: string,
): { quote: MarketQuote | null; loading: boolean } {
  const { data, loading } = useMarketHub({ domain, symbols: [symbol] });
  return { quote: data[symbol] ?? null, loading };
}
