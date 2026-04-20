import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const hoisted = vi.hoisted(() => ({
  mockGetUserFromRequest: vi.fn(),
  mockSendMonitoringTestWebhook: vi.fn(),
  mockDb: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-request', () => ({
  getUserFromRequest: hoisted.mockGetUserFromRequest,
}));

vi.mock('@/lib/db', () => ({
  db: hoisted.mockDb,
}));

vi.mock('@/lib/api-telemetry', () => ({
  withApiTelemetry: (_route: string, handler: (request: NextRequest) => Promise<Response>) => handler,
}));

vi.mock('@/lib/monitoring-notifier', () => ({
  sendMonitoringTestWebhook: hoisted.mockSendMonitoringTestWebhook,
}));

import { GET, POST, PUT } from '@/app/api/monitoring/alert-settings/route';

function createRequest(url: string, body?: unknown): NextRequest {
  return {
    url,
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as unknown as NextRequest;
}

describe('/api/monitoring/alert-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.mockDb.setting.findUnique.mockResolvedValue(null);
    hoisted.mockDb.setting.upsert.mockResolvedValue({ key: 'ok' });
  });

  it('returns 401 for unauthenticated request', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue(null);
    const response = await GET(createRequest('http://localhost/api/monitoring/alert-settings'));
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'u1',
      role: 'user',
      email: 'u1@example.com',
      username: 'u1',
      name: null,
    });
    const response = await GET(createRequest('http://localhost/api/monitoring/alert-settings'));
    expect(response.status).toBe(403);
  });

  it('returns default settings when no saved settings exist', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin-1',
      role: 'admin',
      email: 'a@example.com',
      username: 'admin',
      name: null,
    });

    const response = await GET(createRequest('http://localhost/api/monitoring/alert-settings'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.settings.notificationsEnabled).toBe(true);
    expect(json.settings.thresholds.minRequests).toBeGreaterThan(0);
    expect(json.settings.external.enabled).toBe(false);
  });

  it('normalizes malformed stored settings', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin-1',
      role: 'admin',
      email: 'a@example.com',
      username: 'admin',
      name: null,
    });

    hoisted.mockDb.setting.findUnique.mockResolvedValue({
      key: 'user:admin-1:monitoring_alert_settings',
      value: {
        notificationsEnabled: false,
        thresholds: {
          minRequests: -10,
          p95Ms: 0,
          errorRatePct: 0,
          slowRequests: 0,
          errorsCount: 0,
        },
      },
    });

    const response = await GET(createRequest('http://localhost/api/monitoring/alert-settings'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.settings.notificationsEnabled).toBe(false);
    expect(json.settings.thresholds.minRequests).toBe(1);
    expect(json.settings.thresholds.p95Ms).toBe(100);
    expect(json.settings.external.enabled).toBe(false);
  });

  it('saves normalized settings for admin user', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin-1',
      role: 'admin',
      email: 'a@example.com',
      username: 'admin',
      name: null,
    });

    const response = await PUT(
      createRequest('http://localhost/api/monitoring/alert-settings', {
        settings: {
          notificationsEnabled: true,
          thresholds: {
            minRequests: -5,
            p95Ms: 50,
            errorRatePct: 0,
            slowRequests: 0,
            errorsCount: 0,
          },
          external: {
            enabled: true,
            webhookUrl: 'https://hooks.example.com',
            minSeverity: 'warning',
            cooldownMinutes: 0,
          },
        },
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(hoisted.mockDb.setting.upsert).toHaveBeenCalledTimes(1);
    expect(json.settings.thresholds.minRequests).toBe(1);
    expect(json.settings.thresholds.p95Ms).toBe(100);
    expect(json.settings.thresholds.errorRatePct).toBe(0.1);
    expect(json.settings.external.enabled).toBe(true);
    expect(json.settings.external.cooldownMinutes).toBe(1);
  });

  it('returns 400 when payload is not an object', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin-1',
      role: 'admin',
      email: 'a@example.com',
      username: 'admin',
      name: null,
    });

    const response = await PUT(
      createRequest('http://localhost/api/monitoring/alert-settings', {
        settings: [],
      })
    );

    expect(response.status).toBe(400);
  });

  it('sends webhook test message for admin user', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin-1',
      role: 'admin',
      email: 'a@example.com',
      username: 'admin',
      name: null,
    });
    hoisted.mockDb.setting.findUnique.mockResolvedValue({
      key: 'user:admin-1:monitoring_alert_settings',
      value: {
        notificationsEnabled: true,
        thresholds: {
          minRequests: 20,
          p95Ms: 1500,
          errorRatePct: 3,
          slowRequests: 10,
          errorsCount: 5,
        },
        external: {
          enabled: true,
          webhookUrl: 'https://hooks.example.com/test',
          minSeverity: 'critical',
          cooldownMinutes: 10,
        },
      },
    });

    const response = await POST(createRequest('http://localhost/api/monitoring/alert-settings', {}));
    expect(response.status).toBe(200);
    expect(hoisted.mockSendMonitoringTestWebhook).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when webhook test is not configured', async () => {
    hoisted.mockGetUserFromRequest.mockReturnValue({
      id: 'admin-1',
      role: 'admin',
      email: 'a@example.com',
      username: 'admin',
      name: null,
    });

    const response = await POST(createRequest('http://localhost/api/monitoring/alert-settings', {}));
    expect(response.status).toBe(400);
  });
});
