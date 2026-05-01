import { describe, expect, it } from 'vitest';
import {
  annualizedReturnFromPeriodReturns,
  calculateCAGR,
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVolatility,
  toReturnsFromPrices,
} from '../financials';

describe('financials', () => {
  it('calculates CAGR with high precision', () => {
    const cagr = calculateCAGR(1000, 2000, 5);
    expect(cagr).toBeCloseTo(0.148698355, 8);
  });

  it('creates period returns from price series', () => {
    const returns = toReturnsFromPrices([100, 110, 99]);
    expect(returns).toHaveLength(2);
    expect(returns[0]).toBeCloseTo(0.1, 10);
    expect(returns[1]).toBeCloseTo(-0.1, 10);
  });

  it('calculates annualized volatility from period returns', () => {
    const returns = [0.01, -0.005, 0.008, 0.012, -0.004, 0.007];
    const vol = calculateVolatility(returns, 252);
    expect(vol).toBeGreaterThan(0);
  });

  it('calculates Sharpe and Sortino ratios', () => {
    const returns = [0.009, -0.002, 0.006, 0.004, -0.001, 0.007, 0.003];
    const sharpe = calculateSharpeRatio(returns, 0.02, 252);
    const sortino = calculateSortinoRatio(returns, 0.02, 252);

    expect(Number.isFinite(sharpe)).toBe(true);
    expect(Number.isFinite(sortino)).toBe(true);
    expect(sortino).toBeGreaterThanOrEqual(0);
  });

  it('calculates max drawdown and indexes', () => {
    const prices = [100, 130, 125, 90, 95, 140];
    const dd = calculateMaxDrawdown(prices);

    expect(dd.maxDrawdown).toBeCloseTo((130 - 90) / 130, 8);
    expect(dd.peakIndex).toBe(1);
    expect(dd.troughIndex).toBe(3);
  });

  it('calculates annualized return from periodic returns', () => {
    const daily = Array.from({ length: 252 }, () => 0.0005);
    const annual = annualizedReturnFromPeriodReturns(daily, 252);
    expect(annual).toBeCloseTo(Math.pow(1.0005, 252) - 1, 8);
  });
});

