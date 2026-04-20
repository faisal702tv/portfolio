export type AssetClass = 'stock' | 'fund' | 'bond' | 'crypto' | 'forex' | 'commodity';

const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
  TADAWUL: 'SAR',
  SAUDI: 'SAR',
  TASI: 'SAR',
  ADX: 'AED',
  DFM: 'AED',
  NASDAQ_DUBAI: 'AED',
  KSE: 'KWD',
  BOURSA: 'KWD',
  QSE: 'QAR',
  QE: 'QAR',
  QATAR: 'QAR',
  BHB: 'BHD',
  BAHRAIN: 'BHD',
  EGX: 'EGP',
  EGYPT: 'EGP',
  MSX: 'OMR',
  OMAN: 'OMR',
  ASE: 'JOD',
  JORDAN: 'JOD',
  NYSE: 'USD',
  NASDAQ: 'USD',
  AMEX: 'USD',
  OTC: 'USD',
  US: 'USD',
  LSE: 'GBP',
  TSE: 'JPY',
  JPX: 'JPY',
  FOREX: 'USD',
  CRYPTO: 'USD',
  COMMODITY: 'USD',
  COMMODITIES: 'USD',
};

const SYMBOL_SUFFIX_EXCHANGE_MAP: Array<{ suffix: string; exchange: string }> = [
  { suffix: '.SR', exchange: 'TADAWUL' },
  { suffix: '.AD', exchange: 'ADX' },
  { suffix: '.DU', exchange: 'DFM' },
  { suffix: '.KW', exchange: 'KSE' },
  { suffix: '.QA', exchange: 'QSE' },
  { suffix: '.BH', exchange: 'BHB' },
  { suffix: '.CA', exchange: 'EGX' },
  { suffix: '.OM', exchange: 'MSX' },
  { suffix: '.JO', exchange: 'ASE' },
  { suffix: '.L', exchange: 'LSE' },
  { suffix: '.T', exchange: 'TSE' },
];

const SYMBOL_SUFFIX_CURRENCY_MAP: Array<{ suffix: string; currency: string }> = [
  { suffix: '.SR', currency: 'SAR' },
  { suffix: '.AD', currency: 'AED' },
  { suffix: '.DU', currency: 'AED' },
  { suffix: '.KW', currency: 'KWD' },
  { suffix: '.QA', currency: 'QAR' },
  { suffix: '.BH', currency: 'BHD' },
  { suffix: '.CA', currency: 'EGP' },
  { suffix: '.OM', currency: 'OMR' },
  { suffix: '.JO', currency: 'JOD' },
  { suffix: '.L', currency: 'GBP' },
  { suffix: '.T', currency: 'JPY' },
];

const QUOTE_PAIR_REGEX = /^([A-Z]{3,6})[-/]([A-Z]{3,6})$/;

function normalizeCurrencyCode(value?: string | null): string | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  return upper || undefined;
}

export function normalizeAssetSymbol(symbol?: string | null): string {
  return String(symbol || '').trim().toUpperCase();
}

export function normalizeExchangeCode(exchange?: string | null): string | undefined {
  if (!exchange) return undefined;
  const upper = exchange.trim().toUpperCase();
  if (!upper) return undefined;

  if (upper.includes('NASDAQ') && upper.includes('DUBAI')) return 'NASDAQ_DUBAI';
  if (upper.includes('TADAWUL') || upper.includes('SAUDI') || upper.includes('TASI')) return 'TADAWUL';
  if (upper.includes('ADX')) return 'ADX';
  if (upper.includes('DFM')) return 'DFM';
  if (upper.includes('KSE') || upper.includes('BOURSA')) return 'KSE';
  if (upper.includes('QSE') || upper === 'QE' || upper.includes('QATAR')) return 'QSE';
  if (upper.includes('BHB') || upper.includes('BAHRAIN')) return 'BHB';
  if (upper.includes('EGX') || upper.includes('EGYPT')) return 'EGX';
  if (upper.includes('MSX') || upper.includes('OMAN')) return 'MSX';
  if (upper.includes('ASE') || upper.includes('JORDAN') || upper.includes('AMMAN')) return 'ASE';
  if (upper.includes('NASDAQ')) return 'NASDAQ';
  if (upper.includes('NYSE')) return 'NYSE';
  if (upper.includes('AMEX')) return 'AMEX';
  if (upper.includes('OTC')) return 'OTC';
  if (upper.includes('LSE') || upper.includes('LONDON')) return 'LSE';
  if (upper.includes('JPX') || upper.includes('TSE')) return 'TSE';
  if (upper.includes('FOREX') || upper === 'FX') return 'FOREX';
  if (upper.includes('CRYPTO') || upper.includes('BINANCE') || upper.includes('COINBASE')) return 'CRYPTO';
  if (upper.includes('COMMOD')) return 'COMMODITY';

  return upper;
}

export function inferCurrencyFromExchange(exchange?: string | null): string | undefined {
  const normalized = normalizeExchangeCode(exchange);
  if (!normalized) return undefined;

  if (EXCHANGE_CURRENCY_MAP[normalized]) return EXCHANGE_CURRENCY_MAP[normalized];

  for (const [market, currency] of Object.entries(EXCHANGE_CURRENCY_MAP)) {
    if (normalized.includes(market)) return currency;
  }

  return undefined;
}

export function inferExchangeFromSymbol(symbol?: string | null): string | undefined {
  const normalized = normalizeAssetSymbol(symbol);
  if (!normalized) return undefined;

  if (normalized.endsWith('=X')) return 'FOREX';
  if (normalized.endsWith('=F')) return 'COMMODITY';
  if (normalized.endsWith('-USD') || normalized.endsWith('-USDT') || normalized.endsWith('-USDC')) return 'CRYPTO';
  if (QUOTE_PAIR_REGEX.test(normalized)) return 'CRYPTO';

  const usTagged = normalized.match(/^([A-Z]{1,6})\.([A-Z]{1,10})$/);
  if (usTagged) {
    const tag = usTagged[2];
    if (tag === 'US' || tag === 'N' || tag === 'NYSE') return 'NYSE';
    if (tag === 'O' || tag === 'OQ' || tag === 'NSQ' || tag === 'NASDAQ') return 'NASDAQ';
  }

  for (const item of SYMBOL_SUFFIX_EXCHANGE_MAP) {
    if (normalized.endsWith(item.suffix)) return item.exchange;
  }

  // Heuristics when exchange is missing:
  // - Numeric local tickers are most commonly Saudi listings.
  // - Pure alphabetic tickers are usually US-listed symbols.
  if (/^\d{3,6}$/.test(normalized)) return 'TADAWUL';
  if (/^[A-Z]{1,6}$/.test(normalized)) return 'NYSE';

  return undefined;
}

function inferCurrencyFromQuotePair(symbol?: string | null): string | undefined {
  const normalized = normalizeAssetSymbol(symbol);
  if (!normalized) return undefined;

  const matched = normalized.match(QUOTE_PAIR_REGEX);
  if (matched) return matched[2];

  return undefined;
}

export function inferCurrencyFromForexSymbol(symbol?: string | null): string | undefined {
  const normalized = normalizeAssetSymbol(symbol);
  if (!normalized) return undefined;

  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    if (parts.length === 2 && parts[1].length >= 3) return parts[1].slice(0, 3);
  }

  if (normalized.endsWith('=X')) {
    const compact = normalized.replace('=X', '').replace(/[^A-Z]/g, '');
    if (compact.length === 6) return compact.slice(3, 6);
    if (compact.length === 3) return compact;
  }

  const compact = normalized.replace(/[^A-Z]/g, '');
  if (compact.length === 6) return compact.slice(3, 6);

  return undefined;
}

export function inferCurrencyFromSymbol(symbol?: string | null): string | undefined {
  const normalized = normalizeAssetSymbol(symbol);
  if (!normalized) return undefined;

  if (normalized.endsWith('=X')) return inferCurrencyFromForexSymbol(normalized) || 'USD';
  if (normalized.endsWith('=F')) return 'USD';
  if (normalized.endsWith('-USD') || normalized.endsWith('-USDT') || normalized.endsWith('-USDC')) return 'USD';

  const usTagged = normalized.match(/^([A-Z]{1,6})\.([A-Z]{1,10})$/);
  if (usTagged) {
    const tag = usTagged[2];
    if (tag === 'US' || tag === 'N' || tag === 'NYSE' || tag === 'O' || tag === 'OQ' || tag === 'NSQ' || tag === 'NASDAQ') {
      return 'USD';
    }
  }

  const quotePair = inferCurrencyFromQuotePair(normalized);
  if (quotePair) return quotePair;

  for (const item of SYMBOL_SUFFIX_CURRENCY_MAP) {
    if (normalized.endsWith(item.suffix)) return item.currency;
  }

  if (/^\d{3,6}$/.test(normalized)) return 'SAR';
  if (/^[A-Z]{1,6}$/.test(normalized)) return 'USD';

  return undefined;
}

function hasStrongSymbolMarketInference(symbol: string): boolean {
  if (!symbol) return false;
  if (symbol.endsWith('=X') || symbol.endsWith('=F')) return true;
  if (symbol.endsWith('-USD') || symbol.endsWith('-USDT') || symbol.endsWith('-USDC')) return true;
  if (/^[A-Z]{1,6}\.(US|N|NYSE|O|OQ|NSQ|NASDAQ)$/.test(symbol)) return true;
  if (SYMBOL_SUFFIX_EXCHANGE_MAP.some((item) => symbol.endsWith(item.suffix))) return true;
  if (/^\d{3,6}$/.test(symbol)) return true;
  if (/^[A-Z]{1,6}$/.test(symbol)) return true;
  return false;
}

export function resolveAssetMarket(input: {
  symbol?: string | null;
  exchange?: string | null;
  currency?: string | null;
  assetClass?: AssetClass;
}): { symbol: string; exchange?: string; currency?: string } {
  const symbol = normalizeAssetSymbol(input.symbol);
  const fromExchange = normalizeExchangeCode(input.exchange);
  const fromSymbol = inferExchangeFromSymbol(symbol);

  let exchange = fromExchange || fromSymbol;
  if (fromExchange && fromSymbol && fromExchange !== fromSymbol && hasStrongSymbolMarketInference(symbol)) {
    exchange = fromSymbol;
  }
  if (input.assetClass === 'crypto') exchange = 'CRYPTO';
  if (input.assetClass === 'forex') exchange = 'FOREX';
  if (input.assetClass === 'commodity') exchange = 'COMMODITY';

  const currencyFromExchange = inferCurrencyFromExchange(exchange);
  const currencyFromSymbol = inferCurrencyFromSymbol(symbol);
  let inferredCurrency: string | undefined;

  if (input.assetClass === 'forex') {
    inferredCurrency = inferCurrencyFromForexSymbol(symbol) || currencyFromExchange || 'USD';
  } else if (input.assetClass === 'crypto') {
    inferredCurrency = inferCurrencyFromQuotePair(symbol) || currencyFromExchange || 'USD';
  } else if (input.assetClass === 'commodity') {
    inferredCurrency = currencyFromExchange || 'USD';
  } else {
    inferredCurrency = currencyFromExchange || currencyFromSymbol;
  }

  let currency = normalizeCurrencyCode(input.currency);

  // If stored currency conflicts with inferred market currency, prioritize market inference.
  if (
    currency &&
    inferredCurrency &&
    currency !== inferredCurrency &&
    (Boolean(currencyFromExchange) || hasStrongSymbolMarketInference(symbol) || input.assetClass === 'forex' || input.assetClass === 'crypto' || input.assetClass === 'commodity')
  ) {
    currency = inferredCurrency;
  }

  if (!currency) {
    currency = inferredCurrency;
  }

  return {
    symbol,
    exchange,
    currency,
  };
}
