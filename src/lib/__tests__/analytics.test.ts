import { describe, it, expect } from 'vitest';
import {
  standardDeviation,
  maxDrawdown,
  calculateRiskMetrics,
  calculateSectorAllocation,
  analyzePortfolio,
  calcTotalValue,
  calcTotalCost,
} from '../analytics';

const mockAssets = [
  { symbol: '1120', name: 'الراجحي', qty: 100, buyPrice: 80, currentPrice: 90, sector: 'بنوك' },
  { symbol: '2220', name: 'سابك', qty: 50, buyPrice: 40, currentPrice: 35, sector: 'بتروكيماويات' },
  { symbol: '4330', name: 'أرامكو', qty: 200, buyPrice: 30, currentPrice: 32, sector: 'طاقة' },
  { symbol: '1150', name: 'الأهلي', qty: 150, buyPrice: 45, currentPrice: 50, sector: 'بنوك' },
];

describe('Analytics', () => {
  describe('calcTotalValue', () => {
    it('should sum all asset values at current price', () => {
      const expected = (100 * 90) + (50 * 35) + (200 * 32) + (150 * 50);
      expect(calcTotalValue(mockAssets)).toBe(expected);
    });

    it('should fall back to buy price if no current price', () => {
      const assets = [{ symbol: 'A', name: 'Test', qty: 10, buyPrice: 50, currentPrice: null }];
      expect(calcTotalValue(assets)).toBe(500);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate correctly', () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.005];
      const std = standardDeviation(returns);
      expect(std).toBeGreaterThan(0);
    });

    it('should return 0 for single value', () => {
      expect(standardDeviation([0.05])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(standardDeviation([])).toBe(0);
    });
  });

  describe('maxDrawdown', () => {
    it('should find the maximum drawdown', () => {
      const values = [100, 110, 105, 120, 90, 115];
      const { drawdown, duration } = maxDrawdown(values);
      // Max drawdown: from 120 to 90 = 25%
      expect(drawdown).toBeCloseTo(0.25, 2);
    });

    it('should return 0 for ascending values', () => {
      const values = [100, 110, 120, 130];
      const { drawdown } = maxDrawdown(values);
      expect(drawdown).toBe(0);
    });
  });

  describe('calculateRiskMetrics', () => {
    it('should return valid risk metrics', () => {
      const metrics = calculateRiskMetrics(mockAssets);
      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(metrics.beta).toBeDefined();
      expect(metrics.alpha).toBeDefined();
      expect(metrics.sortinoRatio).toBeDefined();
      expect(metrics.calmarRatio).toBeDefined();
    });
  });

  describe('calculateSectorAllocation', () => {
    it('should group assets by sector', () => {
      const allocation = calculateSectorAllocation(mockAssets);
      expect(allocation.length).toBe(3);

      const banks = allocation.find(a => a.sector === 'بنوك');
      expect(banks).toBeDefined();
      expect(banks!.weight).toBeGreaterThan(0);

      // All weights should sum to ~1
      const totalWeight = allocation.reduce((sum, a) => sum + a.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 5);
    });
  });

  describe('analyzePortfolio (full analysis)', () => {
    it('should return complete analytics', () => {
      const result = analyzePortfolio(mockAssets);

      expect(result.totalValue).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.profitLoss).toBeDefined();
      expect(result.profitLossPct).toBeDefined();
      expect(result.riskMetrics.sharpeRatio).toBeDefined();
      expect(result.sectorAllocation.length).toBeGreaterThan(0);
    });

    it('should include rebalance suggestions when targets provided', () => {
      const result = analyzePortfolio(mockAssets, {
        targetAllocation: [
          { sector: 'بنوك', weight: 0.4 },
          { sector: 'بتروكيماويات', weight: 0.3 },
          { sector: 'طاقة', weight: 0.3 },
        ],
      });

      expect(result.rebalanceSuggestions.length).toBeGreaterThan(0);
      expect(result.rebalanceSuggestions.some(s => s.action !== 'hold')).toBe(true);
    });
  });
});
