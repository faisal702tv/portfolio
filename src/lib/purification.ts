export type PurificationAssetType = 'stock' | 'fund';

export interface PurificationMetrics {
  found: boolean;
  symbol: string;
  sourceMarket: string | null;
  interestIncomeToRevenuePct: number;
  debtToMarketCapPct: number;
  purificationPct: number;
}

export const ZERO_PURIFICATION_METRICS: PurificationMetrics = {
  found: false,
  symbol: '',
  sourceMarket: null,
  interestIncomeToRevenuePct: 0,
  debtToMarketCapPct: 0,
  purificationPct: 0,
};

export async function fetchPurificationMetrics(params: {
  symbol?: string;
  exchange?: string;
  assetType: PurificationAssetType;
}): Promise<PurificationMetrics> {
  const symbol = (params.symbol || '').trim();
  if (!symbol) return ZERO_PURIFICATION_METRICS;

  const search = new URLSearchParams({
    symbol,
    assetType: params.assetType,
  });
  if (params.exchange) search.set('exchange', params.exchange);

  try {
    const res = await fetch(`/api/purification?${search.toString()}`);
    if (!res.ok) return { ...ZERO_PURIFICATION_METRICS, symbol };
    const data = await res.json();
    if (!data?.success) return { ...ZERO_PURIFICATION_METRICS, symbol };

    return {
      found: Boolean(data.found),
      symbol: String(data.symbol || symbol),
      sourceMarket: data.sourceMarket ? String(data.sourceMarket) : null,
      interestIncomeToRevenuePct: Number(data.interestIncomeToRevenuePct || 0),
      debtToMarketCapPct: Number(data.debtToMarketCapPct || 0),
      purificationPct: Number(data.purificationPct || 0),
    };
  } catch {
    return { ...ZERO_PURIFICATION_METRICS, symbol };
  }
}

export function calcPurificationAmount(baseAmount: number, purificationPct: number): number {
  if (!Number.isFinite(baseAmount) || !Number.isFinite(purificationPct)) return 0;
  if (baseAmount <= 0 || purificationPct <= 0) return 0;
  return (baseAmount * purificationPct) / 100;
}
