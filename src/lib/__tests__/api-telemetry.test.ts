import { beforeEach, describe, expect, it } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import {
  getApiTelemetrySnapshot,
  resetApiTelemetryStoreForTests,
  withApiTelemetry,
} from '@/lib/api-telemetry';

function createRequest(method = 'GET', requestId?: string): NextRequest {
  return {
    method,
    headers: {
      get: (key: string) => (key.toLowerCase() === 'x-request-id' ? requestId || null : null),
    },
  } as unknown as NextRequest;
}

describe('api telemetry', () => {
  beforeEach(() => {
    resetApiTelemetryStoreForTests();
    delete process.env.API_TELEMETRY_ENABLED;
    delete process.env.API_TELEMETRY_SLOW_MS;
  });

  it('records successful responses and appends telemetry headers', async () => {
    const handler = withApiTelemetry('/api/test/success', async () => {
      return NextResponse.json({ ok: true }, { status: 201 });
    });

    const response = await handler(createRequest('POST'));
    const snapshot = getApiTelemetrySnapshot({ route: '/api/test/success', windowMinutes: 5 });

    expect(response.status).toBe(201);
    expect(response.headers.get('x-request-id')).toBeTruthy();
    expect(response.headers.get('x-response-time-ms')).toBeTruthy();
    expect(response.headers.get('server-timing')).toContain('app;dur=');

    expect(snapshot.totals.requests).toBe(1);
    expect(snapshot.totals.errors).toBe(0);
    expect(snapshot.routes).toHaveLength(1);
    expect(snapshot.routes[0].method).toBe('POST');
    expect(snapshot.routes[0].route).toBe('/api/test/success');
  });

  it('records thrown errors as failed telemetry events', async () => {
    const handler = withApiTelemetry('/api/test/failure', async () => {
      throw new Error('boom');
    });

    await expect(handler(createRequest('GET', 'req-123'))).rejects.toThrow('boom');
    const snapshot = getApiTelemetrySnapshot({ route: '/api/test/failure', windowMinutes: 5 });

    expect(snapshot.totals.requests).toBe(1);
    expect(snapshot.totals.errors).toBe(1);
    expect(snapshot.recent).toHaveLength(1);
    expect(snapshot.recent[0].status).toBe(500);
    expect(snapshot.recent[0].requestId).toBe('req-123');
    expect(snapshot.recent[0].error).toContain('boom');
  });

  it('supports snapshot filtering by route and limit', async () => {
    const alpha = withApiTelemetry('/api/alpha', async () => NextResponse.json({ ok: true }));
    const beta = withApiTelemetry('/api/beta', async () => NextResponse.json({ ok: true }));

    await alpha(createRequest('GET'));
    await beta(createRequest('GET'));
    await alpha(createRequest('GET'));

    const alphaOnly = getApiTelemetrySnapshot({ route: '/api/alpha', limit: 1, windowMinutes: 5 });

    expect(alphaOnly.totals.requests).toBe(2);
    expect(alphaOnly.routes).toHaveLength(1);
    expect(alphaOnly.routes[0].route).toBe('/api/alpha');
    expect(alphaOnly.recent).toHaveLength(1);
  });

  it('preserves set-cookie headers from original response', async () => {
    const handler = withApiTelemetry('/api/cookies', async () => {
      const response = NextResponse.json({ ok: true });
      response.cookies.set('access_token', 'cookie-value', {
        httpOnly: true,
        path: '/',
      });
      return response;
    });

    const response = await handler(createRequest('GET'));
    const setCookie = response.headers.get('set-cookie') || '';

    expect(setCookie).toContain('access_token=cookie-value');
  });
});
