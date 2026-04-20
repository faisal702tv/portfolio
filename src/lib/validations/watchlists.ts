import { z } from 'zod';

export const createWatchlistSchema = z.object({
  name: z.string().min(1, 'اسم القائمة مطلوب').max(100),
  description: z.string().max(500).optional(),
  color: z.string().max(7).optional(), // hex color
  isDefault: z.boolean().default(false),
});

export const updateWatchlistSchema = createWatchlistSchema.partial();

export const addWatchlistItemSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().optional(),
  market: z.string().optional(),
  marketFlag: z.string().optional(),
  targetPrice: z.number().min(0).optional(),
  alertAbove: z.number().min(0).optional(),
  alertBelow: z.number().min(0).optional(),
  notes: z.string().optional(),
  order: z.number().int().min(0).default(0),
});
