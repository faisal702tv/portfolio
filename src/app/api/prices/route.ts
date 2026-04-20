import { NextResponse } from 'next/server';

// ================================
// COMPREHENSIVE REAL-TIME PRICES API
// All Markets: Saudi, UAE, Kuwait, Qatar, Bahrain, Oman, Egypt, Jordan
// All Instruments: Stocks, Funds, Sukuk, Bonds, Commodities, Crypto, Forex
// ================================

interface LivePrice {
  price: number;
  change: number;
  changePct: number;
  high?: number;
  low?: number;
  high52w?: number | null;
  low52w?: number | null;
  volume?: number;
  averageVolume?: number;
  averageVolume10Day?: number;
  shortRatio?: number;
  shortPercentOfFloat?: number;
  marketCap?: number;
  source: string;
  lastUpdate: number;
}

// Cache
let cache: {
  data: Record<string, LivePrice>;
  timestamp: number;
} = { data: {}, timestamp: 0 };

const CACHE_DURATION = 30000;

// ========== ALL GULF & ARAB MARKETS ==========
const ARAB_STOCKS = {
  // 🇸🇦 SAUDI ARABIA - Tadawul
  saudi: [
    '2222.SR', // Aramco
    '1120.SR', // Al Rajhi Bank
    '7010.SR', // STC
    '2222.SR', // Kingdom Holding
    '2002.SR', // SABIC
    '4002.SR', // Riyad Bank
    '4180.SR', // Al Bilad
    '1060.SR', // Samba
    '4050.SR', // BSF
    '4160.SR', // ANB
    '4190.SR', // Al Jazira Bank
    '2020.SR', // SAFCO
    '2050.SR', // Yansab
    '2010.SR', // SIPC
    '6002.SR', // Savola
    '6010.SR', // Almarai
    '8070.SR', // Tawuniya
    '5110.SR', // SEC
    '7020.SR', // Mobily
    '7030.SR', // Zain Saudi
    '2380.SR', // Alinma REIT
    '4260.SR', // Alinma Bank
    '4150.SR', // Blom Bank
    '8110.SR', // Al Ahli Takaful
    '8040.SR', // BUPA Arabia
    '3001.SR', // Saudi Ceramic
    '2100.SR', // Saudi Cement
    '2110.SR', // Qassim Cement
    '4200.SR', // Al Othaim
    '4210.SR', // Almarai
  ],
  
  // 🇦🇪 UAE - Abu Dhabi (ADX)
  abuDhabi: [
    'ADCB.AD',   // Abu Dhabi Commercial Bank
    'FAB.AD',    // First Abu Dhabi Bank
    'ADIB.AD',   // Abu Dhabi Islamic Bank
    'ETISALAT.AD', // Etisalat
    'ALDAR.AD',  // Aldar Properties
    'ADNOC.AD',  // ADNOC Distribution
    'TAQA.AD',   // TAQA
    'RAKBNK.AD', // RAK Bank
    'UNB.AD',    // Union National Bank
    'WIO.AD',    // Waha Capital
    'AGTHIA.AD', // Agthia Group
    'FOOD.AD',   // Foodco Holding
    'JULPHAR.AD',// Julphar
    'ALDHABI.AD',// Al Dhabhaniya
    'EMIRATES.AD',// Emirates Driving
  ],
  
  // 🇦🇪 UAE - Dubai (DFM)
  dubai: [
    'EMAAR.DU',     // Emaar Properties
    'EMIRATESNBD.DU', // Emirates NBD
    'DIB.DU',       // Dubai Islamic Bank
    'DEWA.DU',      // DEWA
    'AIRARABIA.DU', // Air Arabia
    'ARAMEX.DU',    // Aramex
    'DAMAC.DU',     // Damac
    'DFM.DU',       // DFM
    'EMAARDEV.DU',  // Emaar Development
    'UNION.DU',     // Union Properties
    'TABREED.DU',   // Tabreed
    'SHUAA.DU',     // Shuaa Capital
    'GULFNAV.DU',   // Gulf Navigation
    'DPWORLD.DU',   // DP World
    'AJMANBANK.DU', // Ajman Bank
  ],
  
  // 🇰🇼 KUWAIT - Boursa Kuwait
  kuwait: [
    'NBK.KW',      // National Bank of Kuwait
    'KFH.KW',      // Kuwait Finance House
    'ZAIN.KW',     // Zain Kuwait
    'OOREDoo.KW',  // Ooredoo
    'AGILITY.KW',  // Agility
    'BOUBYAN.KW',  // Boubyan Bank
    'KUWAIT.KW',   // Kuwait Bank
    'GLBL.KW',     // Gulf Bank
    'AREEBA.KW',   // Areeba
    'MABANEE.KW',  // Mabanee
    'ALSHAYA.KW',  // Alshaya
    'MEZZAN.KW',   // Mezzan
    'HAVAL.KW',    // Human Holding
    'KPC.KW',      // Kuwait Petroleum
    'BURGAN.KW',   // Burgan Bank
  ],
  
  // 🇶🇦 QATAR - Qatar Stock Exchange
  qatar: [
    'QNBK.QA',     // Qatar National Bank
    'MARKA.QA',    // Masraf Al Rayan
    'QIIB.QA',     // QIIB
    'DOBK.QA',     // Doha Bank
    'CBQK.QA',     // Commercial Bank
    'QTEL.QA',     // Ooredoo Qatar
    'INDO.QA',     // Industries Qatar
    'QAMCO.QA',    // Qatar Aluminum
    'EZDK.QA',     // Ezdan Holding
    'QIMC.QA',     // Qatar Industrial
    'UWCD.QA',     // United Warehousing
    'VFQS.QA',     // Vodafone Qatar
    'MESA.QA',     // Mesaieed
    'QNNS.QA',     // Qatars Navigation
    'GCCS.QA',     // Gulf Cinema
  ],
  
  // 🇧🇭 BAHRAIN - Bahrain Bourse
  bahrain: [
    'ABC.BH',      // Arab Banking Corp
    'NBB.BH',      // National Bank of Bahrain
    'BISB.BH',     // Bahrain Islamic Bank
    'BATBCO.BH',   // Bahrain Telecom
    'SEEF.BH',     // Seef Properties
    'INOVEST.BH',  // Inovest
    'ARIG.BH',     // Arab Insurance
    'BMMI.BH',     // BMMI
    'YBAKEN.BH',   // YBA Kanoo
    'GBcorp.BH',   // GBCorp
  ],
  
  // 🇴🇲 OMAN - Muscat Stock Exchange
  oman: [
    'BKME.OM',     // Bank Muscat
    'NBO.OM',      // National Bank of Oman
    'OIB.OM',      // Oman International Bank
    'OOREDOO.OM',  // Ooredoo Oman
    'OMANTEL.OM',  // Oman Telecom
    'OCC.OM',      // Oman Cement
    'RAYA.OM',     // Raya
    'ALJAZEERA.OM',// Al Jazeera Steel
    'GPH.OM',      // Gulf Palm
    ' NATIONAL.OM', // National Gas
  ],
  
  // 🇪🇬 EGYPT - Egyptian Exchange
  egypt: [
    'COMI.CA',     // Commercial International Bank
    'ETAL.CA',     // Ezz Steel
    'HRHO.CA',     // Housing & Development
    'ORHD.CA',     // Orascom Development
    ' EAST.CA',    // Eastern Company
    'AMER.CA',     // Amer Group
    'TAQA.CA',     // TAQA Arabia
    'ALCN.CA',     // Arabian Cement
    'CCAP.CA',     // Credit Capital
    'SWDY.CA',     // El Sewedy
  ],
  
  // 🇯🇴 JORDAN - Amman Stock Exchange
  jordan: [
    'ARBK.JO',     // Arab Bank
    'BOJX.JO',     // Bank of Jordan
    'JOPH.JO',     // Jordan Phosphate
    'JTC.JO',      // Jordan Telecom
    'ATEI.JO',     // Arab Technology
    'RELC.JO',     // Real Estate
  ],
};

// ========== FUNDS, SUKUK, BONDS ==========
const INVESTMENT_FUNDS = {
  // Saudi ETFs & Funds
  saudiFunds: [
    '1598.SR', // Al Rajhi REIT
    '4335.SR', // Alinma REIT
    '4340.SR', // Riyad REIT
    '4342.SR', // SAB REIT
    '4344.SR', // Taleem REIT
    '4346.SR', // Jadwa REIT
    '4350.SR', // Al Masar REIT
    '4352.SR', // Musharaka REIT
    '4354.SR', // SEDCO REIT
    '4360.SR', // Nama Chemicals
  ],
  
  // UAE Funds
  uaeFunds: [
    'EMIRATESFUND.AD',
    'ALDARFUND.AD',
    'ETISALATFUND.AD',
  ],
};

// ========== COMMODITIES ==========
const COMMODITIES = {
  metals: ['GC=F', 'SI=F', 'PL=F', 'PA=F'], // Gold, Silver, Platinum, Palladium
  energy: ['CL=F', 'BZ=F', 'NG=F', 'HO=F', 'RB=F'], // WTI, Brent, Natural Gas, Heating Oil, Gasoline
  agriculture: ['ZC=F', 'ZW=F', 'ZS=F', 'KC=F', 'CC=F'], // Corn, Wheat, Soybeans, Coffee, Cocoa
};

// ========== US & GLOBAL INDICES ==========
const INDICES = {
  us: ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', '^NDX', '^MID', '^SML'],
  europe: ['^FTSE', '^GDAXI', '^FCHI', '^N100'],
  asia: ['^N225', '^HSI', '^AXJO', '^KS11'],
  emerging: ['^BVSP', '^NSEI', '^BSESN'],
};

// ========== CRYPTO ==========
const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'ripple', 'usd-coin', 'cardano', 'dogecoin', 'avalanche-2',
  'polkadot', 'chainlink', 'tron', 'polygon-ecosystem-token', 'litecoin',
  'shiba-inu', 'uniswap', 'bitcoin-cash', 'near', 'aptos',
  'pepe', 'arbitrum', 'optimism', 'the-open-network', 'stellar',
  'filecoin', 'cosmos', 'internet-computer', 'hedera-hashgraph',
  'fetch-ai', 'render-token', 'immutable-x', 'sui', 'sei-network',
  'bonk', 'ondo-finance', 'jupiter-exchange-solana',
  'celestia', 'worldcoin-wld', 'starknet', 'kaspa', 'aave',
  'maker', 'the-graph', 'vechain', 'algorand', 'tezos',
  'theta-token', 'aelf', 'pancakeswap-token', 'leo-token',
  'usds', 'wrapped-bitcoin', 'ethena', 'monero', 'whitebit',
];

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  'MATIC': 'MATIC', 'POL': 'MATIC', 'pol': 'MATIC',
  'BTC': 'BTC', 'ETH': 'ETH', 'USDT': 'USDT', 'BNB': 'BNB',
  'SOL': 'SOL', 'XRP': 'XRP', 'USDC': 'USDC', 'ADA': 'ADA',
  'DOGE': 'DOGE', 'AVAX': 'AVAX', 'DOT': 'DOT', 'LINK': 'LINK',
  'TRX': 'TRX', 'LTC': 'LTC', 'SHIB': 'SHIB', 'UNI': 'UNI',
  'BCH': 'BCH', 'NEAR': 'NEAR', 'APT': 'APT', 'PEPE': 'PEPE',
  'ARB': 'ARB', 'OP': 'OP', 'TON': 'TON', 'XLM': 'XLM',
  'FIL': 'FIL', 'ATOM': 'ATOM', 'ICP': 'ICP', 'HBAR': 'HBAR',
  'FET': 'FET', 'RNDR': 'RNDR', 'IMX': 'IMX', 'SUI': 'SUI',
  'SEI': 'SEI', 'BONK': 'BONK', 'ONDO': 'ONDO', 'JUP': 'JUP',
  'TIA': 'TIA', 'WLD': 'WLD', 'STRK': 'STRK', 'KAS': 'KAS',
  'AAVE': 'AAVE', 'MKR': 'MKR', 'GRT': 'GRT', 'VET': 'VET',
  'ALGO': 'ALGO', 'XTZ': 'XTZ', 'THETA': 'THETA', 'ELF': 'ELF',
  'CAKE': 'CAKE', 'LEO': 'LEO', 'USDS': 'USDS', 'WBTC': 'WBTC',
  'ENA': 'ENA', 'XMR': 'XMR',
};

// ========== FOREX ==========
const FOREX_PAIRS = [
  'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X',
  'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
  'EURGBP=X', 'EURJPY=X', 'GBPJPY=X',
];

// ========== FETCH FUNCTIONS ==========

async function fetchFromYahoo(symbols: string[]): Promise<Record<string, LivePrice>> {
  const results: Record<string, LivePrice> = {};
  const now = Date.now();
  
  // Yahoo Finance API - batch request
  for (let i = 0; i < symbols.length; i += 20) {
    const batch = symbols.slice(i, i + 20);
    
    try {
      // Use query1 for real-time quotes
      const promises = batch.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
            {
              next: { revalidate: 30 },
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            }
          );
          
          if (!res.ok) return null;
          
          const data = await res.json();
          const result = data.chart?.result?.[0];
          const meta = result?.meta;
          const quote = result?.indicators?.quote?.[0];
          
          if (!meta) return null;
          
          const price = meta.regularMarketPrice || quote?.close?.slice(-1)[0] || 0;
          const prevClose = meta.previousClose || quote?.close?.slice(-2)[0] || price;
          const change = price - prevClose;
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
          
          return {
            symbol,
            data: {
              price,
              change,
              changePct,
              high: quote?.high?.slice(-1)[0],
              low: quote?.low?.slice(-1)[0],
              high52w: meta.fiftyTwoWeekHigh || null,
              low52w: meta.fiftyTwoWeekLow || null,
              volume: quote?.volume?.slice(-1)[0],
              averageVolume: meta.averageDailyVolume3Month || undefined,
              averageVolume10Day: meta.averageDailyVolume10Day || undefined,
              source: 'Yahoo Finance',
              lastUpdate: now
            }
          };
        } catch {
          return null;
        }
      });
      
      const batchResults = await Promise.all(promises);
      
      for (const result of batchResults) {
        if (result) {
          results[result.symbol] = result.data;
        }
      }
      
    } catch (error) {
      console.error('Yahoo batch error:', error);
    }
  }
  
  return results;
}

// ========== EXTENDED FETCH (3mo range for avg volume + short interest) ==========

async function fetchFromYahooExtended(symbols: string[]): Promise<Record<string, LivePrice>> {
  const results: Record<string, LivePrice> = {};
  const now = Date.now();

  for (let i = 0; i < symbols.length; i += 20) {
    const batch = symbols.slice(i, i + 20);
    try {
      const promises = batch.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`,
            {
              next: { revalidate: 60 },
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(12000),
            }
          );
          if (!res.ok) return null;
          const data = await res.json();
          const result = data.chart?.result?.[0];
          const meta = result?.meta;
          const quote = result?.indicators?.quote?.[0];
          if (!meta) return null;

          const price = meta.regularMarketPrice || quote?.close?.slice(-1)[0] || 0;
          const prevClose = meta.previousClose || quote?.close?.slice(-2)[0] || price;
          const change = price - prevClose;
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

          // Compute average volumes from historical data
          const volumes: number[] = (quote?.volume || []).filter((v: number | null): v is number => v != null && v > 0);
          const avgVol3m = volumes.length > 0 ? volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length : undefined;
          const last10 = volumes.slice(-10);
          const avgVol10 = last10.length > 0 ? last10.reduce((a: number, b: number) => a + b, 0) / last10.length : undefined;

          return {
            symbol,
            data: {
              price, change, changePct,
              high: quote?.high?.slice(-1)[0],
              low: quote?.low?.slice(-1)[0],
              high52w: meta.fiftyTwoWeekHigh || null,
              low52w: meta.fiftyTwoWeekLow || null,
              volume: quote?.volume?.slice(-1)[0],
              averageVolume: avgVol3m ? Math.round(avgVol3m) : undefined,
              averageVolume10Day: avgVol10 ? Math.round(avgVol10) : undefined,
              source: 'Yahoo Finance',
              lastUpdate: now,
            } as LivePrice,
          };
        } catch {
          return null;
        }
      });
      const batchResults = await Promise.all(promises);
      for (const r of batchResults) {
        if (r) results[r.symbol] = r.data;
      }
    } catch (error) {
      console.error('Yahoo extended batch error:', error);
    }
  }
  return results;
}

async function fetchCrypto(): Promise<Record<string, LivePrice>> {
  const results: Record<string, LivePrice> = {};
  const now = Date.now();

  try {
    const batchSize = 100;
    const allCoins: any[] = [];

    for (let i = 0; i < CRYPTO_IDS.length; i += batchSize) {
      const batch = CRYPTO_IDS.slice(i, i + batchSize);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${batch.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h%2C1y`,
        { next: { revalidate: 30 }, signal: AbortSignal.timeout(15000) }
      );

      if (!res.ok) continue;
      const coins = await res.json();
      if (Array.isArray(coins)) allCoins.push(...coins);
    }

    for (const coin of allCoins) {
      const rawSymbol = coin.symbol?.toUpperCase() || '';
      const mappedSymbol = CRYPTO_SYMBOL_MAP[rawSymbol] || rawSymbol;

      let high52w: number | null = null;
      const low52w: number | null = null;

      if (coin.ath && coin.ath_date) {
        const athDate = new Date(coin.ath_date);
        const fiftyTwoWeeksAgo = new Date(now);
        fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - 365);
        if (athDate >= fiftyTwoWeeksAgo) {
          high52w = coin.ath;
        }
      }

      const priceData: LivePrice = {
        price: coin.current_price,
        change: coin.price_change_24h || 0,
        changePct: coin.price_change_percentage_24h || 0,
        high: coin.high_24h,
        low: coin.low_24h,
        high52w,
        low52w,
        volume: coin.total_volume,
        marketCap: coin.market_cap,
        source: 'CoinGecko',
        lastUpdate: now
      };

      results[mappedSymbol] = priceData;
      results[mappedSymbol + '-USD'] = priceData;
      results[coin.id.toUpperCase().replace(/-/g, '_')] = priceData;

      if (mappedSymbol !== rawSymbol && rawSymbol) {
        results[rawSymbol] = priceData;
      }
    }

  } catch (error) {
    console.error('Crypto fetch error:', error);
  }

  return results;
}

async function fetchCrypto52wFromYahoo(cryptoSymbols: string[]): Promise<Record<string, { high52w: number | null; low52w: number | null }>> {
  const results: Record<string, { high52w: number | null; low52w: number | null }> = {};

  const yahooSymbols = cryptoSymbols
    .filter(k => k.length <= 10 && !k.includes('_') && !k.includes('-'))
    .map(k => `${k}-USD`);

  for (let i = 0; i < yahooSymbols.length; i += 10) {
    const batch = yahooSymbols.slice(i, i + 10);
    const promises = batch.map(async (symbol) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=1y`,
          {
            next: { revalidate: 300 },
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const result = data.chart?.result?.[0];
        const meta = result?.meta;
        const quote = result?.indicators?.quote?.[0];
        if (!meta) return null;

        let high52w: number | null = meta.fiftyTwoWeekHigh ?? null;
        let low52w: number | null = meta.fiftyTwoWeekLow ?? null;

        if (quote?.high && quote?.low) {
          const highs = (quote.high as (number | null)[]).filter((h): h is number => h != null);
          const lows = (quote.low as (number | null)[]).filter((l): l is number => l != null);
          if (highs.length > 0) high52w = high52w ?? Math.max(...highs);
          if (lows.length > 0) low52w = low52w ?? Math.min(...lows);
          if (high52w == null && highs.length > 0) high52w = Math.max(...highs);
          if (low52w == null && lows.length > 0) low52w = Math.min(...lows);
        }

        const baseKey = symbol.replace('-USD', '').replace('.USD', '');
        if (high52w != null || low52w != null) {
          return { baseKey, high52w, low52w };
        }
        return null;
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) {
        results[r.baseKey] = { high52w: r.high52w, low52w: r.low52w };
      }
    }
  }

  return results;
}

async function fetchForex(): Promise<Record<string, LivePrice>> {
  const results: Record<string, LivePrice> = {};
  const now = Date.now();
  
  try {
    // Try ExchangeRate API first
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 60 }
    });
    
    if (res.ok) {
      const data = await res.json();
      const rates = data.rates;
      
      results['EURUSD'] = { price: rates.EUR, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['GBPUSD'] = { price: rates.GBP, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['USDJPY'] = { price: 1 / rates.JPY, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['USDCHF'] = { price: 1 / rates.CHF, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['AUDUSD'] = { price: rates.AUD, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['USDCAD'] = { price: 1 / rates.CAD, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      
      // Arab currencies
      results['SAR'] = { price: 3.75, change: 0, changePct: 0, source: 'Fixed', lastUpdate: now };
      results['AED'] = { price: 3.6725, change: 0, changePct: 0, source: 'Fixed', lastUpdate: now };
      results['KWD'] = { price: 1 / rates.KWD, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['QAR'] = { price: 3.64, change: 0, changePct: 0, source: 'Fixed', lastUpdate: now };
      results['BHD'] = { price: 1 / rates.BHD, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['EGP'] = { price: 1 / rates.EGP, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
      results['JOD'] = { price: 1 / rates.JOD, change: 0, changePct: 0, source: 'ExchangeRate-API', lastUpdate: now };
    }
  } catch (error) {
    console.error('Forex fetch error:', error);
  }
  
  return results;
}

// ========== MAIN HANDLER ==========
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const market = searchParams.get('market');
  const symbolsParam = searchParams.get('symbols');
  const rawCustomSymbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];
  const cryptoSymbolSet = new Set(Object.values(CRYPTO_SYMBOL_MAP));
  const customSymbols = rawCustomSymbols.filter(sym => !cryptoSymbolSet.has(sym));
  
  // Check cache
  const now = Date.now();
  const isCacheValid = cache.timestamp && (now - cache.timestamp) < CACHE_DURATION;

  if (isCacheValid) {
    // If cache is valid, check if all requested custom symbols exist in cache with volume data
    const missingSymbols = customSymbols.filter(sym => {
      const cached = cache.data[sym] || cache.data[`US_${sym}`];
      // Re-fetch if missing entirely OR if cached but lacks averageVolume
      return !cached || cached.averageVolume == null;
    });
    if (missingSymbols.length === 0) {
      return NextResponse.json({
        success: true,
        cached: true,
        timestamp: cache.timestamp,
        count: Object.keys(cache.data).length,
        data: cache.data
      });
    }
    // Fetch missing/incomplete symbols with extended data (volume averages)
    const newPrices = await fetchFromYahooExtended(missingSymbols);
    Object.assign(cache.data, newPrices);
    return NextResponse.json({
      success: true,
      cached: true,
      timestamp: cache.timestamp,
      count: Object.keys(cache.data).length,
      data: cache.data
    });
  }
  
  try {
    const allPrices: Record<string, LivePrice> = {};
    
    // Fetch all categories in parallel
    const [
      cryptoPrices,
      forexPrices,
      saudiPrices,
      abuDhabiPrices,
      dubaiPrices,
      kuwaitPrices,
      qatarPrices,
      bahrainPrices,
      omanPrices,
      egyptPrices,
      jordanPrices,
      commoditiesPrices,
      indicesPrices,
      fundsPrices,
      customPrices,
    ] = await Promise.all([
      category !== 'stocks' ? fetchCrypto() : Promise.resolve({}),
      fetchForex(),
      fetchFromYahoo(ARAB_STOCKS.saudi),
      fetchFromYahoo(ARAB_STOCKS.abuDhabi),
      fetchFromYahoo(ARAB_STOCKS.dubai),
      fetchFromYahoo(ARAB_STOCKS.kuwait),
      fetchFromYahoo(ARAB_STOCKS.qatar),
      fetchFromYahoo(ARAB_STOCKS.bahrain),
      fetchFromYahoo(ARAB_STOCKS.oman),
      fetchFromYahoo(ARAB_STOCKS.egypt),
      fetchFromYahoo(ARAB_STOCKS.jordan),
      fetchFromYahoo([...COMMODITIES.metals, ...COMMODITIES.energy, ...COMMODITIES.agriculture]),
      fetchFromYahoo([...INDICES.us, ...INDICES.europe, ...INDICES.asia]),
      fetchFromYahoo(INVESTMENT_FUNDS.saudiFunds),
      customSymbols.length > 0 ? fetchFromYahooExtended(customSymbols) : Promise.resolve({}),
    ]);
    
    // Merge all with prefixes for organization
    Object.assign(allPrices, {
      // Crypto
      ...cryptoPrices,
      
      // Forex
      ...forexPrices,
      
      // Saudi Arabia
      ...Object.fromEntries(Object.entries(saudiPrices).map(([k, v]) => [`SAUDI_${k}`, v])),
      
      // UAE - Abu Dhabi
      ...Object.fromEntries(Object.entries(abuDhabiPrices).map(([k, v]) => [`ADX_${k}`, v])),
      
      // UAE - Dubai
      ...Object.fromEntries(Object.entries(dubaiPrices).map(([k, v]) => [`DFM_${k}`, v])),
      
      // Kuwait
      ...Object.fromEntries(Object.entries(kuwaitPrices).map(([k, v]) => [`KSE_${k}`, v])),
      
      // Qatar
      ...Object.fromEntries(Object.entries(qatarPrices).map(([k, v]) => [`QSE_${k}`, v])),
      
      // Bahrain
      ...Object.fromEntries(Object.entries(bahrainPrices).map(([k, v]) => [`BHX_${k}`, v])),
      
      // Oman
      ...Object.fromEntries(Object.entries(omanPrices).map(([k, v]) => [`MSX_${k}`, v])),
      
      // Egypt
      ...Object.fromEntries(Object.entries(egyptPrices).map(([k, v]) => [`EGX_${k}`, v])),
      
      // Jordan
      ...Object.fromEntries(Object.entries(jordanPrices).map(([k, v]) => [`ASE_${k}`, v])),
      
      // Commodities
      ...commoditiesPrices,
      
      // Indices
      ...indicesPrices,
      
      // Funds
      ...Object.fromEntries(Object.entries(fundsPrices).map(([k, v]) => [`FUND_${k}`, v])),
      
      // Custom Requested Symbols
      ...customPrices,
    });
    
    // Also add without prefixes for convenience
    Object.assign(allPrices, saudiPrices, abuDhabiPrices, dubaiPrices, kuwaitPrices, qatarPrices, bahrainPrices, omanPrices, egyptPrices, jordanPrices, customPrices);
    
    // Enrich crypto with 52w high/low from Yahoo Finance (1-year OHLC)
    if (Object.keys(cryptoPrices).length > 0) {
      try {
        const crypto52w = await fetchCrypto52wFromYahoo(Object.keys(cryptoPrices));
        for (const [baseKey, data] of Object.entries(crypto52w)) {
          if (allPrices[baseKey]) {
            if (data.high52w != null) allPrices[baseKey].high52w = data.high52w;
            if (data.low52w != null) allPrices[baseKey].low52w = data.low52w;
          }
          if (allPrices[baseKey + '-USD']) {
            if (data.high52w != null) allPrices[baseKey + '-USD'].high52w = data.high52w;
            if (data.low52w != null) allPrices[baseKey + '-USD'].low52w = data.low52w;
          }
        }
      } catch { /* ignore */ }
    }
    
    // Update cache
    cache = { data: allPrices, timestamp: now };

    return NextResponse.json({
      success: true,
      cached: false,
      timestamp: now,
      count: Object.keys(allPrices).length,
      markets: {
        saudi: Object.keys(saudiPrices).length,
        abuDhabi: Object.keys(abuDhabiPrices).length,
        dubai: Object.keys(dubaiPrices).length,
        kuwait: Object.keys(kuwaitPrices).length,
        qatar: Object.keys(qatarPrices).length,
        bahrain: Object.keys(bahrainPrices).length,
        oman: Object.keys(omanPrices).length,
        egypt: Object.keys(egyptPrices).length,
        jordan: Object.keys(jordanPrices).length,
        crypto: Object.keys(cryptoPrices).length,
        forex: Object.keys(forexPrices).length,
        commodities: Object.keys(commoditiesPrices).length,
        indices: Object.keys(indicesPrices).length,
        funds: Object.keys(fundsPrices).length,
      },
      data: allPrices
    });
    
  } catch (error) {
    console.error('Prices API error:', error);
    
    if (Object.keys(cache.data).length > 0) {
      return NextResponse.json({
        success: true,
        cached: true,
        fallback: true,
        timestamp: cache.timestamp,
        data: cache.data
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prices',
      timestamp: now
    }, { status: 500 });
  }
}
