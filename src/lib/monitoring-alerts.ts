export interface MonitoringTotals {
  requests: number;
  errors: number;
  errorRate: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  slowRequests: number;
}

export interface MonitoringAlertThresholds {
  minRequests: number;
  p95Ms: number;
  errorRatePct: number;
  slowRequests: number;
  errorsCount: number;
}

export type MonitoringAlertSeverity = 'warning' | 'critical';
export type MonitoringAlertMetric = 'p95' | 'error_rate' | 'slow_requests' | 'errors_count';
export type MonitoringMinSeverity = 'warning' | 'critical';

export interface MonitoringAlert {
  id: string;
  metric: MonitoringAlertMetric;
  severity: MonitoringAlertSeverity;
  title: string;
  message: string;
  value: number;
  threshold: number;
}

export interface MonitoringExternalNotifications {
  enabled: boolean;
  webhookUrl: string;
  minSeverity: MonitoringMinSeverity;
  cooldownMinutes: number;
}

export interface MonitoringAlertSettings {
  notificationsEnabled: boolean;
  thresholds: MonitoringAlertThresholds;
  external: MonitoringExternalNotifications;
}

export const DEFAULT_MONITORING_ALERT_THRESHOLDS: MonitoringAlertThresholds = {
  minRequests: 20,
  p95Ms: 1500,
  errorRatePct: 3,
  slowRequests: 10,
  errorsCount: 5,
};

export const DEFAULT_MONITORING_EXTERNAL_NOTIFICATIONS: MonitoringExternalNotifications = {
  enabled: false,
  webhookUrl: '',
  minSeverity: 'critical',
  cooldownMinutes: 10,
};

export const DEFAULT_MONITORING_ALERT_SETTINGS: MonitoringAlertSettings = {
  notificationsEnabled: true,
  thresholds: DEFAULT_MONITORING_ALERT_THRESHOLDS,
  external: DEFAULT_MONITORING_EXTERNAL_NOTIFICATIONS,
};

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeMonitoringAlertThresholds(
  thresholds: Partial<MonitoringAlertThresholds> | null | undefined
): MonitoringAlertThresholds {
  return {
    minRequests: Math.max(
      1,
      Math.round(safeNumber(thresholds?.minRequests as number, DEFAULT_MONITORING_ALERT_THRESHOLDS.minRequests))
    ),
    p95Ms: Math.max(
      100,
      Math.round(safeNumber(thresholds?.p95Ms as number, DEFAULT_MONITORING_ALERT_THRESHOLDS.p95Ms))
    ),
    errorRatePct: Math.max(
      0.1,
      safeNumber(thresholds?.errorRatePct as number, DEFAULT_MONITORING_ALERT_THRESHOLDS.errorRatePct)
    ),
    slowRequests: Math.max(
      1,
      Math.round(safeNumber(thresholds?.slowRequests as number, DEFAULT_MONITORING_ALERT_THRESHOLDS.slowRequests))
    ),
    errorsCount: Math.max(
      1,
      Math.round(safeNumber(thresholds?.errorsCount as number, DEFAULT_MONITORING_ALERT_THRESHOLDS.errorsCount))
    ),
  };
}

export function normalizeMonitoringAlertSettings(
  input: Partial<MonitoringAlertSettings & MonitoringAlertThresholds> | null | undefined
): MonitoringAlertSettings {
  const legacyThresholdShape =
    input &&
    (Object.prototype.hasOwnProperty.call(input, 'minRequests') ||
      Object.prototype.hasOwnProperty.call(input, 'p95Ms') ||
      Object.prototype.hasOwnProperty.call(input, 'errorRatePct') ||
      Object.prototype.hasOwnProperty.call(input, 'slowRequests') ||
      Object.prototype.hasOwnProperty.call(input, 'errorsCount'));

  const rawThresholds = input?.thresholds ?? (legacyThresholdShape ? input : undefined);
  const rawExternal = input?.external;

  const minSeverity: MonitoringMinSeverity =
    rawExternal?.minSeverity === 'warning' ? 'warning' : 'critical';

  return {
    notificationsEnabled: input?.notificationsEnabled !== false,
    thresholds: normalizeMonitoringAlertThresholds(rawThresholds),
    external: {
      enabled: rawExternal?.enabled === true,
      webhookUrl: String(rawExternal?.webhookUrl || '').trim(),
      minSeverity,
      cooldownMinutes: Math.max(
        1,
        Math.min(
          24 * 60,
          Math.round(
            safeNumber(
              rawExternal?.cooldownMinutes as number,
              DEFAULT_MONITORING_EXTERNAL_NOTIFICATIONS.cooldownMinutes
            )
          )
        )
      ),
    },
  };
}

export function severityAtLeast(
  actual: MonitoringAlertSeverity,
  minSeverity: MonitoringMinSeverity
): boolean {
  if (minSeverity === 'warning') return true;
  return actual === 'critical';
}

function asCritical(value: number, threshold: number): MonitoringAlertSeverity {
  return value >= threshold * 2 ? 'critical' : 'warning';
}

export function evaluateMonitoringAlerts(
  totals: MonitoringTotals,
  thresholdsInput: Partial<MonitoringAlertThresholds> | null | undefined
): MonitoringAlert[] {
  const thresholds = normalizeMonitoringAlertThresholds(thresholdsInput);
  const alerts: MonitoringAlert[] = [];

  if (totals.requests < thresholds.minRequests) {
    return alerts;
  }

  if (totals.p95Ms >= thresholds.p95Ms) {
    const severity = asCritical(totals.p95Ms, thresholds.p95Ms);
    alerts.push({
      id: `p95-${severity}`,
      metric: 'p95',
      severity,
      title: 'ارتفاع زمن الاستجابة (P95)',
      message: `قيمة P95 الحالية ${totals.p95Ms.toFixed(2)}ms أعلى من الحد ${thresholds.p95Ms}ms`,
      value: totals.p95Ms,
      threshold: thresholds.p95Ms,
    });
  }

  if (totals.errorRate >= thresholds.errorRatePct) {
    const severity = asCritical(totals.errorRate, thresholds.errorRatePct);
    alerts.push({
      id: `error-rate-${severity}`,
      metric: 'error_rate',
      severity,
      title: 'معدل أخطاء 5xx مرتفع',
      message: `معدل الأخطاء ${totals.errorRate.toFixed(2)}% تجاوز الحد ${thresholds.errorRatePct}%`,
      value: totals.errorRate,
      threshold: thresholds.errorRatePct,
    });
  }

  if (totals.slowRequests >= thresholds.slowRequests) {
    const severity = asCritical(totals.slowRequests, thresholds.slowRequests);
    alerts.push({
      id: `slow-requests-${severity}`,
      metric: 'slow_requests',
      severity,
      title: 'زيادة في الطلبات البطيئة',
      message: `عدد الطلبات البطيئة ${totals.slowRequests} تجاوز الحد ${thresholds.slowRequests}`,
      value: totals.slowRequests,
      threshold: thresholds.slowRequests,
    });
  }

  if (totals.errors >= thresholds.errorsCount) {
    const severity = asCritical(totals.errors, thresholds.errorsCount);
    alerts.push({
      id: `errors-count-${severity}`,
      metric: 'errors_count',
      severity,
      title: 'عدد أخطاء 5xx مرتفع',
      message: `عدد أخطاء 5xx الحالية ${totals.errors} تجاوز الحد ${thresholds.errorsCount}`,
      value: totals.errors,
      threshold: thresholds.errorsCount,
    });
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return b.value - a.value;
  });
}
