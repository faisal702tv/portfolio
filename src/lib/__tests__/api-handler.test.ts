import { describe, it, expect, vi } from 'vitest';

process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';

// Mock auth
vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn().mockReturnValue({ id: '1', email: 'test@test.com', username: 'test', name: null, role: 'user' }),
}));

import { createHandler, createPublicHandler, success, apiError } from '../api-handler';

// Mock NextRequest
function createMockRequest(options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  return {
    method: options.method || 'GET',
    headers: {
      get: (key: string) => options.headers?.[key] || null,
    },
    json: () => Promise.resolve(options.body || {}),
    nextUrl: { pathname: '/api/test' },
  } as any;
}

describe('API Handler', () => {
  describe('createHandler - auth', () => {
    it('should return 401 when no token provided', async () => {
      const handler = createHandler({ auth: true }, async ({ user }) => {
        return success({ userId: user.id });
      });

      const req = createMockRequest();
      const res = await handler(req);

      expect(res.status).toBe(401);
    });

    it('should allow request with valid token', async () => {
      const handler = createHandler({ auth: true }, async ({ user }) => {
        return success({ userId: user.id });
      });

      const req = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = await handler(req);

      expect(res.status).toBe(200);
    });
  });

  describe('createHandler - rate limiting', () => {
    it('should allow requests within limit', async () => {
      const handler = createPublicHandler(
        { rateLimit: { windowMs: 60_000, maxRequests: 5 } },
        async (request) => success({ ok: true })
      );

      const req = createMockRequest();
      
      for (let i = 0; i < 5; i++) {
        const res = await handler(req);
        expect(res.status).toBe(200);
      }
    });

    it('should block requests exceeding limit', async () => {
      const handler = createPublicHandler(
        { rateLimit: { windowMs: 60_000, maxRequests: 3 } },
        async (request) => success({ ok: true })
      );

      const req = createMockRequest();
      
      // Exhaust limit
      for (let i = 0; i < 3; i++) {
        await handler(req);
      }
      
      // 4th should be rate limited
      const res = await handler(req);
      expect(res.status).toBe(429);
    });
  });

  describe('success / apiError helpers', () => {
    it('should create success response', () => {
      const res = success({ data: 'test' });
      expect(res.status).toBe(200);
    });

    it('should create error response', () => {
      const res = apiError('Something went wrong', 400);
      expect(res.status).toBe(400);
    });
  });
});
