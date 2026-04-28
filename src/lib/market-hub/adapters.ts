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

function obj(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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
      averageVolume: num(e.averageVolume),
      averageVolume10Day: num(e.averageVolume10Day ?? e.averageDailyVolume10Day),
      shortRatio: num(e.shortRatio),
      shortPercentOfFloat: num(e.shortPercentOfFloat),
      sharesShort: num(e.sharesShort),
      sharesOutstanding: num(e.sharesOutstanding),
      floatShares: num(e.floatShares),
      shortDataSource: str(e.shortDataSource) ?? null,
      marketCap: num(e.marketCap),
      currency: str(e.currency),
      exchange: str(e.exchange),
      domain,
      source: str(e.source ?? e.shortDataSource) ?? null,
      live: Boolean(e.live ?? e.source ?? e.shortDataSource),
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
      averageVolume: num(e.averageVolume),
      averageVolume10Day: num(e.averageVolume10Day ?? e.averageDailyVolume10Day),
      shortRatio: num(e.shortRatio),
      shortPercentOfFloat: num(e.shortPercentOfFloat),
      sharesShort: num(e.sharesShort),
      sharesOutstanding: num(e.sharesOutstanding),
      floatShares: num(e.floatShares),
      shortDataSource: str(e.shortDataSource) ?? null,
      marketCap: num(e.marketCap),
      currency: str(e.currency),
      exchange: str(e.exchange),
      domain,
      source: str(e.source ?? e.shortDataSource) ?? null,
      live: Boolean(e.live ?? e.source ?? e.shortDataSource),
      lastUpdate: numOr(e.lastUpdate, Date.now()),
    };
  }
  return out;
}

/** محوّل `/api/forex`. */
export function adaptForexResponse(raw: unknown): Record<string, MarketQuote> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;

  const categories = obj(r.categories);
  if (!categories) {
    return adaptTickerResponse(raw, 'forex');
  }

  const out: Record<string, MarketQuote> = {};
  const now = Date.now();
  const quoteAliasBySuffix: Record<string, string> = {
    SAR: 'SAR=X',
    AED: 'AED=X',
    KWD: 'KWD=X',
    EGP: 'EGP=X',
    TRY: 'TRY=X',
    CNY: 'CNY=X',
    INR: 'INR=X',
    MXN: 'MXN=X',
    ZAR: 'ZAR=X',
    JOD: 'JOD=X',
    BHD: 'BHD=X',
    OMR: 'OMR=X',
    QAR: 'QAR=X',
  };

  for (const catValue of Object.values(categories)) {
    const catObj = obj(catValue);
    const pairs = catObj && Array.isArray(catObj.pairs) ? catObj.pairs : [];
    for (const pair of pairs) {
      const e = obj(pair);
      if (!e) continue;
      const symbol = str(e.symbol)?.toUpperCase();
      if (!symbol) continue;

      const base = str(e.baseCurrency)?.toUpperCase() || (symbol.length >= 6 ? symbol.slice(0, 3) : undefined);
      const quote = str(e.quoteCurrency)?.toUpperCase() || (symbol.length >= 6 ? symbol.slice(3, 6) : undefined);
      const yahooLike = base && quote ? `${base}${quote}=X` : undefined;
      const shortAlias = base === 'USD' && quote ? quoteAliasBySuffix[quote] : undefined;
      const candidateKeys = [symbol, yahooLike, shortAlias].filter((v): v is string => Boolean(v));

      for (const key of candidateKeys) {
        out[key] = {
          symbol: key,
          name: str(e.name) ?? (base && quote ? `${base}/${quote}` : symbol),
          price: numOr(e.price),
          change: num(e.change),
          changePct: num(e.changePct ?? e.change_pct),
          high: num(e.high),
          low: num(e.low),
          currency: quote,
          exchange: 'FOREX',
          domain: 'forex',
          source: str(e.source) ?? 'forex_api',
          live: Boolean(e.isLive ?? true),
          lastUpdate: numOr(e.lastUpdate, now),
        };
      }
    }
  }

  if (Object.keys(out).length > 0) return out;
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

  const candidates: Array<{ value: unknown; fallbackSymbol?: string }> = [];
  const pushCandidates = (value: unknown, fallbackPrefix?: string) => {
    if (Array.isArray(value)) {
      value.forEach((entry, idx) => {
        candidates.push({
          value: entry,
          fallbackSymbol: fallbackPrefix ? `${fallbackPrefix}_${idx + 1}` : undefined,
        });
      });
      return;
    }
    const rec = obj(value);
    if (!rec) return;
    for (const [key, entry] of Object.entries(rec)) {
      candidates.push({
        value: entry,
        fallbackSymbol: fallbackPrefix ? `${fallbackPrefix}_${key}` : key,
      });
    }
  };

  pushCandidates(r.items, 'ITEM');
  pushCandidates(r.data, 'DATA');
  pushCandidates(r.bonds, 'BOND');
  pushCandidates(r.etfs, 'ETF');
  pushCandidates(r.reits, 'REIT');

  const fundsObj = obj(r.funds);
  if (fundsObj) {
    for (const [region, list] of Object.entries(fundsObj)) {
      pushCandidates(list, `FUND_${region.toUpperCase()}`);
    }
  } else {
    pushCandidates(r.funds, 'FUND');
  }

  const sukukObj = obj(r.sukuk);
  if (sukukObj) {
    for (const [bucket, list] of Object.entries(sukukObj)) {
      pushCandidates(list, `SUKUK_${bucket.toUpperCase()}`);
    }
  } else {
    pushCandidates(r.sukuk, 'SUKUK');
  }

  if (candidates.length === 0 && Array.isArray(raw)) {
    raw.forEach((entry, idx) => candidates.push({ value: entry, fallbackSymbol: `ITEM_${idx + 1}` }));
  }

  const out: Record<string, MarketQuote> = {};
  for (const candidate of candidates) {
    const e = obj(candidate.value);
    if (!e) continue;
    const symbol = str(e.symbol ?? e.code ?? e.id ?? candidate.fallbackSymbol);
    if (!symbol) continue;
    out[symbol] = {
      symbol,
      name: str(e.name ?? e.title ?? e.nameEn),
      price: numOr(e.price ?? e.nav ?? e.value),
      change: num(e.change),
      changePct: num(e.changePct ?? e.change_pct ?? e.yield),
      domain,
      currency: str(e.currency),
      exchange: str(e.exchange),
      source: str(e.source) ?? null,
      live: Boolean(e.live ?? e.isLive ?? true),
      lastUpdate: numOr(e.lastUpdate, Date.now()),
    };
  }
  return out;
}
