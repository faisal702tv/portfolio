import { z } from 'zod';

export const createAlertSchema = z.object({
  symbol: z.string().min(1, 'رمز الأصل مطلوب'),
  name: z.string().optional(),
  type: z.enum(['price_up', 'price_down', 'pct_up', 'pct_down']),
  targetValue: z.number().positive('قيمة الهدف يجب أن تكون أكبر من صفر'),
});

export const updateAlertSchema = createAlertSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const deleteAlertSchema = z.object({
  id: z.string().min(1),
});
