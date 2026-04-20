import { describe, it, expect } from 'vitest';
import {
  authSchema,
  loginSchema,
  registerSchema,
  createPortfolioSchema,
  addStockSchema,
  addBondSchema,
  addFundSchema,
  createWatchlistSchema,
  createAlertSchema,
  addTransactionSchema,
} from '..';

describe('Auth Schemas', () => {
  describe('authSchema (discriminated union)', () => {
    it('should validate login action', () => {
      const result = authSchema.safeParse({
        action: 'login',
        email: 'user@test.com',
        password: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject login with missing fields', () => {
      const result = authSchema.safeParse({
        action: 'login',
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should validate register action', () => {
      const result = authSchema.safeParse({
        action: 'register',
        email: 'new@test.com',
        username: 'newuser',
        password: 'Secure123',
        name: 'New User',
      });
      expect(result.success).toBe(true);
    });

    it('should reject register with weak password', () => {
      const result = authSchema.safeParse({
        action: 'register',
        email: 'new@test.com',
        username: 'newuser',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should reject unknown actions', () => {
      const result = authSchema.safeParse({
        action: 'delete',
        email: 'test@test.com',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Portfolio Schemas', () => {
  it('should validate create portfolio', () => {
    const result = createPortfolioSchema.safeParse({
      name: 'محفظتي',
      description: 'محفظة تجريبية',
      type: 'mixed',
      currency: 'SAR',
    });
    expect(result.success).toBe(true);
  });

  it('should reject portfolio without name', () => {
    const result = createPortfolioSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should validate add stock', () => {
    const result = addStockSchema.safeParse({
      symbol: '1120',
      name: 'الراجحي',
      qty: 100,
      buyPrice: 85.5,
      buyDate: '2024-01-15T10:00:00Z',
      buyCurrency: 'SAR',
    });
    expect(result.success).toBe(true);
  });

  it('should reject stock with zero qty', () => {
    const result = addStockSchema.safeParse({
      symbol: '1120',
      name: 'الراجحي',
      qty: 0,
      buyPrice: 85.5,
    });
    expect(result.success).toBe(false);
  });

  it('should validate add bond', () => {
    const result = addBondSchema.safeParse({
      symbol: 'SUK001',
      name: 'صكوك حكومية',
      type: 'sukuk',
      faceValue: 1000,
      couponRate: 5.5,
      qty: 10,
      buyPrice: 98.5,
    });
    expect(result.success).toBe(true);
  });

  it('should validate add fund', () => {
    const result = addFundSchema.safeParse({
      name: 'صندوق الأمانة',
      fundType: 'equity',
      units: 500,
      buyPrice: 12.5,
    });
    expect(result.success).toBe(true);
  });

  it('should validate add transaction', () => {
    const result = addTransactionSchema.safeParse({
      type: 'buy',
      assetType: 'stock',
      assetSymbol: '1120',
      assetName: 'الراجحي',
      qty: 100,
      price: 85.5,
      total: 8550,
      fees: 17.5,
      date: '2024-01-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid transaction type', () => {
    const result = addTransactionSchema.safeParse({
      type: 'invalid',
      assetType: 'stock',
      assetSymbol: '1120',
      assetName: 'الراجحي',
      qty: 100,
      price: 85.5,
      total: 8550,
      date: '2024-01-15T10:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('Alert Schemas', () => {
  it('should validate create alert', () => {
    const result = createAlertSchema.safeParse({
      symbol: '1120',
      name: 'الراجحي',
      type: 'price_up',
      targetValue: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should reject alert with zero target', () => {
    const result = createAlertSchema.safeParse({
      symbol: '1120',
      type: 'price_up',
      targetValue: 0,
    });
    expect(result.success).toBe(false);
  });
});
