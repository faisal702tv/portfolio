/**
 * Portfolio Analytics Engine
 * Risk metrics, performance calculations, and rebalancing suggestions.
 */

// ─── Types ────────────────────────────────────────────────────

export interface PortfolioAsset {
  symbol: string;
  name: string;
  qty: number;
  buyPrice: number;
  currentPrice: number | null;
  buyDate?: string;
  sector?: string;
  currency?: string;
}

export interface PeriodReturn {
  date: string;
  value: number;
  return: number;
}

export interface RiskMetrics {
  /** Annualized return */
  annualizedReturn: number;
  /** Standard deviation (volatility) */
  standardDeviation: number;
  /** Risk-adjusted return (higher is better) */
  sharpeRatio: number;
  /** Maximum peak-to-trough decline */
  maxDrawdown: number;
  /** Max drawdown duration in days */
  maxDrawdownDuration: number;
  /** Beta (market sensitivity, 1 = market) */
  beta: number;
  /** Alpha (excess return vs market) */
  alpha: number;
  /** Value at Risk (95% confidence) */
  var95: number;
  /** Sortino Ratio (downside risk adjusted) */
  sortinoRatio: number;
  /** Calmar Ratio (return / max drawdown) */
  calmarRatio: number;
}

export interface RebalanceSuggestion {
  symbol: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  diff: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
}

export interface AnalyticsResult {
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPct: number;
  riskMetrics: RiskMetrics;
  sectorAllocation: { sector: string; weight: number; value: number }[];
  rebalanceSuggestions: RebalanceSuggestion[];
}

// ─── Risk-Free Rate (Saudi Riyal) ────────────────────────────
const RISK_FREE_RATE = 0.05; // ~5% annual

// ─── Calculations ─────────────────────────────────────────────

/** Calculate total portfolio value */
export function calcTotalValue(assets: PortfolioAsset[]): number {
  return assets.reduce(
    (sum, a) => sum + a.qty * (a.currentPrice ?? a.buyPrice),
    0
  );
}

/** Calculate total cost */
export function calcTotalCost(assets: PortfolioAsset[]): number {
  return assets.reduce((sum, a) => sum + a.qty * a.buyPrice, 0);
}

/** Calculate standard deviation of returns */
export function standardDeviation(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

/** Calculate downside deviation (for Sortino) */
export function downsideDeviation(returns: number[]): number {
  const negative = returns.filter(r => r < 0);
  if (negative.length < 2) return 0;
  return standardDeviation(negative);
}

/** Calculate maximum drawdown from a series of values */
export function maxDrawdown(values: number[]): { drawdown: number; duration: number } {
  if (values.length < 2) return { drawdown: 0, duration: 0 };

  let peak = values[0];
  let maxDd = 0;
  let maxDuration = 0;
  let drawdownStart = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
      drawdownStart = i;
    }
    const dd = (peak - values[i]) / peak;
    if (dd > maxDd) {
      maxDd = dd;
      maxDuration = i - drawdownStart;
    }
  }

  return { drawdown: maxDd, duration: maxDuration };
}

/** Calculate risk metrics for a portfolio */
export function calculateRiskMetrics(
  assets: PortfolioAsset[],
  historicalReturns?: number[],
  marketReturns?: number[]
): RiskMetrics {
  const totalValue = calcTotalValue(assets);
  const totalCost = calcTotalCost(assets);
  const holdingDays = assets.reduce((max, a) => {
    if (!a.buyDate) return max;
    const days = (Date.now() - new Date(a.buyDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(max, days);
  }, 30); // Default 30 days if no buyDate

  // Use provided returns or calculate simple returns
  const returns = historicalReturns && historicalReturns.length > 1
    ? historicalReturns
    : assets.length > 0
      ? [(totalValue / totalCost - 1)] // Simple total return
      : [0];

  // Annualized return
  const totalReturn = totalValue / totalCost - 1;
  const years = holdingDays / 365;
  const annualizedReturn = years > 0
    ? Math.pow(1 + totalReturn, 1 / years) - 1
    : totalReturn;

  // Standard deviation (annualized)
  const dailyStdDev = standardDeviation(returns);
  const tradingDays = 252;
  const annualStdDev = dailyStdDev * Math.sqrt(tradingDays);

  // Sharpe Ratio
  const sharpeRatio = annualStdDev > 0
    ? (annualizedReturn - RISK_FREE_RATE) / annualStdDev
    : 0;

  // Sortino Ratio
  const downDev = downsideDeviation(returns);
  const annualDownDev = downDev * Math.sqrt(tradingDays);
  const sortinoRatio = annualDownDev > 0
    ? (annualizedReturn - RISK_FREE_RATE) / annualDownDev
    : 0;

  // Max Drawdown
  const values = assets.map(a => a.currentPrice ?? a.buyPrice);
  const { drawdown, duration } = maxDrawdown(values);

  // Calmar Ratio
  const calmarRatio = drawdown > 0
    ? annualizedReturn / drawdown
    : 0;

  // Beta (vs market)
  let beta = 1;
  if (marketReturns && marketReturns.length === returns.length && returns.length > 1) {
    const marketStdDev = standardDeviation(marketReturns);
    const cov = returns.reduce(
      (sum, r, i) => sum + (r - returns.reduce((a, b) => a + b) / returns.length) *
        (marketReturns[i] - marketReturns.reduce((a, b) => a + b) / marketReturns.length),
      0
    ) / (returns.length - 1);
    beta = marketStdDev > 0 ? cov / (marketStdDev * marketStdDev) : 1;
  }

  // Alpha
  const marketReturn = marketReturns?.length
    ? marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length * tradingDays
    : RISK_FREE_RATE;
  const alpha = annualizedReturn - (RISK_FREE_RATE + beta * (marketReturn - RISK_FREE_RATE));

  // Value at Risk (95%)
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const var95 = meanReturn - 1.645 * dailyStdDev;

  return {
    annualizedReturn,
    standardDeviation: annualStdDev,
    sharpeRatio,
    maxDrawdown: drawdown,
    maxDrawdownDuration: duration,
    beta,
    alpha,
    var95: var95 * totalValue, // Absolute VaR
    sortinoRatio,
    calmarRatio,
  };
}

/** Calculate sector allocation */
export function calculateSectorAllocation(assets: PortfolioAsset[]): { sector: string; weight: number; value: number }[] {
  const totalValue = calcTotalValue(assets);
  const sectorMap = new Map<string, number>();

  for (const asset of assets) {
    const sector = asset.sector || 'غير مصنف';
    const value = asset.qty * (asset.currentPrice ?? asset.buyPrice);
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
  }

  return Array.from(sectorMap.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      weight: totalValue > 0 ? value / totalValue : 0,
    }))
    .sort((a, b) => b.weight - a.weight);
}

/** Generate rebalancing suggestions */
export function generateRebalanceSuggestions(
  assets: PortfolioAsset[],
  targetAllocation: { sector: string; weight: number }[]
): RebalanceSuggestion[] {
  const totalValue = calcTotalValue(assets);
  const currentAllocation = calculateSectorAllocation(assets);
  const currentMap = new Map(currentAllocation.map(a => [a.sector, a.weight]));

  const suggestions: RebalanceSuggestion[] = [];

  for (const target of targetAllocation) {
    const current = currentMap.get(target.sector) || 0;
    const diff = target.weight - current;

    suggestions.push({
      symbol: '', // Will be filled by the caller
      name: target.sector,
      currentWeight: current,
      targetWeight: target.weight,
      diff,
      action: Math.abs(diff) < 0.02 ? 'hold' : diff > 0 ? 'buy' : 'sell',
      amount: diff * totalValue,
    });
  }

  return suggestions.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/** Full portfolio analysis */
export function analyzePortfolio(
  assets: PortfolioAsset[],
  options?: {
    historicalReturns?: number[];
    marketReturns?: number[];
    targetAllocation?: { sector: string; weight: number }[];
  }
): AnalyticsResult {
  const totalValue = calcTotalValue(assets);
  const totalCost = calcTotalCost(assets);

  return {
    totalValue,
    totalCost,
    profitLoss: totalValue - totalCost,
    profitLossPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    riskMetrics: calculateRiskMetrics(
      assets,
      options?.historicalReturns,
      options?.marketReturns
    ),
    sectorAllocation: calculateSectorAllocation(assets),
    rebalanceSuggestions: options?.targetAllocation
      ? generateRebalanceSuggestions(assets, options.targetAllocation)
      : [],
  };
}
