export type AnalysisAssetType =
  | 'stocks'
  | 'funds'
  | 'crypto'
  | 'commodities'
  | 'forex'
  | 'bonds';

export interface AnalysisAssetContext {
  symbol: string;
  name?: string;
  type: AnalysisAssetType;
  id?: string;
  exchange?: string;
  currency?: string;
  portfolioId?: string;
  portfolioName?: string;
  sourcePage?: string;
}

export function normalizeAnalysisAssetType(input?: string | null): AnalysisAssetType | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();

  if (value === 'stocks' || value === 'stock' || value === 'equity') return 'stocks';
  if (value === 'funds' || value === 'fund' || value === 'etf') return 'funds';
  if (value === 'crypto' || value === 'cryptocurrency' || value === 'coin') return 'crypto';
  if (value === 'commodities' || value === 'commodity') return 'commodities';
  if (value === 'forex' || value === 'fx') return 'forex';
  if (value === 'bonds' || value === 'bond' || value === 'sukuk') return 'bonds';

  return null;
}

export function getAnalysisTypeLabel(type: AnalysisAssetType): string {
  if (type === 'stocks') return 'سهم';
  if (type === 'funds') return 'صندوق';
  if (type === 'crypto') return 'عملة مشفرة';
  if (type === 'commodities') return 'سلعة';
  if (type === 'forex') return 'فوركس';
  return 'سند/صك';
}

export function buildAnalysisHref(
  targetPath: '/performance' | '/technical-analysis' | '/risk-analysis',
  asset: AnalysisAssetContext
): string {
  const params = new URLSearchParams();
  params.set('symbol', asset.symbol);
  params.set('type', asset.type);

  if (asset.name) params.set('name', asset.name);
  if (asset.id) params.set('assetId', asset.id);
  if (asset.exchange) params.set('exchange', asset.exchange);
  if (asset.currency) params.set('currency', asset.currency);
  if (asset.portfolioId) params.set('portfolioId', asset.portfolioId);
  if (asset.portfolioName) params.set('portfolioName', asset.portfolioName);
  if (asset.sourcePage) params.set('sourcePage', asset.sourcePage);

  return `${targetPath}?${params.toString()}`;
}

export function toYahooSymbolForAsset(symbol: string, type: AnalysisAssetType): string {
  if (!symbol) return symbol;

  if (type === 'crypto') {
    const base = symbol.replace('-USD', '').replace('-USDT', '').replace('-USDC', '');
    return `${base}-USD`;
  }

  if (type === 'forex') {
    return symbol.includes('=X') ? symbol : `${symbol.replace('=X', '')}=X`;
  }

  return symbol;
}
