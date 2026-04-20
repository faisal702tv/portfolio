/**
 * Market Hub — Response Adapters
 *
 * محوّلات تأخذ استجابات الـ API الحالية المتفرقة وتطبعها على `MarketQuote`
 * الموحّد. لو تغيّر endpoint خلفي، نعدّل محوّله هنا فقط — الصفحات لا تعلم.
 */

import type { MarketDomain, MarketQuote } from './types';

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function numOr(value: unknown, fallback = 0): number {
  const n = num(value);
  return n ?? fallback;
}

function str(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s.length === 0 ? undefined : s;
}

/** محوّل استجابات `/api/prices` و `/api/live-prices` (نفس الشكل). */
export function adaptPricesResponse(
  raw: unknown,
  domain: MarketDomain,
): Record<string, MarketQuote> {
  const out: Record<string, MarketQuote> = {};
  if (!raw || typeof raw !== 'object') return out;
  const data = (raw as { data?: Record<string, unknown> }).data;
  if (!data) return out;

  for (const [symbol, entry] of Object.entries(data)) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const price = numOr(e.price);
    out[symbol] = {
      symbol,
      name: str(e.name),
      price,
      change: num(e.change),
      changePct: num(e.changePct ?? e.change_pct),
      high: num(e.high),
      low: num(e.low),
      high52w: num(e.high52w ?? e.fiftyTwoWeekHigh),
      low52w: num(e.low52w ?? e.fiftyTwoWeekLow),
      volume: num(e.volume),
      averageVolume: num(e.averageVolume ?? e.averageVolume10Day),
      marketCap: num(e.marketCap),
      currency: str(e.currency),
      exchange: str(e.exchange),
      domain,
      source: str(e.source) ?? null,
      live: Boolean(e.live ?? e.source),
      lastUpdate: numOr(e.lastUpdate, Date.now()),
    };
  }
  return out;
}

/** محوّل `/api/ticker` — قد يعود بمصفوفات بدلاً من قواميس. */
export function adaptTickerResponse(
  raw: unknown,
  domain: MarketDomain,
): Record<string, MarketQuote> {
  const out: Record<string, MarketQuote> = {};
  if (!raw || typeof raw !== 'object') return out;

  // شكلان محتملان:
  //   1) { success, data: { [symbol]: {...} } }
  //   2) { indices: [...], stocks: [...], commodities: [...] }
  const obj = raw as Record<string, unknown>;
  const dictShape = (obj.data ?? obj.quotes) as
    | Record<string, unknown>
    | undefined;
  if (dictShape && typeof dictShape === 'object') {
    return adaptPricesResponse({ data: dictShape }, domain);
  }

  const arrays: unknown[] = [];
  for (const key of ['indices', 'stocks', 'commodities', 'forex', 'items']) {
    const v = obj[key];
    if (Array.isArray(v)) arrays.push(...v);
  }
  for (const item of arrays) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const symbol = str(e.symbol ?? e.yahoo ?? e.code);
    if (!symbol) continue;
    out[symbol] = {
      symbol,
      name: str(e.name),
      price: numOr(e.price),
      change: num(e.change),
      changePct: num(e.changePct ?? e.change_pct),
      high: num(e.high),
      low: num(e.low),
      high52w: num(e.high52w ?? e.fiftyTwoWeekHigh),
      low52w: num(e.low52w ?? e.fiftyTwoWeekLow),
      volume: num(e.volume),
      marketCap: num(e.marketCap),
      currency: str(e.currency),
      exchange: str(e.exchange),
      domain,
      source: str(e.source) ?? null,
      live: Boolean(e.live ?? e.source),
      lastUpdate: numOr(e.lastUpdate, Date.now()),
    };
  }
  return out;
}

/** محوّل `/api/forex`. */
export function adaptForexResponse(raw: unknown): Record<string, MarketQuote> {
  return adaptTickerResponse(raw, 'forex');
}

/** محوّل `/api/real-prices?type=crypto`. */
export function adaptRealPricesResponse(
  raw: unknown,
  domain: MarketDomain,
): Record<string, MarketQuote> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  // `/api/real-prices` قد يعود بمصفوفة مباشرة أو كائن data
  if (Array.isArray(r.data)) {
    return adaptTickerResponse({ items: r.data }, domain);
  }
  if (Array.isArray(r.prices)) {
    return adaptTickerResponse({ items: r.prices }, domain);
  }
  return adaptPricesResponse(raw, domain);
}

/** محوّل `/api/funds` — يُستخدم للصناديق، الصكوك، السندات، REITs. */
export function adaptFundsResponse(
  raw: unknown,
  domain: MarketDomain,
): Record<string, MarketQuote> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const candidates: unknown[] = [];
  for (const key of ['funds', 'sukuk', 'bonds', 'reits', 'etfs', 'items', 'data']) {
    const v = r[key];
    if (Array.isArray(v)) candidates.push(...v);
  }
  if (candidates.length === 0 && Array.isArray(r)) candidates.push(...(r as unknown[]));
  const out: Record<string, MarketQuote> = {};
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const symbol = str(e.symbol ?? e.code ?? e.id);
    if (!symbol) continue;
    out[symbol] = {
      symbol,
      name: str(e.name ?? e.title),
      price: numOr(e.price ?? e.nav ?? e.value),
      change: num(e.change),
      changePct: num(e.changePct ?? e.change_pct ?? e.yield),
      domain,
      currency: str(e.currency),
      source: str(e.source) ?? null,
      live: Boolean(e.live),
      lastUpdate: numOr(e.lastUpdate, Date.now()),
    };
  }
  return out;
}
