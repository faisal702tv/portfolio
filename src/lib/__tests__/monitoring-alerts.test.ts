import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MONITORING_ALERT_THRESHOLDS,
  evaluateMonitoringAlerts,
  normalizeMonitoringAlertSettings,
  normalizeMonitoringAlertThresholds,
  severityAtLeast,
} from '@/lib/monitoring-alerts';

describe('monitoring alerts', () => {
  it('normalizes thresholds and enforces minimum bounds', () => {
    const normalized = normalizeMonitoringAlertThresholds({
      minRequests: -10,
      p95Ms: 0,
      errorRatePct: 0,
      slowRequests: 0,
      errorsCount: -1,
    });

    expect(normalized.minRequests).toBe(1);
    expect(normalized.p95Ms).toBe(100);
    expect(normalized.errorRatePct).toBe(0.1);
    expect(normalized.slowRequests).toBe(1);
    expect(normalized.errorsCount).toBe(1);
  });

  it('supports legacy settings shape and notifications flag', () => {
    const normalized = normalizeMonitoringAlertSettings({
      notificationsEnabled: false,
      minRequests: 5,
      p95Ms: 1200,
      errorRatePct: 2,
      slowRequests: 4,
      errorsCount: 2,
    });

    expect(normalized.notificationsEnabled).toBe(false);
    expect(normalized.thresholds.minRequests).toBe(5);
    expect(normalized.thresholds.p95Ms).toBe(1200);
    expect(normalized.external.enabled).toBe(false);
    expect(normalized.external.minSeverity).toBe('critical');
  });

  it('normalizes external notification settings', () => {
    const normalized = normalizeMonitoringAlertSettings({
      notificationsEnabled: true,
      thresholds: {
        minRequests: 5,
        p95Ms: 1200,
        errorRatePct: 2,
        slowRequests: 4,
        errorsCount: 2,
      },
      external: {
        enabled: true,
        webhookUrl: '  https://hooks.example.com/path  ',
        minSeverity: 'warning',
        cooldownMinutes: 0,
      },
    });

    expect(normalized.external.enabled).toBe(true);
    expect(normalized.external.webhookUrl).toBe('https://hooks.example.com/path');
    expect(normalized.external.minSeverity).toBe('warning');
    expect(normalized.external.cooldownMinutes).toBe(1);
  });

  it('returns no alerts when request volume is below minimum', () => {
    const alerts = evaluateMonitoringAlerts(
      {
        requests: 5,
        errors: 5,
        errorRate: 50,
        avgMs: 900,
        p50Ms: 200,
        p95Ms: 2500,
        maxMs: 3000,
        slowRequests: 20,
      },
      DEFAULT_MONITORING_ALERT_THRESHOLDS
    );

    expect(alerts).toHaveLength(0);
  });

  it('detects warning and critical alerts with severity ordering', () => {
    const alerts = evaluateMonitoringAlerts(
      {
        requests: 100,
        errors: 12,
        errorRate: 8,
        avgMs: 600,
        p50Ms: 300,
        p95Ms: 4000,
        maxMs: 7000,
        slowRequests: 40,
      },
      {
        minRequests: 20,
        p95Ms: 1500,
        errorRatePct: 3,
        slowRequests: 10,
        errorsCount: 5,
      }
    );

    expect(alerts.length).toBeGreaterThanOrEqual(4);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts.some((alert) => alert.metric === 'p95')).toBe(true);
    expect(alerts.some((alert) => alert.metric === 'error_rate')).toBe(true);
    expect(alerts.some((alert) => alert.metric === 'slow_requests')).toBe(true);
    expect(alerts.some((alert) => alert.metric === 'errors_count')).toBe(true);
  });

  it('checks severity thresholds correctly', () => {
    expect(severityAtLeast('critical', 'critical')).toBe(true);
    expect(severityAtLeast('warning', 'critical')).toBe(false);
    expect(severityAtLeast('warning', 'warning')).toBe(true);
  });
});
