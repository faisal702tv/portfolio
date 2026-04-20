import { z } from 'zod';

export const loginSchema = z.object({
  action: z.literal('login'),
  email: z.string().min(1, 'البريد الإلكتروني أو اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const registerSchema = z.object({
  action: z.literal('register'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  username: z.string()
    .min(6, 'اسم المستخدم يجب أن يكون 6 أحرف على الأقل')
    .max(20, 'اسم المستخدم يجب ألا يتجاوز 20 حرفاً')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .regex(/[a-zA-Z]/, 'كلمة المرور يجب أن تحتوي على أحرف')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على أرقام'),
  name: z.string().optional(),
});

export const authSchema = z.discriminatedUnion('action', [loginSchema, registerSchema]);

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token مطلوب'),
});
