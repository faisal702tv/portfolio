'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MarketOverviewBar } from '@/components/dashboard/MarketTicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Volume2,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/helpers';
import { useLivePrices } from '@/hooks/use-live-prices';
import { SymbolLookup } from '@/components/forms/SymbolLookup';
import { notifySuccess } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';

type AlertType = 'price_up' | 'price_down' | 'pct_up' | 'pct_down';

interface AlertItem {
  id: string;
  symbol: string;
  name: string;
  type: AlertType;
  targetValue: number;
  currentValue: number;
  basePrice?: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  message?: string;
}

interface LiveQuote {
  price?: number;
  changePct?: number;
}

// Demo alerts data
const demoAlerts: AlertItem[] = [
  { id: '1', symbol: '1120.SR', name: 'أرامكو السعودية', type: 'price_up', targetValue: 30, currentValue: 28.75, basePrice: 27.50, isActive: true, isTriggered: false, createdAt: new Date(Date.now() - 86400000) },
  { id: '2', symbol: '1180.SR', name: 'مصرف الراجحي', type: 'price_up', targetValue: 115, currentValue: 108.50, basePrice: 100.00, isActive: true, isTriggered: false, createdAt: new Date(Date.now() - 172800000) },
  { id: '3', symbol: '7010.SR', name: 'الاتصالات السعودية', type: 'pct_down', targetValue: -5, currentValue: -4.66, isActive: true, isTriggered: false, createdAt: new Date(Date.now() - 259200000) },
  { id: '4', symbol: '2222.SR', name: 'المملكة القابضة', type: 'price_down', targetValue: 8.5, currentValue: 9.20, basePrice: 10.00, isActive: true, isTriggered: false, createdAt: new Date(Date.now() - 432000000) },
  { id: '5', symbol: '2380.SR', name: 'الإنماء للتعمير', type: 'pct_up', targetValue: 15, currentValue: 15.71, isActive: false, isTriggered: true, triggeredAt: new Date(Date.now() - 3600000), createdAt: new Date(Date.now() - 604800000) },
];

const ALERTS_STORAGE_KEY = 'alerts_data';
const ALERT_TYPE_SET = new Set<AlertType>(['price_up', 'price_down', 'pct_up', 'pct_down']);

function normalizeSymbol(symbol: unknown): string {
  return String(symbol || '').trim().toUpperCase();
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeAlertType(rawType: unknown): AlertType {
  const value = String(rawType || '').trim().toLowerCase();
  if (ALERT_TYPE_SET.has(value as AlertType)) return value as AlertType;
  if (value.includes('price') && (value.includes('up') || value.includes('above') || value.includes('upper'))) return 'price_up';
  if (value.includes('price') && (value.includes('down') || value.includes('below') || value.includes('lower'))) return 'price_down';
  if ((value.includes('pct') || value.includes('percent')) && (value.includes('up') || value.includes('rise') || value.includes('gain'))) return 'pct_up';
  if ((value.includes('pct') || value.includes('percent')) && (value.includes('down') || value.includes('drop') || value.includes('loss'))) return 'pct_down';
  return 'price_up';
}

function normalizeAlert(raw: any): AlertItem | null {
  const symbol = normalizeSymbol(raw?.symbol ?? raw?.assetSymbol ?? raw?.ticker ?? raw?.code ?? raw?.name);
  if (!symbol) return null;
  const type = normalizeAlertType(raw?.type ?? raw?.alertType ?? raw?.conditionType);
  const createdAt = raw?.createdAt ? new Date(raw.createdAt) : new Date();
  const triggeredAt = raw?.triggeredAt ? new Date(raw.triggeredAt) : undefined;
  const isTriggered = Boolean(raw?.isTriggered ?? raw?.triggered ?? triggeredAt);
  const isActiveRaw = raw?.isActive ?? raw?.active ?? raw?.enabled;
  const isActive = typeof isActiveRaw === 'boolean' ? isActiveRaw : !isTriggered;
  const targetValueRaw = raw?.targetValue ?? raw?.target ?? raw?.value;
  const currentValueRaw = raw?.currentValue ?? raw?.current ?? raw?.lastValue;
  const targetValue = toNumber(targetValueRaw);
  const normalizedTarget = type === 'pct_down' ? -Math.abs(targetValue) : (type === 'pct_up' ? Math.abs(targetValue) : targetValue);
  const fallbackCurrent = type.includes('pct') ? 0 : (normalizedTarget > 0 ? normalizedTarget * 0.9 : 0);

  return {
    id: String(raw?.id || crypto.randomUUID()),
    symbol,
    name: String(raw?.name || raw?.assetName || symbol),
    type,
    targetValue: normalizedTarget,
    currentValue: toNumber(currentValueRaw, fallbackCurrent),
    basePrice: raw?.basePrice == null ? undefined : toNumber(raw.basePrice),
    isActive,
    isTriggered,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    triggeredAt: triggeredAt && !Number.isNaN(triggeredAt.getTime()) ? triggeredAt : undefined,
    message: raw?.message ? String(raw.message) : undefined,
  };
}

function isAlertTriggered(alert: AlertItem): boolean {
  return Boolean(alert.isTriggered || alert.triggeredAt);
}

function resolveLiveData(prices: Record<string, LiveQuote>, symbol: string): LiveQuote | null {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  const candidates = [
    normalized,
    normalized.replace(/\./g, '_'),
    `US_${normalized}`,
    `SAUDI_${normalized}`,
    `ADX_${normalized}`,
    `DFM_${normalized}`,
    `KSE_${normalized}`,
    `QSE_${normalized}`,
    `EGX_${normalized}`,
  ];
  for (const key of candidates) {
    const quote = prices[key];
    if (quote && Number.isFinite(quote.price)) return quote;
  }
  return null;
}

function loadStoredAlerts() {
  if (typeof window === 'undefined') return demoAlerts;
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) return demoAlerts;
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.alerts)
        ? parsed.alerts
        : Array.isArray(parsed?.items)
          ? parsed.items
          : [];

    if (!Array.isArray(list)) return demoAlerts;
    const normalized = list
      .map((alert) => normalizeAlert(alert))
      .filter((alert): alert is AlertItem => alert !== null);
    return normalized.length > 0 ? normalized : demoAlerts;
  } catch {
    return demoAlerts;
  }
}

export default function AlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>(loadStoredAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<{ symbol: string; name: string; type: AlertType; targetValue: string; basePrice: number }>({
    symbol: '',
    name: '',
    type: 'price_up',
    targetValue: '',
    basePrice: 0,
  });

  const activeSymbolsKey = useMemo(() => {
    const symbols = Array.from(new Set(alerts
      .filter((a) => a.isActive)
      .map((a) => normalizeSymbol(a.symbol))
      .filter(Boolean)
    )).sort();
    return symbols.join(',');
  }, [alerts]);

  const activeSymbols = useMemo(
    () => (activeSymbolsKey ? activeSymbolsKey.split(',') : []),
    [activeSymbolsKey]
  );

  const { prices } = useLivePrices({ refreshInterval: 60000, symbols: activeSymbols });

  const filteredAlerts = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.symbol.toLowerCase().includes(needle) ||
        alert.name.toLowerCase().includes(needle);
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'active' && alert.isActive) ||
        (filterType === 'triggered' && isAlertTriggered(alert));
      return matchesSearch && matchesFilter;
    });
  }, [alerts, filterType, searchQuery]);

  const filteredActiveAlerts = useMemo(
    () => filteredAlerts.filter((alert) => !isAlertTriggered(alert)),
    [filteredAlerts]
  );

  const filteredTriggeredAlerts = useMemo(
    () =>
      filteredAlerts
        .filter((alert) => isAlertTriggered(alert))
        .sort((a, b) => (b.triggeredAt?.getTime() || 0) - (a.triggeredAt?.getTime() || 0)),
    [filteredAlerts]
  );

  const triggeredTodayCount = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return alerts.filter((alert) => {
      if (!isAlertTriggered(alert) || !alert.triggeredAt) return false;
      const t = alert.triggeredAt;
      return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
    }).length;
  }, [alerts]);

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const alertToDelete = deleteId ? alerts.find(a => a.id === deleteId) : null;

  const confirmDeleteAlert = () => {
    if (!deleteId) return;
    setAlerts((prev) => prev.filter((a) => a.id !== deleteId));
    setDeleteId(null);
  };

  const getAlertTypeInfo = (type: string) => {
    switch (type) {
      case 'price_up': return { label: 'سعر علوي', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'price_down': return { label: 'سعر سفلي', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
      case 'pct_up': return { label: 'نسبة صعود', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'pct_down': return { label: 'نسبة هبوط', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
      default: return { label: type, icon: Target, color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  // نظام التقييم اللحظي (Auto-Trigger Logic)
  useEffect(() => {
    if (Object.keys(prices).length === 0) return;

    setAlerts((prev) => {
      let hasChanges = false;
      const updated = prev.map((alert) => {
        if (!alert.isActive) return alert;
        const liveData = resolveLiveData(prices, alert.symbol);
        if (!liveData || !Number.isFinite(liveData.price)) return alert;

        const livePrice = Number(liveData.price || 0);
        const liveChangePct = Number.isFinite(liveData.changePct) ? Number(liveData.changePct) : 0;
        const currentMetric = alert.type.includes('pct') ? liveChangePct : livePrice;
        let triggered = false;
        let msg = '';

        if (alert.type === 'price_up' && livePrice >= alert.targetValue) {
          triggered = true; msg = `وصل السعر للهدف العلوي: ${livePrice}`;
        } else if (alert.type === 'price_down' && livePrice <= alert.targetValue) {
          triggered = true; msg = `هبط السعر للهدف السفلي: ${livePrice}`;
        } else if (alert.type === 'pct_up' && liveChangePct >= alert.targetValue) {
          triggered = true; msg = `حقق نسبة الصعود المستهدفة: +${liveChangePct.toFixed(2)}%`;
        } else if (alert.type === 'pct_down' && liveChangePct <= alert.targetValue) {
          triggered = true; msg = `وصل لنسبة الهبوط المحددة: ${liveChangePct.toFixed(2)}%`;
        }

        if (triggered) {
          hasChanges = true;
          setTimeout(() => notifySuccess('🔔 تنبيه محقق', `تم تفعيل تنبيه ${alert.name} - ${msg}`, { source: 'التنبيهات' }), 0);
          return { ...alert, currentValue: currentMetric, isActive: false, isTriggered: true, triggeredAt: new Date(), message: msg };
        }

        if (alert.currentValue !== currentMetric) {
          hasChanges = true;
          return { ...alert, currentValue: currentMetric };
        }
        return alert;
      });
      return hasChanges ? updated : prev;
    });
  }, [prices]);

  const handleAddAlert = () => {
    const symbol = normalizeSymbol(newAlert.symbol);
    if (!symbol) {
      toast({ title: 'الرمز مطلوب', description: 'أدخل رمز الأصل قبل الإضافة.', variant: 'destructive' });
      return;
    }

    const targetRaw = Number(newAlert.targetValue);
    if (!Number.isFinite(targetRaw)) {
      toast({ title: 'قيمة غير صالحة', description: 'أدخل قيمة صحيحة للتنبيه.', variant: 'destructive' });
      return;
    }

    let normalizedTarget = targetRaw;
    if (newAlert.type === 'pct_up') normalizedTarget = Math.abs(targetRaw);
    if (newAlert.type === 'pct_down') normalizedTarget = -Math.abs(targetRaw);
    if ((newAlert.type === 'price_up' || newAlert.type === 'price_down') && normalizedTarget <= 0) {
      toast({ title: 'قيمة غير صالحة', description: 'تنبيهات السعر تحتاج قيمة أكبر من صفر.', variant: 'destructive' });
      return;
    }

    const liveData = resolveLiveData(prices, symbol);
    const livePrice = Number(liveData?.price || 0);
    const livePct = Number.isFinite(liveData?.changePct) ? Number(liveData?.changePct) : 0;
    const basePrice = newAlert.basePrice > 0 ? newAlert.basePrice : livePrice || Math.abs(normalizedTarget) * 0.9;
    const currentValue = newAlert.type.includes('pct') ? livePct : (livePrice || basePrice);

    const alert: AlertItem = {
      id: Date.now().toString(),
      symbol,
      name: newAlert.name || symbol,
      type: newAlert.type,
      targetValue: normalizedTarget,
      currentValue,
      basePrice,
      isActive: true,
      isTriggered: false,
      createdAt: new Date(),
    };
    setAlerts((prev) => [alert, ...prev]);
    setIsAddDialogOpen(false);
    setNewAlert({ symbol: '', name: '', type: 'price_up', targetValue: '', basePrice: 0 });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="🔔 التنبيهات" />
        <MarketOverviewBar />

        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي التنبيهات</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <BellRing className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{alerts.filter((a) => a.isActive).length}</p>
                  <p className="text-sm text-muted-foreground">تنبيهات نشطة</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <CheckCircle2 className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{alerts.filter((a) => isAlertTriggered(a)).length}</p>
                  <p className="text-sm text-muted-foreground">تم التفعيل</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{triggeredTodayCount}</p>
                  <p className="text-sm text-muted-foreground">تنبيهات اليوم</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث برمز أو اسم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="فلترة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="active">النشطة</SelectItem>
                    <SelectItem value="triggered">المفعّلة</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="h-4 w-4" /> إضافة تنبيه</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>إضافة تنبيه جديد</DialogTitle>
                      <DialogDescription>سيتم إشعارك عند تحقق الشرط</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">بحث الأصل</Label>
                        <div className="col-span-3">
                          <SymbolLookup
                            type="stock"
                            value={newAlert.symbol}
                            onChange={(val) => setNewAlert({ ...newAlert, symbol: val })}
                            onPick={(item) => {
                              setNewAlert(prev => ({
                                ...prev,
                                symbol: item.symbol,
                                name: item.name || item.symbol,
                                basePrice: item.quote?.price || 0
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">الرمز</Label>
                        <Input placeholder="1120.SR" value={newAlert.symbol} onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">الاسم</Label>
                        <Input placeholder="أرامكو السعودية" value={newAlert.name} onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">النوع</Label>
                        <Select value={newAlert.type} onValueChange={(v) => setNewAlert({ ...newAlert, type: v as AlertType })}>
                          <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price_up">سعر علوي</SelectItem>
                            <SelectItem value="price_down">سعر سفلي</SelectItem>
                            <SelectItem value="pct_up">نسبة صعود</SelectItem>
                            <SelectItem value="pct_down">نسبة هبوط</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">القيمة</Label>
                        <Input type="number" placeholder="30" value={newAlert.targetValue} onChange={(e) => setNewAlert({ ...newAlert, targetValue: e.target.value })} className="col-span-3" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                      <Button onClick={handleAddAlert}>إضافة</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="active" className="space-y-4" dir="rtl">
            <TabsList>
              <TabsTrigger value="active" className="gap-2"><BellRing className="h-4 w-4" /> التنبيهات النشطة</TabsTrigger>
              <TabsTrigger value="triggered" className="gap-2"><CheckCircle2 className="h-4 w-4" /> التنبيهات المفعّلة</TabsTrigger>
            </TabsList>

            <TabsContent value="active" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-right">التنبيهات النشطة</CardTitle>
                </CardHeader>
                <CardContent className="text-right">
                  <div className="space-y-3">
                    {filteredActiveAlerts.map((alert) => {
                      const typeInfo = getAlertTypeInfo(alert.type);
                      const Icon = typeInfo.icon;
                      const liveData = resolveLiveData(prices, alert.symbol);

                      let progress = 0;
                      if (alert.type.includes('pct')) {
                        const currentPct = Number.isFinite(liveData?.changePct) ? Number(liveData?.changePct) : alert.currentValue;
                        const targetAbs = Math.abs(alert.targetValue);
                        progress = targetAbs > 0 ? Math.min(Math.max((Math.abs(currentPct) / targetAbs) * 100, 0), 100) : 0;
                      } else {
                        const base = alert.basePrice || (alert.type === 'price_up' ? alert.targetValue * 0.8 : alert.targetValue * 1.2);
                        const totalRange = Math.abs(alert.targetValue - base);
                        const livePrice = Number.isFinite(liveData?.price) ? Number(liveData?.price) : alert.currentValue;
                        const currentProgress = Math.abs(livePrice - base);
                        progress = totalRange > 0 ? Math.min(Math.max((currentProgress / totalRange) * 100, 0), 100) : 0;
                      }

                      return (
                        <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg border text-right ${alert.isActive ? 'bg-card' : 'bg-muted/30 opacity-60'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${typeInfo.bg}`}>
                              <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{alert.symbol}</span>
                                <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.name}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>الهدف: {alert.targetValue}{alert.type.includes('pct') ? '%' : ''}</span>
                                <span>
                                  الحالي: {alert.type.includes('pct')
                                    ? `${(Number.isFinite(liveData?.changePct) ? Number(liveData?.changePct) : alert.currentValue).toFixed(2)}%`
                                    : (Number.isFinite(liveData?.price) ? Number(liveData?.price) : alert.currentValue).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                            </div>
                            <Switch checked={alert.isActive} onCheckedChange={() => toggleAlert(alert.id)} />
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(alert.id)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredActiveAlerts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد تنبيهات نشطة</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                          <Plus className="h-4 w-4 ml-2" /> إضافة تنبيه جديد
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="triggered" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-right">سجل التنبيهات المفعّلة</CardTitle>
                </CardHeader>
                <CardContent className="text-right">
                  <div className="space-y-3">
                    {filteredTriggeredAlerts.map((alert) => {
                      return (
                        <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-right">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                              <CheckCircle2 className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{alert.symbol}</span>
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">تم التفعيل</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.name}</p>
                              <p className="text-sm mt-1">{alert.message || 'تم تفعيل التنبيه بنجاح'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {alert.triggeredAt ? formatRelativeTime(alert.triggeredAt) : '—'}
                            </div>
                            <p className="font-semibold mt-1">
                              {alert.type.includes('pct') ? `${alert.currentValue.toFixed(2)}%` : `${alert.currentValue.toFixed(2)} ر.س`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {filteredTriggeredAlerts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا يوجد سجل تنبيهات مفعّلة حالياً</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Volume2 className="h-5 w-5" /> إعدادات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إشعارات البريد الإلكتروني</p>
                  <p className="text-sm text-muted-foreground">استلام الإشعارات عبر البريد عند تفعيل التنبيه</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إشعارات الموبايل</p>
                  <p className="text-sm text-muted-foreground">استلام إشعارات فورية على الهاتف</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">صوت التنبيه</p>
                  <p className="text-sm text-muted-foreground">تشغيل صوت عند تفعيل التنبيه</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التنبيه</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف تنبيه <strong>{alertToDelete?.symbol}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDeleteAlert}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
