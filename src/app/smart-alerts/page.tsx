'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyWarning, notifyInfo, notifyError } from '@/hooks/use-notifications';
import { Bell, Plus, Trash2, Brain, Settings, BellOff } from 'lucide-react';

const STORAGE_KEY = 'smart_alerts';

interface SmartAlert {
  id: string;
  symbol: string;
  type: string;
  value: number;
  enabled: boolean;
  createdAt: string;
  triggered: boolean;
}

interface AnalysisItem {
  symbol: string;
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

const ALERT_TYPES = [
  { value: 'price_above', label: 'السعر أعلى من', icon: '📈' },
  { value: 'price_below', label: 'السعر أقل من', icon: '📉' },
  { value: 'change_above', label: 'التغيير أعلى من %', icon: '🚀' },
  { value: 'volume_spike', label: 'ارتفاع الحجم', icon: '🔥' },
  { value: 'dividend', label: 'توزيع أرباح', icon: '💰' },
  { value: 'earnings', label: 'أرباح ربع سنوية', icon: '📊' },
];

function fmt(n: number, decimals = 1): string {
  return n.toLocaleString('ar-SA-u-ca-gregory', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function SmartAlertsPage() {
  const { snapshot } = usePortfolioSnapshot();
  const { toast } = useToast();
  const [alertSymbol, setAlertSymbol] = useState('');
  const [alertType, setAlertType] = useState('price_above');
  const [alertValue, setAlertValue] = useState('');
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);

  const stocks = snapshot?.stocks || [];

  // Load alerts from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSmartAlerts(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Persist alerts
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(smartAlerts));
  }, [smartAlerts]);

  const addAlert = () => {
    if (!alertSymbol || !alertValue) {
      toast({ title: 'الرجاء إدخال الرمز والقيمة', variant: 'destructive' });
      return;
    }
    const alert: SmartAlert = {
      id: `alert_${Date.now()}`,
      symbol: alertSymbol,
      type: alertType,
      value: parseFloat(alertValue),
      enabled: true,
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    setSmartAlerts(prev => [...prev, alert]);
    setAlertSymbol('');
    setAlertValue('');
    toast({ title: 'تمت إضافة التنبيه' });
    notifySuccess('تمت إضافة تنبيه', `تنبيه جديد على ${alert.symbol}`, { source: 'smart-alerts' });
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteAlert = deleteId ? smartAlerts.find(a => a.id === deleteId) : null;

  const confirmRemoveAlert = () => {
    if (!deleteId) return;
    const alert = smartAlerts.find(a => a.id === deleteId);
    setSmartAlerts(prev => prev.filter(a => a.id !== deleteId));
    setDeleteId(null);
    toast({ title: 'تم حذف التنبيه' });
    notifyWarning('تم حذف تنبيه', `تم حذف تنبيه ${alert?.symbol || ''}`, { source: 'التنبيهات الذكية' });
  };

  const toggleAlert = (id: string) => {
    setSmartAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const getAlertTypeInfo = (type: string) => ALERT_TYPES.find(t => t.value === type) || ALERT_TYPES[0];

  // Smart portfolio analysis
  const portfolioAnalysis: AnalysisItem[] = useMemo(() => {
    const analysis: AnalysisItem[] = [];
    const totalValue = stocks.reduce((sum, s) => sum + (s.qty || 0) * (s.currentPrice || s.buyPrice || 0), 0);

    stocks.forEach(s => {
      const currentPrice = s.currentPrice || s.buyPrice || 0;
      const buyPrice = s.buyPrice || 0;
      const changePct = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

      if (changePct > 20) {
        analysis.push({
          symbol: s.symbol,
          type: 'gain_alert',
          message: `ربح ${fmt(changePct)}% — فرصة لجني الأرباح`,
          priority: 'high',
          icon: '💰',
        });
      } else if (changePct < -15) {
        analysis.push({
          symbol: s.symbol,
          type: 'loss_alert',
          message: `خسارة ${fmt(Math.abs(changePct))}% — وقت لإعادة التقييم`,
          priority: 'medium',
          icon: '🔔',
        });
      }

      const value = (s.qty || 0) * currentPrice;
      const concentration = totalValue > 0 ? (value / totalValue) * 100 : 0;
      if (concentration > 30) {
        analysis.push({
          symbol: s.symbol,
          type: 'concentration',
          message: `التركيز ${fmt(concentration)}% — يُنصح بالتنويع`,
          priority: 'medium',
          icon: '⚖️',
        });
      }
    });

    // Sector concentration
    const sectors: Record<string, number> = {};
    stocks.forEach(s => {
      const value = (s.qty || 0) * (s.currentPrice || s.buyPrice || 0);
      const sector = s.sector || 'أخرى';
      sectors[sector] = (sectors[sector] || 0) + value;
    });
    Object.entries(sectors).forEach(([sector, value]) => {
      const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
      if (pct > 50) {
        analysis.push({
          symbol: sector,
          type: 'sector_concentration',
          message: `قطاع ${sector} يشكل ${fmt(pct)}% من المحفظة`,
          priority: 'medium',
          icon: '🏭',
        });
      }
    });

    return analysis.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [stocks]);

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              التنبيهات الذكية
            </h1>
            <p className="text-muted-foreground text-sm mt-1">راقب أسهمك تلقائيا واحصل على إشعارات فورية</p>
          </div>

          {/* Add New Alert */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة تنبيه جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap items-center">
                <Input
                  placeholder="الرمز (مثال: AAPL)"
                  value={alertSymbol}
                  onChange={e => setAlertSymbol(e.target.value.toUpperCase())}
                  className="w-[140px]"
                />
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="القيمة"
                  value={alertValue}
                  onChange={e => setAlertValue(e.target.value)}
                  className="w-[100px]"
                />
                <Button onClick={addAlert}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة
                </Button>
              </div>
              {stocks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">من محفظتك:</span>
                  {stocks.slice(0, 6).map(s => (
                    <Button
                      key={s.id}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setAlertSymbol(s.symbol);
                        setAlertValue(String(s.currentPrice || s.buyPrice || ''));
                      }}
                    >
                      {s.symbol}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Analysis */}
          {portfolioAnalysis.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    تحليل ذكي للمحفظة
                  </CardTitle>
                  <Badge>{portfolioAnalysis.length} تنبيه</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {portfolioAnalysis.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border-r-2 ${
                      item.priority === 'high'
                        ? 'bg-red-500/5 border-red-500'
                        : item.priority === 'medium'
                        ? 'bg-amber-500/5 border-amber-500'
                        : 'bg-blue-500/5 border-blue-500'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                    </div>
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'outline' : 'secondary'}>
                      {item.priority === 'high' ? 'عالي' : item.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">التنبيهات النشطة ({smartAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {smartAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BellOff className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">لا توجد تنبيهات نشطة</p>
                  <p className="text-xs mt-1">أضف تنبيهات من الأعلى أو استفد من التحليل الذكي</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {smartAlerts.map(alert => {
                    const typeInfo = getAlertTypeInfo(alert.type);
                    return (
                      <div
                        key={alert.id}
                        className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 ${!alert.enabled ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={alert.enabled}
                          onChange={() => toggleAlert(alert.id)}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-xl">{typeInfo.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{alert.symbol}</p>
                          <p className="text-xs text-muted-foreground">{typeInfo.label} {alert.value}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(alert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                إعدادات التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'إشعارات المتصفح', defaultChecked: true },
                { label: 'تنبيهات البريد الإلكتروني', defaultChecked: true },
                { label: 'إشعارات الدفع للجوال', defaultChecked: false },
                { label: 'التحليل الذكي التلقائي', defaultChecked: true },
              ].map((opt, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked={opt.defaultChecked} className="h-4 w-4 rounded" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold mb-2">التحليل الذكي يراقب محفظتك تلقائيا وينبهك لـ:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pr-4">
                  <li>أرباح أو خسائر تتجاوز 15-20%</li>
                  <li>تركيز أي سهم يتجاوز 30% من المحفظة</li>
                  <li>تركيز أي قطاع يتجاوز 50%</li>
                </ul>
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
              هل أنت متأكد من حذف تنبيه <strong>{deleteAlert?.symbol}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmRemoveAlert}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
