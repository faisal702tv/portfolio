'use client';

export interface TaxMarketConfig {
  brokerage: number;
  vatOnBrokerage: number;
}

type TaxSettingsMap = Record<string, TaxMarketConfig>;

const DEFAULT_TAX_SETTINGS: TaxSettingsMap = {
  saudi: { brokerage: 0.15, vatOnBrokerage: 15 },
  uae: { brokerage: 0.15, vatOnBrokerage: 5 },
  kuwait: { brokerage: 0.175, vatOnBrokerage: 0 },
  qatar: { brokerage: 0.2, vatOnBrokerage: 0 },
  bahrain: { brokerage: 0.1, vatOnBrokerage: 10 },
  egypt: { brokerage: 0.15, vatOnBrokerage: 14 },
  usa: { brokerage: 0.1, vatOnBrokerage: 0 },
  oman: { brokerage: 0.15, vatOnBrokerage: 5 },
};

const CURRENCY_TO_MARKET: Record<string, string> = {
  SAR: 'saudi',
  AED: 'uae',
  KWD: 'kuwait',
  QAR: 'qatar',
  BHD: 'bahrain',
  EGP: 'egypt',
  USD: 'usa',
  OMR: 'oman',
};

function readStoredTaxSettings(): TaxSettingsMap {
  if (typeof window === 'undefined') return DEFAULT_TAX_SETTINGS;

  try {
    const raw = localStorage.getItem('tax_settings');
    if (!raw) return DEFAULT_TAX_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_TAX_SETTINGS;

    const normalized: TaxSettingsMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue;
      const brokerage = Number((value as { brokerage?: number }).brokerage);
      const vatOnBrokerage = Number((value as { vatOnBrokerage?: number }).vatOnBrokerage);
      normalized[key] = {
        brokerage: Number.isFinite(brokerage) ? brokerage : 0,
        vatOnBrokerage: Number.isFinite(vatOnBrokerage) ? vatOnBrokerage : 0,
      };
    }
    return Object.keys(normalized).length > 0 ? normalized : DEFAULT_TAX_SETTINGS;
  } catch {
    return DEFAULT_TAX_SETTINGS;
  }
}

export function detectMarketKey(params: { currency?: string; symbol?: string; exchange?: string }): string {
  const currency = (params.currency ?? '').toUpperCase();
  const symbol = (params.symbol ?? '').toUpperCase();
  const exchange = (params.exchange ?? '').toUpperCase();

  if (CURRENCY_TO_MARKET[currency]) return CURRENCY_TO_MARKET[currency];
  if (exchange.includes('TADAWUL') || /^\d{4}$/.test(symbol) || symbol.endsWith('.SR')) return 'saudi';
  if (exchange.includes('NYSE') || exchange.includes('NASDAQ') || symbol.includes('.US')) return 'usa';
  if (symbol.endsWith('.AE')) return 'uae';
  if (symbol.endsWith('.KW')) return 'kuwait';
  if (symbol.endsWith('.QA')) return 'qatar';
  if (symbol.endsWith('.BH')) return 'bahrain';
  if (symbol.endsWith('.EG')) return 'egypt';
  if (symbol.endsWith('.OM')) return 'oman';

  return 'saudi';
}

export function getTaxDefaults(params: { currency?: string; symbol?: string; exchange?: string }) {
  const marketKey = detectMarketKey(params);
  const taxSettings = readStoredTaxSettings();
  const market = taxSettings[marketKey] ?? DEFAULT_TAX_SETTINGS[marketKey] ?? DEFAULT_TAX_SETTINGS.saudi;
  return {
    marketKey,
    brokeragePct: market.brokerage,
    vatPct: market.vatOnBrokerage,
  };
}

export function calcTradeFees(params: {
  grossAmount: number;
  brokeragePct: number;
  vatPct: number;
  customBrokerageAmount?: number;
  customVatAmount?: number;
}) {
  const gross = Number.isFinite(params.grossAmount) ? params.grossAmount : 0;
  const brokerageAuto = gross * ((Number(params.brokeragePct) || 0) / 100);
  const brokerage =
    params.customBrokerageAmount === undefined || Number.isNaN(params.customBrokerageAmount)
      ? brokerageAuto
      : params.customBrokerageAmount;
  const vatAuto = brokerage * ((Number(params.vatPct) || 0) / 100);
  const vat =
    params.customVatAmount === undefined || Number.isNaN(params.customVatAmount)
      ? vatAuto
      : params.customVatAmount;
  const total = gross + brokerage + vat;

  return { gross, brokerage, vat, total };
}
