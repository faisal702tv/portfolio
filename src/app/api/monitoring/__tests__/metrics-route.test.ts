import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const hoisted = vi.hoisted(() => ({
  mockGetUserFromRequest: vi.fn(),
  mockGetApiTelemetrySnapshot: vi.fn(),
  mockDispatchMonitoringAlertsToWebhook: vi.fn(),
  mockDb: {
    setting: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-request', () => ({
  getUserFromRequest: hoisted.mockGetUserFromRequest,
}));

vi.mock('@/lib/api-telemetry', () => ({
  withApiTelemetry: (_route: string, handler: (request: NextRequest) => Promise<Response>) => handler,
  getApiTelemetrySnapshot: hoisted.mockGetApiTelemetrySnapshot,
}));

vi.mock('@/lib/db', () => ({
  db: hoisted.mockDb,
}));

vi.mock('@/lib/monitoring-notifier', () => ({
  dispatchMonitoringAlertsToWebhook: hoisted.mockDispatchMonitoringAlertsToWebhook,
}));

import { GET } from '@/app/api/monitoring/metrics/route';

function createRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    url,
    headers: {
      get: (key: string) => normalized[key.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

describe('/api/monitoring/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MONITORING_API_KEY;
    hoisted.mockDb.setting.findUnique.mockResolvedValue(null);
    hoisted.mockGetApiTelemetrySnapshot.mockReturnValue({
      generatedAt: new Date('2026-04-05T00:00:00.000Z').toISOString(),
      totals: {
        requests: 10,
        errors: 1,
        errorRate: 10,
        avgMs: 100,
        p50Ms: 80,
        p95Ms: 150,
        maxMs: 200,
        slowRequests: 0,
      },
      routes: [],
      recent: [],
    });
  });

  it('returns 401 for unauthenticated request without monitoring key', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue(null);

    const response = await GET(createRequest('http://localhost/api/monitoring/metrics'));
    expect(response.status).toBe(401);
  });

  it('returns 403 for authenticated non-admin user', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'u1',
      role: 'user',
      email: 'u1@example.com',
      username: 'u1',
      name: null,
    });

    const response = await GET(createRequest('http://localhost/api/monitoring/metrics'));
    expect(response.status).toBe(403);
  });

  it('returns snapshot for admin user with parsed filters', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin',
      role: 'admin',
      email: 'admin@example.com',
      username: 'admin',
      name: null,
    });

    const response = await GET(
      createRequest('http://localhost/api/monitoring/metrics?windowMinutes=120&limit=10&route=/api/market/snapshot')
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(hoisted.mockGetApiTelemetrySnapshot).toHaveBeenCalledWith({
      windowMinutes: 120,
      limit: 10,
      route: '/api/market/snapshot',
    });
  });

  it('triggers external dispatch flow for admin when alerts exist', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin',
      role: 'admin',
      email: 'admin@example.com',
      username: 'admin',
      name: null,
    });
    hoisted.mockDb.setting.findUnique.mockResolvedValue({
      key: 'user:admin:monitoring_alert_settings',
      value: {
        notificationsEnabled: true,
        thresholds: {
          minRequests: 1,
          p95Ms: 100,
          errorRatePct: 1,
          slowRequests: 1,
          errorsCount: 1,
        },
        external: {
          enabled: true,
          webhookUrl: 'https://hooks.example.com/alert',
          minSeverity: 'warning',
          cooldownMinutes: 1,
        },
      },
    });
    hoisted.mockGetApiTelemetrySnapshot.mockReturnValue({
      generatedAt: new Date('2026-04-05T00:00:00.000Z').toISOString(),
      totals: {
        requests: 200,
        errors: 20,
        errorRate: 10,
        avgMs: 500,
        p50Ms: 300,
        p95Ms: 3000,
        maxMs: 5000,
        slowRequests: 40,
      },
      routes: [],
      recent: [],
    });

    const response = await GET(createRequest('http://localhost/api/monitoring/metrics'));
    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(hoisted.mockDispatchMonitoringAlertsToWebhook).toHaveBeenCalledTimes(1);
  });

  it('allows monitoring key access without user session', async () => {
    process.env.MONITORING_API_KEY = 'secret-key';
    hoisted.mockGetUserFromRequest.mockReturnValue(null);

    const response = await GET(
      createRequest('http://localhost/api/monitoring/metrics', { 'x-monitoring-key': 'secret-key' })
    );

    expect(response.status).toBe(200);
    expect(hoisted.mockGetApiTelemetrySnapshot).toHaveBeenCalledTimes(1);
  });
});
