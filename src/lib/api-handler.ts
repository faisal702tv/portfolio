/**
 * Unified API Route Handler with Auth, Validation, Rate Limiting
 * All API routes should use this instead of raw NextRequest handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, UserPayload } from '@/lib/auth';
import { ZodSchema, ZodError } from 'zod';

// ─── Types ────────────────────────────────────────────────────

export interface ApiContext {
  request: NextRequest;
  user: UserPayload;
  params?: Record<string, string>;
}

type HandlerFn = (ctx: ApiContext) => Promise<NextResponse> | NextResponse;
type PublicHandlerFn = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> | NextResponse;

interface RouteConfig {
  /** Require authentication (default: true) */
  auth?: boolean;
  /** Zod schema to validate request body */
  bodySchema?: ZodSchema;
  /** Rate limit: max requests per window */
  rateLimit?: { windowMs: number; maxRequests: number };
  /** Allow specific roles only */
  roles?: string[];
}

// ─── Simple In-Memory Rate Limiter (for SQLite setups) ───────
// In production with Upstash Redis, use the @upstash/ratelimit package

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(key: string, windowMs: number, maxRequests: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetTime };
}

// ─── Main Handler Factory ─────────────────────────────────────

/**
 * Create a protected API route handler with auth, validation, and rate limiting.
 *
 * @example
 * ```ts
 * const myHandler = createHandler({
 *   auth: true,
 *   bodySchema: mySchema,
 *   rateLimit: { windowMs: 60_000, maxRequests: 30 },
 *   roles: ['admin'],
 * }, async ({ request, user, params }) => {
 *   return NextResponse.json({ success: true });
 * });
 *
 * export const GET = myHandler;
 * export const POST = myHandler;
 * ```
 */
export function createHandler(config: RouteConfig, handler: HandlerFn) {
  return async (request: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => {
    const params = ctx?.params ? await ctx.params : undefined;
    try {
      // ── Rate Limiting ──
      if (config.rateLimit) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const { allowed, remaining, resetAt } = checkRateLimit(
          `${ip}:${request.nextUrl.pathname}`,
          config.rateLimit.windowMs,
          config.rateLimit.maxRequests
        );

        if (!allowed) {
          return NextResponse.json(
            { error: 'طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(resetAt).toISOString(),
                'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
              },
            }
          );
        }

        // Add rate limit headers to response
        const response = await _executeHandler(config, handler, request, params);
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(resetAt).toISOString());
        return response;
      }

      return await _executeHandler(config, handler, request, params);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

async function _executeHandler(
  config: RouteConfig,
  handler: HandlerFn,
  request: NextRequest,
  params?: Record<string, string>
): Promise<NextResponse> {
  // ── Authentication ──
  const requireAuth = config.auth !== false;
  let user: UserPayload | null = null;

  if (requireAuth) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'رمز غير صالح أو منتهي الصلاحية' }, { status: 401 });
    }

    // ── Role Check ──
    if (config.roles?.length && !config.roles.includes(user.role)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لهذا الإجراء' }, { status: 403 });
    }
  }

  // ── Body Validation ──
  if (config.bodySchema && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
    try {
      const body = await request.json();
      const result = config.bodySchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            error: 'بيانات غير صالحة',
            details: result.error.issues.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'جسم الطلب غير صالح (JSON expected)' }, { status: 400 });
    }
  }

  // ── Execute Handler ──
  return handler({ request, user: user!, params });
}

// ─── Public Handler (no auth required) ────────────────────────

export function createPublicHandler(handlerOrConfig?: PublicHandlerFn | { rateLimit?: RouteConfig['rateLimit'] }, handlerOrUndefined?: PublicHandlerFn) {
  const hasConfig = handlerOrConfig && typeof handlerOrConfig !== 'function';
  const config = hasConfig ? handlerOrConfig as { rateLimit?: RouteConfig['rateLimit'] } : undefined;
  const handler = hasConfig ? handlerOrUndefined! : handlerOrConfig as PublicHandlerFn;
  
  return async (request: NextRequest, ctx?: { params?: Promise<Record<string, string>> }) => {
    const params = ctx?.params ? await ctx.params : undefined;
    try {
      if (config?.rateLimit) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') || 'unknown';
        const { allowed, remaining, resetAt } = checkRateLimit(
          `${ip}:${request.nextUrl.pathname}`,
          config.rateLimit.windowMs,
          config.rateLimit.maxRequests
        );

        if (!allowed) {
          return NextResponse.json(
            { error: 'طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString() } }
          );
        }

        const response = await handler!(request, { params: Promise.resolve(params || {}) });
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        return response;
      }

      return await handler!(request, { params: Promise.resolve(params || {}) });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ─── Error Handler ────────────────────────────────────────────

function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'خطأ في التحقق من البيانات',
        details: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('JWT_SECRET')) {
      return NextResponse.json({ error: 'خطأ في إعدادات الخادم' }, { status: 500 });
    }
  }

  // Don't leak internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' },
    { status: 500 }
  );
}

// ─── Convenience Helpers ──────────────────────────────────────

/** Create a success response */
export function success(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/** Create an error response */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Get authenticated user from request, or return 401 */
export function getAuthUser(request: NextRequest): UserPayload | NextResponse {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const user = verifyToken(authHeader.substring(7));
  if (!user) {
    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
  }
  return user;
}
