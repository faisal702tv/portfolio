import type {
  MonitoringAlert,
  MonitoringAlertSettings,
  MonitoringTotals,
} from '@/lib/monitoring-alerts';
import { severityAtLeast } from '@/lib/monitoring-alerts';

interface DispatchContext {
  windowMinutes: number;
  route: string | null;
  generatedAt: string;
  totals: MonitoringTotals;
}

interface MonitoringWebhookPayload {
  text: string;
  source: 'portfolio-monitoring';
  timestamp: string;
  alert: MonitoringAlert;
  alerts: MonitoringAlert[];
  context: DispatchContext;
}

type AlertCooldownStore = Map<string, number>;

const globalStore = globalThis as typeof globalThis & {
  __monitoringAlertCooldown?: AlertCooldownStore;
};

function getCooldownStore(): AlertCooldownStore {
  if (!globalStore.__monitoringAlertCooldown) {
    globalStore.__monitoringAlertCooldown = new Map<string, number>();
  }
  return globalStore.__monitoringAlertCooldown;
}

function now(): number {
  return Date.now();
}

function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function buildDispatchKey(webhookUrl: string, alert: MonitoringAlert, context: DispatchContext): string {
  return `${webhookUrl}|${context.route || 'all'}|${alert.id}`;
}

function formatAlertText(alert: MonitoringAlert): string {
  const level = alert.severity === 'critical' ? 'CRITICAL' : 'WARNING';
  return `[Portfolio Monitoring][${level}] ${alert.title} — ${alert.message}`;
}

async function postWebhook(webhookUrl: string, payload: MonitoringWebhookPayload): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed with status ${response.status}`);
  }
}

export async function dispatchMonitoringAlertsToWebhook(
  settings: MonitoringAlertSettings,
  alerts: MonitoringAlert[],
  context: DispatchContext
): Promise<void> {
  const external = settings.external;
  if (!external.enabled) return;
  if (!external.webhookUrl || !isValidWebhookUrl(external.webhookUrl)) return;
  if (!alerts.length) return;

  const eligible = alerts.filter((alert) => severityAtLeast(alert.severity, external.minSeverity));
  if (!eligible.length) return;

  const selected = eligible[0];
  const cooldownMs = Math.max(1, external.cooldownMinutes) * 60 * 1000;
  const dispatchKey = buildDispatchKey(external.webhookUrl, selected, context);
  const store = getCooldownStore();
  const lastAt = store.get(dispatchKey) || 0;
  const current = now();
  if (current - lastAt < cooldownMs) {
    return;
  }

  const payload: MonitoringWebhookPayload = {
    text: formatAlertText(selected),
    source: 'portfolio-monitoring',
    timestamp: new Date().toISOString(),
    alert: selected,
    alerts: eligible,
    context,
  };

  store.set(dispatchKey, current);
  try {
    await postWebhook(external.webhookUrl, payload);
  } catch (error) {
    console.error('Monitoring webhook dispatch failed:', error);
  }
}

export async function sendMonitoringTestWebhook(settings: MonitoringAlertSettings): Promise<void> {
  const external = settings.external;
  if (!external.enabled) return;
  if (!external.webhookUrl || !isValidWebhookUrl(external.webhookUrl)) return;

  const payload: MonitoringWebhookPayload = {
    text: '[Portfolio Monitoring][TEST] Webhook connection verified successfully',
    source: 'portfolio-monitoring',
    timestamp: new Date().toISOString(),
    alert: {
      id: 'test-alert',
      metric: 'p95',
      severity: 'warning',
      title: 'رسالة اختبار',
      message: 'تم إرسال رسالة اختبار من نظام مراقبة API',
      value: 0,
      threshold: 0,
    },
    alerts: [],
    context: {
      windowMinutes: 60,
      route: null,
      generatedAt: new Date().toISOString(),
      totals: {
        requests: 0,
        errors: 0,
        errorRate: 0,
        avgMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        maxMs: 0,
        slowRequests: 0,
      },
    },
  };

  await postWebhook(external.webhookUrl, payload);
}

export function resetMonitoringNotifierStateForTests(): void {
  globalStore.__monitoringAlertCooldown = new Map<string, number>();
}
