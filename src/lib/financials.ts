/**
 * Advanced financial analytics helpers.
 * All functions are pure and deterministic (no side effects).
 */

export interface MaxDrawdownResult {
  maxDrawdown: number;
  peakIndex: number;
  troughIndex: number;
}

const EPSILON = 1e-12;

function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }
}

function assertPriceSeries(prices: number[]): void {
  if (!Array.isArray(prices) || prices.length < 2) {
    throw new Error('prices must contain at least 2 values.');
  }
  for (let i = 0; i < prices.length; i += 1) {
    const p = prices[i];
    assertFiniteNumber(p, `prices[${i}]`);
    if (p <= 0) {
      throw new Error(`prices[${i}] must be greater than zero.`);
    }
  }
}

function sum(values: number[]): number {
  let s = 0;
  let c = 0;
  for (const v of values) {
    const y = v - c;
    const t = s + y;
    c = (t - s) - y;
    s = t;
  }
  return s;
}

export function toReturnsFromPrices(prices: number[]): number[] {
  assertPriceSeries(prices);
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

export function standardDeviation(values: number[], sample = true): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const denominator = sample ? values.length - 1 : values.length;
  if (denominator <= 0) return 0;
  const variance = sum(values.map((v) => {
    const d = v - avg;
    return d * d;
  })) / denominator;
  return Math.sqrt(Math.max(variance, 0));
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  assertFiniteNumber(startValue, 'startValue');
  assertFiniteNumber(endValue, 'endValue');
  assertFiniteNumber(years, 'years');
  if (startValue <= 0) throw new Error('startValue must be greater than zero.');
  if (endValue <= 0) throw new Error('endValue must be greater than zero.');
  if (years <= 0) throw new Error('years must be greater than zero.');
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function annualizedReturnFromPeriodReturns(
  periodReturns: number[],
  periodsPerYear = 252
): number {
  if (!periodReturns.length) return 0;
  if (periodsPerYear <= 0) throw new Error('periodsPerYear must be greater than zero.');

  const growth = periodReturns.reduce((acc, r) => acc * (1 + r), 1);
  if (growth <= 0) return -1;
  return Math.pow(growth, periodsPerYear / periodReturns.length) - 1;
}

export function calculateVolatility(periodReturns: number[], periodsPerYear = 252): number {
  if (!periodReturns.length) return 0;
  if (periodsPerYear <= 0) throw new Error('periodsPerYear must be greater than zero.');
  const sigma = standardDeviation(periodReturns, true);
  return sigma * Math.sqrt(periodsPerYear);
}

export function calculateSharpeRatio(
  periodReturns: number[],
  riskFreeRate = 0.02,
  periodsPerYear = 252
): number {
  if (!periodReturns.length) return 0;
  const annualized = annualizedReturnFromPeriodReturns(periodReturns, periodsPerYear);
  const volatility = calculateVolatility(periodReturns, periodsPerYear);
  if (volatility <= EPSILON) return 0;
  return (annualized - riskFreeRate) / volatility;
}

export function calculateSortinoRatio(
  periodReturns: number[],
  riskFreeRate = 0.02,
  periodsPerYear = 252,
  targetReturnPerPeriod = 0
): number {
  if (!periodReturns.length) return 0;

  const annualized = annualizedReturnFromPeriodReturns(periodReturns, periodsPerYear);
  const downside = periodReturns
    .map((r) => Math.min(0, r - targetReturnPerPeriod))
    .map((d) => d * d);

  const downsideVariance = mean(downside);
  const downsideDeviationAnnualized = Math.sqrt(Math.max(downsideVariance, 0)) * Math.sqrt(periodsPerYear);
  if (downsideDeviationAnnualized <= EPSILON) return 0;
  return (annualized - riskFreeRate) / downsideDeviationAnnualized;
}

export function calculateMaxDrawdown(prices: number[]): MaxDrawdownResult {
  assertPriceSeries(prices);

  let peak = prices[0];
  let peakIndex = 0;
  let bestPeakIndex = 0;
  let bestTroughIndex = 0;
  let maxDrawdown = 0;

  for (let i = 1; i < prices.length; i += 1) {
    const value = prices[i];
    if (value > peak) {
      peak = value;
      peakIndex = i;
    }
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      bestPeakIndex = peakIndex;
      bestTroughIndex = i;
    }
  }

  return {
    maxDrawdown,
    peakIndex: bestPeakIndex,
    troughIndex: bestTroughIndex,
  };
}

