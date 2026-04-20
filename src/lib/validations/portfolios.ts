import { z } from 'zod';

export const createPortfolioSchema = z.object({
  name: z.string().min(1, 'اسم المحفظة مطلوب').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['stocks', 'bonds', 'funds', 'mixed']).default('mixed'),
  currency: z.string().length(3).default('SAR'),
});

export const updatePortfolioSchema = createPortfolioSchema.partial().required({ name: true });

export const addStockSchema = z.object({
  symbol: z.string().min(1, 'رمز السهم مطلوب'),
  name: z.string().min(1, 'اسم السهم مطلوب'),
  exchangeId: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  qty: z.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  buyPrice: z.number().min(0, 'سعر الشراء يجب أن يكون 0 أو أكثر'),
  buyDate: z.string().datetime().optional(),
  buyCurrency: z.string().length(3).default('SAR'),
  notes: z.string().optional(),
});

export const updateStockSchema = addStockSchema.partial();

export const deleteStockSchema = z.object({
  id: z.string().min(1, 'معرف السهم مطلوب'),
});

export const addBondSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().optional(),
  type: z.enum(['bond', 'sukuk']).default('bond'),
  faceValue: z.number().positive(),
  couponRate: z.number().min(0).max(100).optional(),
  maturityDate: z.string().datetime().optional(),
  issueDate: z.string().datetime().optional(),
  qty: z.number().positive(),
  buyPrice: z.number().min(0).max(200),
  buyYield: z.number().optional(),
  buyDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const addFundSchema = z.object({
  symbol: z.string().optional(),
  name: z.string().min(1),
  fundType: z.enum(['equity', 'bond', 'mixed', 'money_market', 'real_estate']).optional(),
  units: z.number().positive(),
  buyPrice: z.number().positive(),
  buyDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const addTransactionSchema = z.object({
  type: z.enum(['buy', 'sell', 'dividend', 'split']),
  assetType: z.enum(['stock', 'bond', 'fund']),
  assetSymbol: z.string().min(1),
  assetName: z.string().min(1),
  qty: z.number(),
  price: z.number().min(0),
  total: z.number().min(0),
  fees: z.number().min(0).optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
});
