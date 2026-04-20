/**
 * Market Hub — Server-side Fetcher
 *
 * مسؤول عن:
 *   - استدعاء الـ upstream route المناسب لكل نطاق.
 *   - تطبيع الاستجابة إلى `MarketQuote`.
 *   - طبقة تخزين مؤقت خفيفة في الذاكرة (in-memory) بمفتاح (domain+symbols).
 *
 * يُستخدم من `/api/market-hub/route.ts` ومن أي Route Handler آخر يحتاج
 * بيانات سوق دون تكرار منطق الجلب.
 */

import {
  adaptForexResponse,
  adaptFundsResponse,
  adaptPricesResponse,
  adaptRealPricesResponse,
  adaptTickerResponse,
} from './adapters';
import { MARKET_DOMAINS } from './registry';
import type { MarketDomain, MarketQuote } from './types';

interface CacheEntry {
  at: number;
  ttlMs: number;
  data: Record<string, MarketQuote>;
}

const CACHE = new Map<string, CacheEntry>();

function cacheKey(domain: MarketDomain, symbols?: string[]): string {
  const s = symbols && symbols.length > 0 ? symbols.slice().sort().join(',') : '*';
  return `${domain}::${s}`;
}

function baseUrl(): string {
  // في بيئة Node.js داخل Next API route، نحتاج URL مطلقاً للـ fetch.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const port = process.env.PORT || '3333';
  return `http://localhost:${port}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`upstream ${res.status} for ${url}`);
  return res.json();
}

/**
 * النقطة الرئيسية: جلب بيانات نطاق ما من المصدر الخلفي المسجّل في الـ registry.
 */
export async function fetchDomain(
  domain: MarketDomain,
  options: { symbols?: string[]; fresh?: boolean } = {},
): Promise<Record<string, MarketQuote>> {
  const entry = MARKET_DOMAINS[domain];
  if (!entry) return {};

  const key = cacheKey(domain, options.symbols);
  const now = Date.now();
  const cached = CACHE.get(key);
  if (!options.fresh && cached && now - cached.at < cached.ttlMs) {
    return cached.data;
  }

  const base = baseUrl();
  const qs = new URLSearchParams();
  if (entry.pricesCategory) qs.set('category', entry.pricesCategory);
  if (options.symbols && options.symbols.length > 0) {
    qs.set('symbols', options.symbols.join(','));
  }

  const url = `${base}${entry.sourceEndpoint}${qs.toString() ? `?${qs}` : ''}`;

  let normalized: Record<string, MarketQuote> = {};
  try {
    const raw = await fetchJson(url);
    switch (entry.sourceEndpoint) {
      case '/api/prices':
      case '/api/live-prices':
        normalized = adaptPricesResponse(raw, domain);
        break;
      case '/api/ticker':
        normalized = adaptTickerResponse(raw, domain);
        break;
      case '/api/forex':
        normalized = adaptForexResponse(raw);
        break;
      case '/api/real-prices':
        normalized = adaptRealPricesResponse(raw, domain);
        break;
      case '/api/funds':
        normalized = adaptFundsResponse(raw, domain);
        break;
      default:
        normalized = adaptPricesResponse(raw, domain);
    }
  } catch {
    // لا نكسر المستدعي — نعيد ما لدينا سابقاً (إن وجد).
    if (cached) return cached.data;
    return {};
  }

  CACHE.set(key, { at: now, ttlMs: Math.max(10_000, entry.refreshMs / 2), data: normalized });
  return normalized;
}

/** تفريغ الكاش (يستخدم في الاختبارات وفي أدوات الإدارة). */
export function clearMarketHubCache(): void {
  CACHE.clear();
}
