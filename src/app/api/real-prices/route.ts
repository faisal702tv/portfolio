import { NextResponse } from 'next/server';

// Real-time prices from live APIs
interface PriceInfo {
  price: number;
  change: number;
  changePct: number;
  source: string;
  lastUpdate: number;
}

// Fetch Crypto prices from CoinGecko (Free, reliable)
async function fetchCryptoPrices(): Promise<Record<string, PriceInfo>> {
  const results: Record<string, PriceInfo> = {};
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h',
      { 
        next: { revalidate: 30 },
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (response.ok) {
      const coins = await response.json();
      
      for (const coin of coins) {
        results[coin.symbol.toUpperCase()] = {
          price: coin.current_price,
          change: coin.price_change_24h || 0,
          changePct: coin.price_change_percentage_24h || 0,
          source: 'CoinGecko',
          lastUpdate: Date.now()
        };
      }
    }
  } catch (error) {
    console.error('Crypto fetch error:', error);
  }
  
  return results;
}

// Fetch Forex rates with change data from Yahoo Finance
async function fetchForexRates(): Promise<Record<string, PriceInfo>> {
  const results: Record<string, PriceInfo> = {};
  const now = Date.now();

  // Yahoo symbols for forex
  const forexMap: Record<string, string> = {
    'EURUSD=X': 'EURUSD', 'GBPUSD=X': 'GBPUSD', 'USDJPY=X': 'USDJPY',
    'USDCHF=X': 'USDCHF', 'AUDUSD=X': 'AUDUSD', 'USDCAD=X': 'USDCAD',
    'NZDUSD=X': 'NZDUSD', 'EURGBP=X': 'EURGBP', 'EURJPY=X': 'EURJPY',
    'GBPJPY=X': 'GBPJPY', 'SAR=X': 'USDSAR', 'AED=X': 'USDAED',
  };
  const yahooSymbols = Object.keys(forexMap).join(',');

  // Try Yahoo Finance for real change data
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const quotes = data?.quoteResponse?.result || [];
      for (const q of quotes) {
        const ourKey = forexMap[q.symbol];
        if (ourKey && q.regularMarketPrice) {
          results[ourKey] = {
            price: q.regularMarketPrice,
            change: q.regularMarketChange ?? 0,
            changePct: q.regularMarketChangePercent ?? 0,
            source: 'Yahoo Finance',
            lastUpdate: now,
          };
        }
      }
    }
  } catch { /* fallback below */ }

  // Fallback: ExchangeRate-API (no change data, but at least prices)
  if (Object.keys(results).length < 3) {
    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { next: { revalidate: 60 } }
      );
      if (response.ok) {
        const data = await response.json();
        const fallback: Record<string, number> = {
          'EURUSD': data.rates.EUR, 'GBPUSD': data.rates.GBP,
          'USDJPY': 1 / data.rates.JPY, 'USDCHF': 1 / data.rates.CHF,
          'AUDUSD': data.rates.AUD, 'USDCAD': 1 / data.rates.CAD,
          'NZDUSD': data.rates.NZD, 'USDSAR': 1 / data.rates.SAR,
          'USDAED': 1 / data.rates.AED,
        };
        for (const [key, price] of Object.entries(fallback)) {
          if (!results[key]) {
            results[key] = {
              price: parseFloat(price.toFixed(4)),
              change: 0,
              changePct: 0,
              source: 'ExchangeRate-API',
              lastUpdate: now,
            };
          }
        }
      }
    } catch (error) {
      console.error('Forex fallback error:', error);
    }
  }

  return results;
}

// Fetch global crypto market data
async function fetchGlobalMarketData(): Promise<Record<string, PriceInfo>> {
  const results: Record<string, PriceInfo> = {};
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/global',
      { next: { revalidate: 60 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const now = Date.now();
      
      results['TOTAL_MCAP'] = {
        price: data.data.total_market_cap.usd,
        change: 0,
        changePct: data.data.market_cap_change_percentage_24h_usd,
        source: 'CoinGecko',
        lastUpdate: now
      };
      
      results['BTC_DOM'] = {
        price: data.data.market_cap_percentage.btc,
        change: 0,
        changePct: 0,
        source: 'CoinGecko',
        lastUpdate: now
      };
      
      results['ETH_DOM'] = {
        price: data.data.market_cap_percentage.eth,
        change: 0,
        changePct: 0,
        source: 'CoinGecko',
        lastUpdate: now
      };
    }
  } catch (error) {
    console.error('Global market fetch error:', error);
  }
  
  return results;
}

// Fetch trending coins
async function fetchTrendingCoins(): Promise<PriceInfo[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      { next: { revalidate: 300 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.coins.map((c: any) => ({
        price: c.item.market_cap_rank || 0,
        change: 0,
        changePct: 0,
        source: 'CoinGecko Trending',
        lastUpdate: Date.now()
      }));
    }
  } catch (error) {
    console.error('Trending fetch error:', error);
  }
  
  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'crypto', 'forex', 'all'
  
  try {
    const allPrices: Record<string, PriceInfo> = {};
    
    // Fetch all data in parallel
    const [crypto, forex, global] = await Promise.all([
      type === 'forex' ? Promise.resolve({}) : fetchCryptoPrices(),
      type === 'crypto' ? Promise.resolve({}) : fetchForexRates(),
      fetchGlobalMarketData()
    ]);
    
    // Merge all results
    Object.assign(allPrices, crypto, forex, global);
    
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      count: Object.keys(allPrices).length,
      data: allPrices
    });
    
  } catch (error) {
    console.error('Real prices API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch real-time prices',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
