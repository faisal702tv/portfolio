import { NextRequest, NextResponse } from 'next/server';

// ================================
// MASSIVE.COM API INTEGRATION
// https://massive.com/docs
// Stocks, Options, Forex, Crypto, Indices, Futures — 200+ endpoints
// ================================

const MASSIVE_BASE = 'https://api.massive.com';

function getMassiveKey(req: NextRequest): string {
  // Check header first, then query param
  const headerKey = req.headers.get('x-massive-key') || '';
  if (headerKey) return headerKey;
  const url = new URL(req.url);
  return url.searchParams.get('apiKey') || '';
}

// GET /api/massive?action=snapshot&ticker=AAPL
// GET /api/massive?action=bars&ticker=AAPL&timespan=day&from=2024-01-01&to=2024-12-31
// GET /api/massive?action=quote&ticker=AAPL
// GET /api/massive?action=tickers&search=Apple
// GET /api/massive?action=news&ticker=AAPL
// GET /api/massive?action=fundamentals&ticker=AAPL&type=income
// GET /api/massive?action=indicators&ticker=AAPL&indicator=sma&window=20
// GET /api/massive?action=forex&pair=USD/SAR
// GET /api/massive?action=crypto&ticker=BTC
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const apiKey = getMassiveKey(req);
  const action = url.searchParams.get('action') || 'snapshot';
  const ticker = url.searchParams.get('ticker') || '';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'مفتاح Massive API مطلوب — أضفه من صفحة الإعدادات', errorEn: 'Massive API key required' },
      { status: 401 }
    );
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
  };

  try {
    let endpoint = '';

    switch (action) {
      // ─── Stocks ─────────────────────────────────────
      case 'snapshot': {
        endpoint = ticker
          ? `/v1/stocks/snapshots/${encodeURIComponent(ticker)}`
          : '/v1/stocks/snapshots';
        break;
      }
      case 'bars': {
        const timespan = url.searchParams.get('timespan') || 'day';
        const from = url.searchParams.get('from') || '';
        const to = url.searchParams.get('to') || '';
        const limit = url.searchParams.get('limit') || '365';
        endpoint = `/v1/stocks/aggregates/${encodeURIComponent(ticker)}?timespan=${timespan}&from=${from}&to=${to}&limit=${limit}`;
        break;
      }
      case 'quote': {
        endpoint = `/v1/stocks/quotes/${encodeURIComponent(ticker)}`;
        break;
      }
      case 'trade': {
        endpoint = `/v1/stocks/trades/${encodeURIComponent(ticker)}`;
        break;
      }
      case 'tickers': {
        const search = url.searchParams.get('search') || '';
        const market = url.searchParams.get('market') || '';
        endpoint = `/v1/stocks/tickers?search=${encodeURIComponent(search)}&market=${encodeURIComponent(market)}&limit=50`;
        break;
      }
      case 'movers': {
        const direction = url.searchParams.get('direction') || 'gainers';
        endpoint = `/v1/stocks/movers?direction=${direction}`;
        break;
      }

      // ─── News ───────────────────────────────────────
      case 'news': {
        const limit = url.searchParams.get('limit') || '20';
        endpoint = ticker
          ? `/v1/stocks/news?ticker=${encodeURIComponent(ticker)}&limit=${limit}`
          : `/v1/stocks/news?limit=${limit}`;
        break;
      }

      // ─── Fundamentals ──────────────────────────────
      case 'fundamentals': {
        const type = url.searchParams.get('type') || 'income';
        const typeMap: Record<string, string> = {
          income: 'income-statements',
          balance: 'balance-sheets',
          cashflow: 'cash-flow',
          ratios: 'ratios',
          short_interest: 'short-interest',
          short_volume: 'short-volume',
          float: 'float',
        };
        endpoint = `/v1/stocks/fundamentals/${typeMap[type] || type}/${encodeURIComponent(ticker)}`;
        break;
      }

      // ─── Corporate Actions ─────────────────────────
      case 'dividends': {
        endpoint = `/v1/stocks/dividends/${encodeURIComponent(ticker)}`;
        break;
      }
      case 'splits': {
        endpoint = `/v1/stocks/splits/${encodeURIComponent(ticker)}`;
        break;
      }
      case 'ipos': {
        endpoint = '/v1/stocks/ipos';
        break;
      }

      // ─── Technical Indicators ──────────────────────
      case 'indicators': {
        const indicator = url.searchParams.get('indicator') || 'sma';
        const window = url.searchParams.get('window') || '20';
        const timespan = url.searchParams.get('timespan') || 'day';
        endpoint = `/v1/stocks/indicators/${indicator}/${encodeURIComponent(ticker)}?window=${window}&timespan=${timespan}`;
        break;
      }

      // ─── SEC Filings ───────────────────────────────
      case 'filings': {
        const filingType = url.searchParams.get('filing_type') || '';
        endpoint = `/v1/stocks/filings/${encodeURIComponent(ticker)}?type=${filingType}`;
        break;
      }

      // ─── Options ───────────────────────────────────
      case 'options': {
        endpoint = `/v1/options/contracts/${encodeURIComponent(ticker)}`;
        break;
      }
      case 'options_snapshot': {
        endpoint = `/v1/options/snapshots/${encodeURIComponent(ticker)}`;
        break;
      }

      // ─── Forex ─────────────────────────────────────
      case 'forex': {
        const pair = url.searchParams.get('pair') || ticker;
        endpoint = `/v1/forex/snapshots/${encodeURIComponent(pair)}`;
        break;
      }
      case 'forex_convert': {
        const from = url.searchParams.get('from') || 'USD';
        const to = url.searchParams.get('to') || 'SAR';
        const amount = url.searchParams.get('amount') || '1';
        endpoint = `/v1/forex/conversion?from=${from}&to=${to}&amount=${amount}`;
        break;
      }

      // ─── Crypto ────────────────────────────────────
      case 'crypto': {
        endpoint = `/v1/crypto/snapshots/${encodeURIComponent(ticker || 'BTC')}`;
        break;
      }
      case 'crypto_bars': {
        const timespan = url.searchParams.get('timespan') || 'day';
        endpoint = `/v1/crypto/aggregates/${encodeURIComponent(ticker)}?timespan=${timespan}`;
        break;
      }

      // ─── Indices ───────────────────────────────────
      case 'indices': {
        endpoint = ticker
          ? `/v1/indices/snapshots/${encodeURIComponent(ticker)}`
          : '/v1/indices/snapshots';
        break;
      }

      // ─── Futures ───────────────────────────────────
      case 'futures': {
        endpoint = ticker
          ? `/v1/futures/snapshots/${encodeURIComponent(ticker)}`
          : '/v1/futures/snapshots';
        break;
      }

      // ─── Economy ───────────────────────────────────
      case 'treasury': {
        endpoint = '/v1/economy/treasury-yields';
        break;
      }
      case 'inflation': {
        endpoint = '/v1/economy/inflation';
        break;
      }

      // ─── Market Status ─────────────────────────────
      case 'market_status': {
        endpoint = '/v1/stocks/market-status';
        break;
      }
      case 'market_holidays': {
        endpoint = '/v1/stocks/market-holidays';
        break;
      }

      default:
        return NextResponse.json(
          { error: `إجراء غير معروف: ${action}`, errorEn: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const res = await fetch(`${MASSIVE_BASE}${endpoint}`, { headers, next: { revalidate: 30 } });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `خطأ Massive API: ${res.status}`, errorEn: `Massive API error: ${res.status}`, details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, action, ticker, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل الاتصال بـ Massive API', errorEn: 'Failed to connect to Massive API', details: String(error) },
      { status: 500 }
    );
  }
}
