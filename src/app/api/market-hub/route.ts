/**
 * Market Hub — Unified API Route
 *
 *   GET /api/market-hub?domain=crypto
 *   GET /api/market-hub?domain=stocks&symbols=2222.SR,AAPL,TSLA
 *   GET /api/market-hub?domain=all           // كل النطاقات
 *   GET /api/market-hub?domain=crypto&fresh=1 // تجاوز الكاش
 *
 * هذا هو الـ endpoint الوحيد الذي يجب أن تستدعيه الصفحات من الآن فصاعداً.
 * داخلياً يوجّه كل نطاق إلى مصدره الفعلي عبر `lib/market-hub/server.ts`،
 * فإذا تغيّر المصدر لاحقاً، الصفحات لا تحتاج أي تعديل.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ALL_DOMAINS,
  MARKET_DOMAINS,
  isKnownDomain,
  fetchDomain,
  type MarketDomain,
  type MarketHubResponse,
  type MarketQuote,
} from '@/lib/market-hub';

export const dynamic = 'force-dynamic';

function parseSymbols(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainParam = (searchParams.get('domain') || 'all').toLowerCase();
  const symbols = parseSymbols(searchParams.get('symbols'));
  const fresh = searchParams.get('fresh') === '1' || searchParams.get('fresh') === 'true';

  if (domainParam !== 'all' && !isKnownDomain(domainParam)) {
    const response: MarketHubResponse = {
      success: false,
      domain: 'all',
      cached: false,
      timestamp: Date.now(),
      count: 0,
      data: {},
      error: `unknown domain: ${domainParam}. valid: ${ALL_DOMAINS.join(', ')}`,
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    if (domainParam === 'all') {
      const merged: Record<string, MarketQuote> = {};
      await Promise.all(
        ALL_DOMAINS.map(async (d) => {
          const part = await fetchDomain(d, { fresh });
          for (const [k, v] of Object.entries(part)) {
            merged[`${d}:${k}`] = v;
          }
        }),
      );
      const response: MarketHubResponse = {
        success: true,
        domain: 'all',
        cached: !fresh,
        timestamp: Date.now(),
        count: Object.keys(merged).length,
        data: merged,
      };
      return NextResponse.json(response);
    }

    const domain = domainParam as MarketDomain;
    const data = await fetchDomain(domain, { symbols, fresh });
    const response: MarketHubResponse = {
      success: true,
      domain,
      cached: !fresh,
      timestamp: Date.now(),
      count: Object.keys(data).length,
      data,
    };
    // ترويسة تعريف مفيدة للمطوّر وللأدوات.
    return NextResponse.json(response, {
      headers: {
        'x-market-hub-domain': domain,
        'x-market-hub-source': MARKET_DOMAINS[domain].sourceEndpoint,
      },
    });
  } catch (error) {
    const response: MarketHubResponse = {
      success: false,
      domain: 'all',
      cached: false,
      timestamp: Date.now(),
      count: 0,
      data: {},
      error: error instanceof Error ? error.message : 'unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
