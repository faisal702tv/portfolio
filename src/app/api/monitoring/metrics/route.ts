import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-request';
import { getApiTelemetrySnapshot, withApiTelemetry } from '@/lib/api-telemetry';
import { db } from '@/lib/db';
import {
  DEFAULT_MONITORING_ALERT_SETTINGS,
  evaluateMonitoringAlerts,
  normalizeMonitoringAlertSettings,
} from '@/lib/monitoring-alerts';
import { dispatchMonitoringAlertsToWebhook } from '@/lib/monitoring-notifier';

function parsePositiveInt(raw: string | null, fallback: number, maxValue: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maxValue);
}

function hasMonitoringApiKey(request: NextRequest): boolean {
  const configuredKey = process.env.MONITORING_API_KEY?.trim();
  if (!configuredKey) return false;

  const fromHeader = request.headers.get('x-monitoring-key')?.trim();
  const fromQuery = new URL(request.url).searchParams.get('key')?.trim();
  const provided = fromHeader || fromQuery;

  return Boolean(provided && provided === configuredKey);
}

const ALERT_SETTINGS_KEY = 'monitoring_alert_settings';

function scopedSettingKey(userId: string, key: string): string {
  return `user:${userId}:${key}`;
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function maybeDispatchMonitoringWebhook(params: {
  userId: string;
  windowMinutes: number;
  route: string | null;
  snapshot: ReturnType<typeof getApiTelemetrySnapshot>;
}) {
  try {
    const key = scopedSettingKey(params.userId, ALERT_SETTINGS_KEY);
    const setting = await db.setting.findUnique({ where: { key } });
    const settings = setting
      ? normalizeMonitoringAlertSettings(readObject(setting.value))
      : DEFAULT_MONITORING_ALERT_SETTINGS;

    const alerts = evaluateMonitoringAlerts(params.snapshot.totals, settings.thresholds);
    if (alerts.length === 0) return;

    await dispatchMonitoringAlertsToWebhook(settings, alerts, {
      windowMinutes: params.windowMinutes,
      route: params.route,
      generatedAt: params.snapshot.generatedAt,
      totals: params.snapshot.totals,
    });
  } catch (error) {
    console.error('Monitoring webhook dispatch flow failed:', error);
  }
}

async function getMetrics(request: NextRequest) {
  const user = getUserFromRequest(request);
  const isApiKeyAuthorized = hasMonitoringApiKey(request);

  if (!isApiKeyAuthorized) {
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
  }

  const url = new URL(request.url);
  const windowMinutes = parsePositiveInt(url.searchParams.get('windowMinutes'), 60, 24 * 60);
  const limit = parsePositiveInt(url.searchParams.get('limit'), 40, 200);
  const route = url.searchParams.get('route')?.trim() || undefined;

  const snapshot = getApiTelemetrySnapshot({ windowMinutes, limit, route });

  if (user?.role === 'admin') {
    void maybeDispatchMonitoringWebhook({
      userId: user.id,
      windowMinutes,
      route: route || null,
      snapshot,
    });
  }

  return NextResponse.json({
    success: true,
    filters: {
      windowMinutes,
      limit,
      route: route || null,
    },
    snapshot,
  });
}

export const GET = withApiTelemetry('/api/monitoring/metrics', getMetrics);
