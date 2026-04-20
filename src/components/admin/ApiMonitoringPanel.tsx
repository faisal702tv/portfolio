'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BellRing,
  Clock3,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_MONITORING_ALERT_SETTINGS,
  evaluateMonitoringAlerts,
  normalizeMonitoringAlertSettings,
  normalizeMonitoringAlertThresholds,
  type MonitoringAlert,
  type MonitoringAlertSettings,
  type MonitoringAlertThresholds,
  type MonitoringTotals,
} from '@/lib/monitoring-alerts';

interface RouteMetric extends MonitoringTotals {
  route: string;
  method: string;
  lastStatus: number | null;
  lastSeenAt: string | null;
}

interface TelemetryEvent {
  timestamp: number;
  route: string;
  method: string;
  status: number;
  durationMs: number;
  requestId: string;
  error?: string;
}

interface TelemetrySnapshot {
  generatedAt: string;
  uptimeMs: number;
  totals: MonitoringTotals;
  routes: RouteMetric[];
  recent: TelemetryEvent[];
  telemetryEnabled: boolean;
  slowThresholdMs: number;
}

const REFRESH_MS = 15_000;
const ALERT_NOTIFICATION_COOLDOWN_MS = 2 * 60 * 1000;
const ALERT_SETTINGS_KEY = 'monitoring_alert_settings_v1';

function fmtMs(ms: number): string {
  return `${ms.toLocaleString('ar-SA-u-ca-gregory', { maximumFractionDigits: 2 })}ms`;
}

function fmtNum(value: number): string {
  return value.toLocaleString('ar-SA-u-ca-gregory', { maximumFractionDigits: 2 });
}

function timeAgo(input: string): string {
  const diff = Date.now() - new Date(input).getTime();
  if (!Number.isFinite(diff) || diff < 0) return 'الآن';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `منذ ${seconds}ث`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes}د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours}س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days}ي`;
}

function loadAlertSettings(): MonitoringAlertSettings {
  if (typeof window === 'undefined') return DEFAULT_MONITORING_ALERT_SETTINGS;

  try {
    const raw = localStorage.getItem(ALERT_SETTINGS_KEY);
    if (!raw) return DEFAULT_MONITORING_ALERT_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeMonitoringAlertSettings(parsed);
  } catch {
    return DEFAULT_MONITORING_ALERT_SETTINGS;
  }
}

async function loadAlertSettingsFromServer(): Promise<MonitoringAlertSettings | null> {
  try {
    const response = await fetch('/api/monitoring/alert-settings', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return normalizeMonitoringAlertSettings(data?.settings);
  } catch {
    return null;
  }
}

function severityBadgeVariant(severity: MonitoringAlert['severity']): 'destructive' | 'secondary' {
  return severity === 'critical' ? 'destructive' : 'secondary';
}

export function ApiMonitoringPanel() {
  const { toast } = useToast();
  const [windowMinutes, setWindowMinutes] = useState('60');
  const [routeFilter, setRouteFilter] = useState('');
  const [routeInput, setRouteInput] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [alertSettings, setAlertSettings] = useState<MonitoringAlertSettings>(
    () => DEFAULT_MONITORING_ALERT_SETTINGS
  );
  const [alertSettingsReady, setAlertSettingsReady] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const lastAlertToastRef = useRef<Record<string, number>>({});

  const updateThreshold = useCallback(
    (field: keyof MonitoringAlertThresholds, value: number) => {
      setAlertSettings((prev) => ({
        ...prev,
        thresholds: normalizeMonitoringAlertThresholds({
          ...prev.thresholds,
          [field]: value,
        }),
      }));
    },
    []
  );

  const updateExternal = useCallback(
    (
      field: keyof MonitoringAlertSettings['external'],
      value: MonitoringAlertSettings['external'][keyof MonitoringAlertSettings['external']]
    ) => {
      setAlertSettings((prev) => ({
        ...prev,
        external: {
          ...prev.external,
          [field]: value,
        },
      }));
    },
    []
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      const local = loadAlertSettings();
      if (active) setAlertSettings(local);

      const server = await loadAlertSettingsFromServer();
      if (server && active) {
        setAlertSettings(server);
        localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(server));
      }

      if (active) setAlertSettingsReady(true);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!alertSettingsReady) return;

    localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(alertSettings));

    const timer = setTimeout(() => {
      void fetch('/api/monitoring/alert-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: alertSettings }),
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [alertSettings, alertSettingsReady]);

  const handleTestWebhook = useCallback(async () => {
    if (!alertSettings.external.enabled || !alertSettings.external.webhookUrl.trim()) {
      toast({
        title: 'Webhook غير جاهز',
        description: 'فعّل الإرسال الخارجي وأدخل رابط Webhook أولاً.',
        variant: 'destructive',
      });
      return;
    }

    setTestingWebhook(true);
    try {
      const response = await fetch('/api/monitoring/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: alertSettings.external.webhookUrl.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: 'فشل اختبار Webhook',
          description: data?.error || 'تعذر إرسال رسالة الاختبار.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'تم إرسال الاختبار',
        description: 'تم إرسال رسالة اختبار إلى Webhook بنجاح.',
      });
    } catch {
      toast({
        title: 'فشل الاتصال',
        description: 'تعذر اختبار Webhook حالياً.',
        variant: 'destructive',
      });
    } finally {
      setTestingWebhook(false);
    }
  }, [alertSettings.external.enabled, alertSettings.external.webhookUrl, toast]);

  const fetchMetrics = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('windowMinutes', windowMinutes);
        params.set('limit', '80');
        if (routeFilter.trim()) {
          params.set('route', routeFilter.trim());
        }

        const response = await fetch(`/api/monitoring/metrics?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('يتطلب تسجيل الدخول للوصول إلى بيانات المراقبة.');
          } else if (response.status === 403) {
            setError('الوصول إلى المراقبة متاح لحساب المدير فقط.');
          } else {
            setError('تعذر جلب بيانات المراقبة حالياً.');
          }
          return;
        }

        const data = await response.json();
        setSnapshot(data?.snapshot ?? null);
      } catch {
        setError('حدث خطأ أثناء الاتصال بخدمة المراقبة.');
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [routeFilter, windowMinutes]
  );

  useEffect(() => {
    void fetchMetrics(true);
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      void fetchMetrics(false);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchMetrics]);

  const recentChart = useMemo(() => {
    if (!snapshot?.recent?.length) return [];
    return snapshot.recent
      .slice(0, 24)
      .slice()
      .reverse()
      .map((event) => ({
        t: new Date(event.timestamp).toLocaleTimeString('ar-SA-u-ca-gregory', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        ms: Number(event.durationMs.toFixed(2)),
        status: event.status,
      }));
  }, [snapshot]);

  const topRoutes = useMemo(() => {
    if (!snapshot?.routes) return [];
    return snapshot.routes.slice(0, 8);
  }, [snapshot]);

  const activeAlerts = useMemo(() => {
    if (!snapshot) return [];
    return evaluateMonitoringAlerts(snapshot.totals, alertSettings.thresholds);
  }, [snapshot, alertSettings.thresholds]);

  useEffect(() => {
    if (!snapshot || !alertSettings.notificationsEnabled || activeAlerts.length === 0) return;

    const highest = activeAlerts[0];
    const now = Date.now();
    const key = `${highest.id}:${windowMinutes}:${routeFilter || 'all'}`;
    const lastAt = lastAlertToastRef.current[key] || 0;

    if (now - lastAt < ALERT_NOTIFICATION_COOLDOWN_MS) {
      return;
    }

    lastAlertToastRef.current[key] = now;

    toast({
      title: highest.severity === 'critical' ? 'تنبيه حرج في API' : 'تنبيه أداء API',
      description: highest.message,
      variant: highest.severity === 'critical' ? 'destructive' : 'default',
    });
  }, [activeAlerts, alertSettings.notificationsEnabled, routeFilter, snapshot, toast, windowMinutes]);

  const slowThreshold = snapshot?.slowThresholdMs ?? 1200;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            مراقبة واجهات API
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-32">
              <Select value={windowMinutes} onValueChange={setWindowMinutes}>
                <SelectTrigger>
                  <SelectValue placeholder="نافذة الزمن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة</SelectItem>
                  <SelectItem value="240">4 ساعات</SelectItem>
                  <SelectItem value="1440">24 ساعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Input
                value={routeInput}
                onChange={(e) => setRouteInput(e.target.value)}
                placeholder="فلترة المسار (اختياري)"
              />
            </div>

            <Button variant="outline" onClick={() => setRouteFilter(routeInput.trim())}>
              تطبيق الفلتر
            </Button>

            <Button
              variant="outline"
              onClick={() => void fetchMetrics(false)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>

            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Label htmlFor="auto-refresh" className="text-xs text-muted-foreground">
                تحديث تلقائي
              </Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
            جاري تحميل بيانات المراقبة...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">تعذر عرض لوحة المراقبة</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : snapshot ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={snapshot.telemetryEnabled ? 'default' : 'outline'}>
                {snapshot.telemetryEnabled ? 'Telemetry فعال' : 'Telemetry متوقف'}
              </Badge>
              <Badge variant="outline">النافذة: {windowMinutes} دقيقة</Badge>
              <Badge variant="outline">حد البطء: {slowThreshold}ms</Badge>
              <Badge variant={alertSettings.external.enabled ? 'secondary' : 'outline'}>
                Webhook: {alertSettings.external.enabled ? 'مفعل' : 'متوقف'}
              </Badge>
              {routeFilter ? <Badge variant="outline">المسار: {routeFilter}</Badge> : null}
              <span>آخر تحديث: {timeAgo(snapshot.generatedAt)}</span>
            </div>

            <Card className={activeAlerts.length > 0 ? 'border-red-300 dark:border-red-900/60' : 'border-emerald-300 dark:border-emerald-900/60'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  تنبيهات الإنتاج
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">أدنى عدد طلبات</Label>
                    <Input
                      type="number"
                      min={1}
                      value={alertSettings.thresholds.minRequests}
                      onChange={(e) => updateThreshold('minRequests', Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">حد P95 (ms)</Label>
                    <Input
                      type="number"
                      min={100}
                      value={alertSettings.thresholds.p95Ms}
                      onChange={(e) => updateThreshold('p95Ms', Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">حد Error Rate (%)</Label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={alertSettings.thresholds.errorRatePct}
                      onChange={(e) => updateThreshold('errorRatePct', Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">حد الطلبات البطيئة</Label>
                    <Input
                      type="number"
                      min={1}
                      value={alertSettings.thresholds.slowRequests}
                      onChange={(e) => updateThreshold('slowRequests', Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">حد أخطاء 5xx</Label>
                    <Input
                      type="number"
                      min={1}
                      value={alertSettings.thresholds.errorsCount}
                      onChange={(e) => updateThreshold('errorsCount', Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">إشعارات فورية</Label>
                    <div className="h-10 flex items-center gap-2 rounded-md border px-3">
                      <Switch
                        checked={alertSettings.notificationsEnabled}
                        onCheckedChange={(checked) =>
                          setAlertSettings((prev) => ({ ...prev, notificationsEnabled: checked }))
                        }
                      />
                      <span className="text-xs">
                        {alertSettings.notificationsEnabled ? 'مفعلة' : 'متوقفة'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">تنبيه خارجي عبر Webhook</p>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alertSettings.external.enabled}
                        onCheckedChange={(checked) => updateExternal('enabled', checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {alertSettings.external.enabled ? 'مفعل' : 'متوقف'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">رابط Webhook</Label>
                      <Input
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={alertSettings.external.webhookUrl}
                        onChange={(e) => updateExternal('webhookUrl', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">أدنى شدة للإرسال</Label>
                      <Select
                        value={alertSettings.external.minSeverity}
                        onValueChange={(value) =>
                          updateExternal('minSeverity', value === 'warning' ? 'warning' : 'critical')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشدة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">حرج فقط</SelectItem>
                          <SelectItem value="warning">تحذير + حرج</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Cooldown (دقائق)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        value={alertSettings.external.cooldownMinutes}
                        onChange={(e) =>
                          updateExternal('cooldownMinutes', Number(e.target.value || 1))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void handleTestWebhook()}
                      disabled={testingWebhook || !alertSettings.external.webhookUrl.trim()}
                      className="gap-2"
                    >
                      <BellRing className={`h-4 w-4 ${testingWebhook ? 'animate-pulse' : ''}`} />
                      {testingWebhook ? 'جاري الاختبار...' : 'إرسال اختبار Webhook'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      يدعم Slack/Discord/Webhook JSON القياسي.
                    </p>
                  </div>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 text-sm">
                    النظام مستقر حالياً. لا توجد مؤشرات تجاوز للعتبات.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/60 dark:bg-red-950/30"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={severityBadgeVariant(alert.severity)}>
                            {alert.severity === 'critical' ? 'حرج' : 'تحذير'}
                          </Badge>
                          <span className="font-semibold">{alert.title}</span>
                          <span className="text-xs text-muted-foreground">
                            ({fmtNum(alert.value)} / {fmtNum(alert.threshold)})
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                      <p className="text-2xl font-bold">{fmtNum(snapshot.totals.requests)}</p>
                    </div>
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">أخطاء 5xx</p>
                      <p className="text-2xl font-bold">{fmtNum(snapshot.totals.errors)}</p>
                      <p className="text-xs text-muted-foreground">{fmtNum(snapshot.totals.errorRate)}%</p>
                    </div>
                    <ServerCrash className="h-5 w-5 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">زمن الاستجابة P95</p>
                      <p className="text-2xl font-bold">{fmtMs(snapshot.totals.p95Ms)}</p>
                      <p className="text-xs text-muted-foreground">متوسط: {fmtMs(snapshot.totals.avgMs)}</p>
                    </div>
                    <Timer className="h-5 w-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">طلبات بطيئة</p>
                      <p className="text-2xl font-bold">{fmtNum(snapshot.totals.slowRequests)}</p>
                      <p className="text-xs text-muted-foreground">الحد: {slowThreshold}ms</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">أكثر المسارات استخداماً</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المسار</TableHead>
                        <TableHead>طلبات</TableHead>
                        <TableHead>P95</TableHead>
                        <TableHead>أخطاء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRoutes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                            لا توجد بيانات بعد
                          </TableCell>
                        </TableRow>
                      ) : (
                        topRoutes.map((route) => (
                          <TableRow key={`${route.route}:${route.method}`}>
                            <TableCell className="max-w-[220px] truncate text-xs">
                              <Badge variant="outline" className="ml-2">{route.method}</Badge>
                              {route.route}
                            </TableCell>
                            <TableCell>{fmtNum(route.requests)}</TableCell>
                            <TableCell>{fmtMs(route.p95Ms)}</TableCell>
                            <TableCell>
                              <span className={route.errors > 0 ? 'text-red-500 font-semibold' : ''}>
                                {fmtNum(route.errors)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">زمن الاستجابة (آخر الطلبات)</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {recentChart.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      لا توجد بيانات رسم بعد.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={recentChart}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number) => [`${fmtNum(value)}ms`, 'المدة']}
                          labelFormatter={(label) => `الوقت: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="ms"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4" />
                  أحدث الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوقت</TableHead>
                      <TableHead>المسار</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المدة</TableHead>
                      <TableHead>المعرف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.recent.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                          لا توجد سجلات حديثة.
                        </TableCell>
                      </TableRow>
                    ) : (
                      snapshot.recent.slice(0, 20).map((event) => (
                        <TableRow key={event.requestId + String(event.timestamp)}>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {timeAgo(new Date(event.timestamp).toISOString())}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="ml-2">{event.method}</Badge>
                            {event.route}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                event.status >= 500
                                  ? 'destructive'
                                  : event.status >= 400
                                    ? 'secondary'
                                    : 'default'
                              }
                            >
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={event.durationMs >= slowThreshold ? 'text-amber-600 font-semibold' : ''}>
                            {fmtMs(event.durationMs)}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-[11px] text-muted-foreground">
                            {event.requestId}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
