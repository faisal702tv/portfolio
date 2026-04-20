import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchMonitoringAlertsToWebhook,
  resetMonitoringNotifierStateForTests,
  sendMonitoringTestWebhook,
} from '@/lib/monitoring-notifier';
import { DEFAULT_MONITORING_ALERT_SETTINGS } from '@/lib/monitoring-alerts';

describe('monitoring notifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMonitoringNotifierStateForTests();
  });

  it('dispatches webhook for eligible alerts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await dispatchMonitoringAlertsToWebhook(
      {
        ...DEFAULT_MONITORING_ALERT_SETTINGS,
        external: {
          enabled: true,
          webhookUrl: 'https://hooks.example.com/alerts',
          minSeverity: 'warning',
          cooldownMinutes: 10,
        },
      },
      [
        {
          id: 'p95-warning',
          metric: 'p95',
          severity: 'warning',
          title: 'P95 عالي',
          message: 'مرتفع',
          value: 2000,
          threshold: 1500,
        },
      ],
      {
        windowMinutes: 60,
        route: '/api/market/snapshot',
        generatedAt: new Date().toISOString(),
        totals: {
          requests: 100,
          errors: 0,
          errorRate: 0,
          avgMs: 100,
          p50Ms: 80,
          p95Ms: 2000,
          maxMs: 2500,
          slowRequests: 20,
        },
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('honors min severity and cooldown', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const settings = {
      ...DEFAULT_MONITORING_ALERT_SETTINGS,
      external: {
        enabled: true,
        webhookUrl: 'https://hooks.example.com/alerts',
        minSeverity: 'critical' as const,
        cooldownMinutes: 10,
      },
    };
    const context = {
      windowMinutes: 60,
      route: '/api/market/snapshot',
      generatedAt: new Date().toISOString(),
      totals: {
        requests: 100,
        errors: 20,
        errorRate: 20,
        avgMs: 500,
        p50Ms: 300,
        p95Ms: 3000,
        maxMs: 5000,
        slowRequests: 40,
      },
    };

    await dispatchMonitoringAlertsToWebhook(
      settings,
      [
        {
          id: 'warning-only',
          metric: 'p95',
          severity: 'warning',
          title: 'تحذير',
          message: 'x',
          value: 1,
          threshold: 1,
        },
      ],
      context
    );
    expect(fetchMock).toHaveBeenCalledTimes(0);

    const criticalAlert = {
      id: 'critical-1',
      metric: 'errors_count' as const,
      severity: 'critical' as const,
      title: 'حرج',
      message: 'y',
      value: 10,
      threshold: 5,
    };

    await dispatchMonitoringAlertsToWebhook(settings, [criticalAlert], context);
    await dispatchMonitoringAlertsToWebhook(settings, [criticalAlert], context);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends test webhook when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await sendMonitoringTestWebhook({
      ...DEFAULT_MONITORING_ALERT_SETTINGS,
      external: {
        enabled: true,
        webhookUrl: 'https://hooks.example.com/test',
        minSeverity: 'critical',
        cooldownMinutes: 10,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
