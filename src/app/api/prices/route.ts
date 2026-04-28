import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/security/encryption';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  sharesShort?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  shortDataSource?: string;
  shortDataChecked?: boolean;
  marketCap?: number;
  source: string;
  lastUpdate: number;
}

interface MarketDataApiKeys {
  polygon?: string;
  massive?: string;
}

// Cache
let cache: {
  data: Record<string, LivePrice>;
  timestamp: number;
} = { data: {}, timestamp: 0 };

const CACHE_DURATION = 30000;

let marketDataKeysCache: {
  keys: MarketDataApiKeys;
  timestamp: number;
} = {
  keys: {},
  timestamp: 0,
};
const MARKET_KEYS_CACHE_DURATION = 5 * 60 * 1000;
let saudiStaticMetricsPromise: Promise<Record<string, Partial<LivePrice>>> | null = null;

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

function toFiniteNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseLooseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[^0-9.+-]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCompactMarketCap(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().toUpperCase().replace(/,/g, '');
  if (!cleaned || cleaned === '-') return undefined;
  const matched = cleaned.match(/^([+-]?\d+(?:\.\d+)?)([KMBT])?$/);
  if (!matched) return parseLooseNumber(cleaned);
  const base = Number(matched[1]);
  if (!Number.isFinite(base)) return undefined;
  const unit = matched[2];
  const factor = unit === 'T'
    ? 1e12
    : unit === 'B'
      ? 1e9
      : unit === 'M'
        ? 1e6
        : unit === 'K'
          ? 1e3
          : 1;
  return base * factor;
}

function isLikelyUsEquitySymbol(symbol: string): boolean {
  const upper = String(symbol || '').trim().toUpperCase();
  if (!upper) return false;
  if (upper.includes('.') || upper.includes('=') || upper.includes('/') || upper.endsWith('-USD')) return false;
  return /^[A-Z][A-Z0-9-]{0,9}$/.test(upper);
}

function isSaudiNumericSymbol(symbol: string): boolean {
  return /^\d{3,6}$/.test(String(symbol || '').trim().toUpperCase());
}

function toSaudiBaseSymbol(symbol: string): string {
  return String(symbol || '').trim().toUpperCase().replace(/\.SAU$/, '').replace(/\.SR$/, '');
}

function lookupSaudiStaticMetrics(
  metricsBySymbol: Record<string, Partial<LivePrice>>,
  symbol: string
): Partial<LivePrice> {
  const upper = String(symbol || '').trim().toUpperCase();
  if (!upper) return {};
  const base = toSaudiBaseSymbol(upper);
  return (
    metricsBySymbol[upper] ||
    metricsBySymbol[base] ||
    metricsBySymbol[`${base}.SR`] ||
    {}
  );
}

function lookupMetricsBySymbol<T>(
  metricsBySymbol: Record<string, T>,
  symbol: string
): T | undefined {
  const upper = String(symbol || '').trim().toUpperCase();
  if (!upper) return undefined;
  const base = toSaudiBaseSymbol(upper);
  return metricsBySymbol[upper] ?? metricsBySymbol[base] ?? metricsBySymbol[`${base}.SR`];
}

async function loadSaudiStaticMetrics(): Promise<Record<string, Partial<LivePrice>>> {
  if (saudiStaticMetricsPromise) return saudiStaticMetricsPromise;

  saudiStaticMetricsPromise = (async () => {
    try {
      const filePath = path.join(process.cwd(), 'data', 'stocks', 'saudi.json');
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed?.all_stocks) ? parsed.all_stocks : [];

      const metrics: Record<string, Partial<LivePrice>> = {};
      for (const row of rows) {
        const base = toSaudiBaseSymbol(String(row?.symbol || ''));
        if (!isSaudiNumericSymbol(base)) continue;

        const marketCap = parseCompactMarketCap(row?.market_cap);
        const referencePrice = toFiniteNumber(row?.actual_price) ?? toFiniteNumber(row?.price);
        const sharesOutstanding =
          marketCap != null && referencePrice != null && referencePrice > 0
            ? Math.round(marketCap / referencePrice)
            : undefined;

        if (marketCap == null && sharesOutstanding == null) continue;

        const payload: Partial<LivePrice> = {};
        if (marketCap != null && marketCap > 0) payload.marketCap = marketCap;
        if (sharesOutstanding != null && sharesOutstanding > 0) payload.sharesOutstanding = sharesOutstanding;

        metrics[base] = payload;
        metrics[`${base}.SR`] = payload;
      }

      return metrics;
    } catch {
      return {};
    }
  })();

  return saudiStaticMetricsPromise;
}

function withSaudiSymbolAliases<T>(data: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = { ...data };
  for (const [key, value] of Object.entries(data)) {
    const upper = String(key || '').trim().toUpperCase();
    const match = upper.match(/^(\d{3,6})\.SR$/);
    if (match && !(match[1] in out)) {
      out[match[1]] = value;
    }
  }
  return out;
}

function expandSaudiCustomSymbols(rawSymbols: string[]): string[] {
  const expanded = new Set<string>();
  for (const symbol of rawSymbols) {
    const upper = String(symbol || '').trim().toUpperCase();
    if (!upper) continue;
    expanded.add(upper);
    if (isSaudiNumericSymbol(upper)) expanded.add(`${upper}.SR`);
    if (/^\d{3,6}\.SR$/.test(upper)) expanded.add(upper.replace(/\.SR$/, ''));
    if (upper.endsWith('.SAU')) expanded.add(upper.replace(/\.SAU$/, '.SR'));
  }
  return Array.from(expanded);
}

async function loadMarketDataApiKeys(): Promise<MarketDataApiKeys> {
  const now = Date.now();
  if ((now - marketDataKeysCache.timestamp) < MARKET_KEYS_CACHE_DURATION) {
    return marketDataKeysCache.keys;
  }

  function parseSettingSecret(value: unknown): string | null {
    if (value == null) return null;
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const variants = new Set<string>([trimmed]);
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      variants.add(trimmed.slice(1, -1).trim());
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string' && parsed.trim()) {
        variants.add(parsed.trim());
      }
    } catch {
      // ignore
    }

    for (const candidate of variants) {
      try {
        const decrypted = decrypt(candidate);
        if (decrypted && decrypted.trim().length >= 5) {
          return decrypted.trim();
        }
      } catch {
        // ignore
      }
    }

    for (const candidate of variants) {
      if (!candidate || candidate.length < 8) continue;
      if (/[{}\[\]\s]/.test(candidate)) continue;
      const looksEncryptedPayload = /^[A-Za-z0-9+/=]+(?::[A-Za-z0-9+/=]+){1,2}$/.test(candidate);
      if (looksEncryptedPayload) continue;
      return candidate;
    }
    return null;
  }

  const keys: MarketDataApiKeys = {};

  try {
    const settings = await db.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'api_key_' } },
          { key: { contains: ':api_key_' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    for (const setting of settings) {
      const key = String(setting.key || '').trim();
      if (!key) continue;
      const provider = key.includes(':api_key_')
        ? key.split(':api_key_').pop()
        : key.replace(/^api_key_/, '');
      if (!provider) continue;

      const secret = parseSettingSecret(setting.value);
      if (!secret) continue;

      if (provider === 'polygon' && !keys.polygon) {
        keys.polygon = secret;
      } else if (provider === 'massive' && !keys.massive) {
        keys.massive = secret;
      }

      if (keys.polygon && keys.massive) break;
    }
  } catch {
    // keep empty keys fallback
  }

  marketDataKeysCache = {
    keys,
    timestamp: now,
  };
  return keys;
}

async function fetchYahooQuoteMetrics(symbols: string[]): Promise<Record<string, Partial<LivePrice>>> {
  if (symbols.length === 0) return {};

  const result: Record<string, Partial<LivePrice>> = {};

  try {
    const joined = symbols.map((s) => encodeURIComponent(s)).join(',');
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}`,
      {
        next: { revalidate: 60 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!res.ok) return result;
    const payload = await res.json();
    const rows = Array.isArray(payload?.quoteResponse?.result) ? payload.quoteResponse.result : [];

    for (const row of rows) {
      const symbol = String(row?.symbol || '').trim().toUpperCase();
      if (!symbol) continue;

      const shortRatio = toFiniteNumber(row?.shortRatio);
      const shortPercentOfFloatRaw = toFiniteNumber(row?.shortPercentOfFloat);
      const shortPercentOfFloat =
        shortPercentOfFloatRaw == null
          ? undefined
          : Number((shortPercentOfFloatRaw <= 1 ? shortPercentOfFloatRaw * 100 : shortPercentOfFloatRaw).toFixed(2));
      const sharesShort = toFiniteNumber(row?.sharesShort);
      const sharesOutstanding = toFiniteNumber(row?.sharesOutstanding);
      const floatShares = toFiniteNumber(row?.floatShares);
      const hasShortData = shortRatio != null || shortPercentOfFloat != null || sharesShort != null;

      result[symbol] = {
        volume: toFiniteNumber(row?.regularMarketVolume),
        averageVolume: toFiniteNumber(row?.averageDailyVolume3Month),
        averageVolume10Day: toFiniteNumber(row?.averageDailyVolume10Day),
        shortRatio: shortRatio != null ? Number(shortRatio.toFixed(2)) : undefined,
        shortPercentOfFloat,
        sharesShort,
        sharesOutstanding,
        floatShares,
        marketCap: toFiniteNumber(row?.marketCap),
        shortDataSource: hasShortData ? 'Yahoo Finance Quote API' : undefined,
        shortDataChecked: true,
      };
    }
  } catch {
    return result;
  }

  return result;
}

async function fetchNasdaqShortInterestMetrics(symbols: string[]): Promise<Record<string, Partial<LivePrice>>> {
  const results: Record<string, Partial<LivePrice>> = {};
  const candidates = symbols
    .map((s) => String(s || '').trim().toUpperCase())
    .filter((s) => isLikelyUsEquitySymbol(s));
  if (candidates.length === 0) return results;

  for (const symbol of candidates) {
    try {
      const res = await fetch(
        `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/short-interest?assetclass=stocks`,
        {
          next: { revalidate: 60 * 60 },
          headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;
      const payload = await res.json();
      const rows = payload?.data?.shortInterestTable?.rows;
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const latest = rows[0] || {};

      const sharesShort = parseLooseNumber(latest.interest);
      const avgDailyShareVolume = parseLooseNumber(latest.avgDailyShareVolume);
      const shortRatio = parseLooseNumber(latest.daysToCover);

      if (sharesShort == null && avgDailyShareVolume == null && shortRatio == null) continue;

      results[symbol] = {
        sharesShort,
        averageVolume: avgDailyShareVolume,
        shortRatio: shortRatio != null ? Number(shortRatio.toFixed(2)) : undefined,
        shortDataSource: 'Nasdaq Short Interest API',
        shortDataChecked: true,
      };
    } catch {
      continue;
    }
  }

  return results;
}

async function fetchNasdaqSummaryMetrics(symbols: string[]): Promise<Record<string, Partial<LivePrice>>> {
  const results: Record<string, Partial<LivePrice>> = {};
  const candidates = symbols
    .map((s) => String(s || '').trim().toUpperCase())
    .filter((s) => isLikelyUsEquitySymbol(s));
  if (candidates.length === 0) return results;

  for (const symbol of candidates) {
    try {
      const res = await fetch(
        `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/summary?assetclass=stocks`,
        {
          next: { revalidate: 60 * 30 },
          headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;
      const payload = await res.json();
      const summaryData = payload?.data?.summaryData || {};

      const volume = parseLooseNumber(summaryData?.ShareVolume?.value);
      const averageVolume = parseLooseNumber(summaryData?.AverageVolume?.value);
      const marketCap = parseLooseNumber(summaryData?.MarketCap?.value);
      const rangeText = String(summaryData?.FiftTwoWeekHighLow?.value || '').trim();

      let low52w: number | undefined;
      let high52w: number | undefined;
      if (rangeText) {
        const parts = rangeText
          .split('-')
          .map((part: string) => parseLooseNumber(part))
          .filter((v): v is number => v != null);
        if (parts.length >= 2) {
          low52w = Math.min(parts[0], parts[1]);
          high52w = Math.max(parts[0], parts[1]);
        }
      }

      if (volume == null && averageVolume == null && marketCap == null && low52w == null && high52w == null) continue;

      results[symbol] = {
        volume,
        averageVolume,
        marketCap,
        low52w,
        high52w,
        shortDataSource: 'Nasdaq Summary API',
      };
    } catch {
      continue;
    }
  }

  return results;
}

async function fetchReferenceTickerMetricsFromPolygon(symbols: string[], apiKey?: string): Promise<Record<string, Partial<LivePrice>>> {
  const results: Record<string, Partial<LivePrice>> = {};
  if (!apiKey) return results;

  const candidates = symbols
    .map((s) => String(s || '').trim().toUpperCase())
    .filter((s) => isLikelyUsEquitySymbol(s));
  if (candidates.length === 0) return results;

  for (const symbol of candidates) {
    try {
      const res = await fetch(
        `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(symbol)}?apiKey=${encodeURIComponent(apiKey)}`,
        {
          next: { revalidate: 60 * 60 },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;
      const payload = await res.json();
      const row = payload?.results || {};

      const sharesOutstanding = toFiniteNumber(row?.share_class_shares_outstanding) ?? toFiniteNumber(row?.weighted_shares_outstanding);
      const marketCap = toFiniteNumber(row?.market_cap);

      if (sharesOutstanding == null && marketCap == null) continue;

      results[symbol] = {
        sharesOutstanding,
        marketCap,
        shortDataSource: 'Polygon Reference API',
      };
    } catch {
      continue;
    }
  }

  return results;
}

async function fetchReferenceTickerMetricsFromMassive(symbols: string[], apiKey?: string): Promise<Record<string, Partial<LivePrice>>> {
  const results: Record<string, Partial<LivePrice>> = {};
  if (!apiKey) return results;

  const candidates = symbols
    .map((s) => String(s || '').trim().toUpperCase())
    .filter((s) => isLikelyUsEquitySymbol(s));
  if (candidates.length === 0) return results;

  for (const symbol of candidates) {
    try {
      const res = await fetch(
        `https://api.massive.com/v3/reference/tickers/${encodeURIComponent(symbol)}`,
        {
          next: { revalidate: 60 * 60 },
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;
      const payload = await res.json();
      const row = payload?.results || {};

      const sharesOutstanding = toFiniteNumber(row?.share_class_shares_outstanding) ?? toFiniteNumber(row?.weighted_shares_outstanding);
      const marketCap = toFiniteNumber(row?.market_cap);

      if (sharesOutstanding == null && marketCap == null) continue;

      results[symbol] = {
        sharesOutstanding,
        marketCap,
        shortDataSource: 'Massive Reference API',
      };
    } catch {
      continue;
    }
  }

  return results;
}

// ========== FETCH FUNCTIONS ==========

async function fetchFromYahoo(symbols: string[]): Promise<Record<string, LivePrice>> {
  const results: Record<string, LivePrice> = {};
  const now = Date.now();
  const saudiStaticMetrics = await loadSaudiStaticMetrics();
  
  // Yahoo Finance API - batch request
  for (let i = 0; i < symbols.length; i += 20) {
    const batch = symbols.slice(i, i + 20);
    
    try {
      const quoteMetrics = await fetchYahooQuoteMetrics(batch);
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

          const symbolKey = String(symbol).toUpperCase();
          const quoteMetricsForSymbol = lookupMetricsBySymbol(quoteMetrics, symbolKey) || {};
          const staticSaudiMetricsForSymbol = lookupSaudiStaticMetrics(saudiStaticMetrics, symbolKey);
          
          const price = meta.regularMarketPrice || quote?.close?.slice(-1)[0] || 0;
          const prevClose = meta.previousClose || quote?.close?.slice(-2)[0] || price;
          const change = price - prevClose;
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
          const mergedSharesOutstanding =
            quoteMetricsForSymbol.sharesOutstanding ?? staticSaudiMetricsForSymbol.sharesOutstanding;
          const mergedMarketCap =
            quoteMetricsForSymbol.marketCap
            ?? staticSaudiMetricsForSymbol.marketCap
            ?? (mergedSharesOutstanding != null && price > 0 ? mergedSharesOutstanding * price : undefined);
          const mergedFloatShares =
            quoteMetricsForSymbol.floatShares ?? staticSaudiMetricsForSymbol.floatShares;
          
          return {
            symbol,
            data: {
              price,
              change,
              changePct,
              high: quote?.high?.slice(-1)[0],
              low: quote?.low?.slice(-1)[0],
              high52w: meta.fiftyTwoWeekHigh || quoteMetricsForSymbol.high52w || null,
              low52w: meta.fiftyTwoWeekLow || quoteMetricsForSymbol.low52w || null,
              volume: quote?.volume?.slice(-1)[0] ?? quoteMetricsForSymbol.volume,
              averageVolume: meta.averageDailyVolume3Month || quoteMetricsForSymbol.averageVolume || undefined,
              averageVolume10Day: meta.averageDailyVolume10Day || quoteMetricsForSymbol.averageVolume10Day || undefined,
              sharesOutstanding: mergedSharesOutstanding,
              floatShares: mergedFloatShares,
              marketCap: mergedMarketCap,
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
  const marketDataKeys = await loadMarketDataApiKeys();
  const saudiStaticMetrics = await loadSaudiStaticMetrics();

  for (let i = 0; i < symbols.length; i += 20) {
    const batch = symbols.slice(i, i + 20);
    try {
      const quoteMetrics = await fetchYahooQuoteMetrics(batch);
      const nasdaqFallbackSymbols = batch.filter((symbol) => {
        const metrics = lookupMetricsBySymbol(quoteMetrics, symbol);
        if (!metrics) return isLikelyUsEquitySymbol(symbol);
        return (
          metrics.shortRatio == null &&
          metrics.shortPercentOfFloat == null &&
          metrics.sharesShort == null &&
          isLikelyUsEquitySymbol(symbol)
        );
      });
      const nasdaqMetrics = await fetchNasdaqShortInterestMetrics(nasdaqFallbackSymbols);
      const usBatch = batch.filter((symbol) => isLikelyUsEquitySymbol(symbol));
      const referenceFallbackSymbols = usBatch.filter((symbol) => {
        const metrics = lookupMetricsBySymbol(quoteMetrics, symbol);
        return (
          !metrics ||
          (metrics.sharesOutstanding == null && metrics.marketCap == null)
        );
      });
      const summaryFallbackSymbols = usBatch.filter((symbol) => {
        const metrics = lookupMetricsBySymbol(quoteMetrics, symbol);
        return !metrics || (metrics.volume == null || metrics.averageVolume == null || metrics.marketCap == null);
      });

      const [polygonReferenceMetrics, massiveReferenceMetrics, nasdaqSummaryMetrics] = await Promise.all([
        fetchReferenceTickerMetricsFromPolygon(referenceFallbackSymbols, marketDataKeys.polygon),
        fetchReferenceTickerMetricsFromMassive(referenceFallbackSymbols, marketDataKeys.massive),
        fetchNasdaqSummaryMetrics(summaryFallbackSymbols),
      ]);
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
          const symbolKey = String(symbol).toUpperCase();
          const metrics = lookupMetricsBySymbol(quoteMetrics, symbolKey) || {};
          const fallbackMetrics = lookupMetricsBySymbol(nasdaqMetrics, symbolKey) || {};
          const summaryMetrics = lookupMetricsBySymbol(nasdaqSummaryMetrics, symbolKey) || {};
          const referenceMetrics = {
            ...(lookupMetricsBySymbol(massiveReferenceMetrics, symbolKey) || {}),
            ...(lookupMetricsBySymbol(polygonReferenceMetrics, symbolKey) || {}),
          };
          const staticSaudiMetricsForSymbol = lookupSaudiStaticMetrics(saudiStaticMetrics, symbolKey);

          const sourceParts = new Set<string>();
          if (metrics.shortDataSource) sourceParts.add(metrics.shortDataSource);
          if (fallbackMetrics.shortDataSource) sourceParts.add(fallbackMetrics.shortDataSource);
          if (summaryMetrics.shortDataSource) sourceParts.add(summaryMetrics.shortDataSource);
          if (referenceMetrics.shortDataSource) sourceParts.add(referenceMetrics.shortDataSource);

          const mergedMetrics: Partial<LivePrice> = {
            ...summaryMetrics,
            ...staticSaudiMetricsForSymbol,
            ...referenceMetrics,
            ...fallbackMetrics,
            ...metrics,
            shortRatio: metrics.shortRatio ?? fallbackMetrics.shortRatio,
            shortPercentOfFloat: metrics.shortPercentOfFloat ?? fallbackMetrics.shortPercentOfFloat,
            sharesShort: metrics.sharesShort ?? fallbackMetrics.sharesShort,
            sharesOutstanding:
              metrics.sharesOutstanding
              ?? fallbackMetrics.sharesOutstanding
              ?? referenceMetrics.sharesOutstanding
              ?? staticSaudiMetricsForSymbol.sharesOutstanding,
            floatShares: metrics.floatShares ?? fallbackMetrics.floatShares ?? staticSaudiMetricsForSymbol.floatShares,
            averageVolume: metrics.averageVolume ?? fallbackMetrics.averageVolume ?? summaryMetrics.averageVolume,
            volume: metrics.volume ?? summaryMetrics.volume,
            marketCap:
              metrics.marketCap
              ?? referenceMetrics.marketCap
              ?? summaryMetrics.marketCap
              ?? staticSaudiMetricsForSymbol.marketCap,
            high52w: metrics.high52w ?? summaryMetrics.high52w,
            low52w: metrics.low52w ?? summaryMetrics.low52w,
            shortDataSource: sourceParts.size > 0 ? Array.from(sourceParts).join(' + ') : undefined,
            shortDataChecked: true,
          };

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
              high52w: meta.fiftyTwoWeekHigh || mergedMetrics.high52w || null,
              low52w: meta.fiftyTwoWeekLow || mergedMetrics.low52w || null,
              volume: quote?.volume?.slice(-1)[0] ?? mergedMetrics.volume,
              averageVolume: avgVol3m ? Math.round(avgVol3m) : mergedMetrics.averageVolume,
              averageVolume10Day: avgVol10 ? Math.round(avgVol10) : mergedMetrics.averageVolume10Day,
              shortRatio: mergedMetrics.shortRatio,
              shortPercentOfFloat: mergedMetrics.shortPercentOfFloat,
              sharesShort: mergedMetrics.sharesShort,
              sharesOutstanding: mergedMetrics.sharesOutstanding,
              floatShares: mergedMetrics.floatShares,
              shortDataSource: mergedMetrics.shortDataSource,
              shortDataChecked: true,
              marketCap: mergedMetrics.marketCap,
              source: mergedMetrics.shortDataSource ? `Yahoo Finance + ${mergedMetrics.shortDataSource}` : 'Yahoo Finance',
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
      let low52w: number | null = null;
      const fiftyTwoWeeksAgo = new Date(now);
      fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - 365);

      if (coin.ath && coin.ath_date) {
        const athDate = new Date(coin.ath_date);
        if (athDate >= fiftyTwoWeeksAgo) {
          high52w = coin.ath;
        }
      }

      if (coin.atl && coin.atl_date) {
        const atlDate = new Date(coin.atl_date);
        if (atlDate >= fiftyTwoWeeksAgo) {
          low52w = coin.atl;
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

  const yahooSymbols = Array.from(
    new Set(
      cryptoSymbols
        .map((k) => String(k || '').trim().toUpperCase().replace(/-USD$/, '').replace(/\.USD$/, ''))
        .filter((k) => /^[A-Z0-9]{1,10}$/.test(k))
        .map((k) => `${k}-USD`)
    )
  );

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
  const expandedCustomSymbols = expandSaudiCustomSymbols(rawCustomSymbols);
  const cryptoSymbolSet = new Set(Object.values(CRYPTO_SYMBOL_MAP));
  const normalizeCryptoTicker = (sym: string) => sym.replace(/-USD$/, '').replace(/\.USD$/, '');
  const requestedCryptoSymbols = Array.from(
    new Set(expandedCustomSymbols.map(normalizeCryptoTicker).filter(sym => cryptoSymbolSet.has(sym)))
  );
  const customSymbols = expandedCustomSymbols.filter(sym => !cryptoSymbolSet.has(normalizeCryptoTicker(sym)));
  
  // Check cache
  const now = Date.now();
  const isCacheValid = cache.timestamp && (now - cache.timestamp) < CACHE_DURATION;

  if (isCacheValid) {
    // If cache is valid, check if all requested custom symbols exist in cache with volume data
    const missingSymbols = customSymbols.filter(sym => {
      const saudiAlias = isSaudiNumericSymbol(sym)
        ? `${sym}.SR`
        : (/^\d{3,6}\.SR$/.test(sym) ? sym.replace(/\.SR$/, '') : null);
      const cached =
        cache.data[sym]
        || cache.data[`US_${sym}`]
        || (saudiAlias ? cache.data[saudiAlias] : undefined);
      if (!cached) return true;
      if (cached.averageVolume == null) return true;

      if (isLikelyUsEquitySymbol(sym)) {
        // Force one quote-metrics enrichment pass for US equities if not checked yet.
        if (!cached.shortDataChecked) return true;
      }
      return false;
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
    const newPrices = withSaudiSymbolAliases(await fetchFromYahooExtended(missingSymbols));
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

    const saudiPricesWithAliases = withSaudiSymbolAliases(saudiPrices);
    const customPricesWithAliases = withSaudiSymbolAliases(customPrices);
    
    // Merge all with prefixes for organization
    Object.assign(allPrices, {
      // Crypto
      ...cryptoPrices,
      
      // Forex
      ...forexPrices,
      
      // Saudi Arabia
      ...Object.fromEntries(Object.entries(saudiPricesWithAliases).map(([k, v]) => [`SAUDI_${k}`, v])),
      
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
      ...customPricesWithAliases,
    });
    
    // Also add without prefixes for convenience
    Object.assign(
      allPrices,
      saudiPricesWithAliases,
      abuDhabiPrices,
      dubaiPrices,
      kuwaitPrices,
      qatarPrices,
      bahrainPrices,
      omanPrices,
      egyptPrices,
      jordanPrices,
      customPricesWithAliases
    );
    
    // Enrich crypto with 52w high/low from Yahoo Finance (1-year OHLC)
    if (Object.keys(cryptoPrices).length > 0) {
      try {
        const cryptoTargets = requestedCryptoSymbols.length > 0 ? requestedCryptoSymbols : Object.keys(cryptoPrices);
        const crypto52w = await fetchCrypto52wFromYahoo(cryptoTargets);
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
        saudi: Object.keys(saudiPricesWithAliases).length,
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
