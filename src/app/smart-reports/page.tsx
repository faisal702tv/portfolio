'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { FileText, Download, Mail, BarChart3, Trophy, TrendingDown } from 'lucide-react';

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('ar-SA-u-ca-gregory', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('ar-SA-u-ca-gregory', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface GeneratedReport {
  date: string;
  period: string;
  totalCost: number;
  totalValue: number;
  returnPct: number;
  totalDividends: number;
  totalTrades: number;
  dividendYield: number;
  topWinners: { symbol: string; name: string; returnPct: number }[];
  topLosers: { symbol: string; name: string; returnPct: number }[];
  sectors: { name: string; pct: number }[];
  generatedAt: string;
}

export default function SmartReportsPage() {
  const { snapshot } = usePortfolioSnapshot();
  const [reportType, setReportType] = useState('monthly');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);

  const stocks = snapshot?.stocks || [];
  const bonds = snapshot?.bonds || [];
  const funds = snapshot?.funds || [];

  const metrics = useMemo(() => {
    let totalCost = 0, totalValue = 0;
    stocks.forEach(s => {
      totalCost += (s.qty || 0) * (s.buyPrice || 0);
      totalValue += (s.qty || 0) * (s.currentPrice || s.buyPrice || 0);
    });
    bonds.forEach(b => {
      totalCost += parseFloat(String(b.buyPrice || 0)) * (b.qty || 1);
      totalValue += parseFloat(String(b.currentPrice || b.buyPrice || 0)) * (b.qty || 1);
    });
    funds.forEach(f => {
      totalCost += (f.units || 0) * (f.buyPrice || 0);
      totalValue += (f.units || 0) * (f.currentPrice || f.buyPrice || 0);
    });
    const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    return { totalCost, totalValue, returnPct };
  }, [stocks, bonds, funds]);

  const stockPerformance = useMemo(() => {
    return stocks.map(s => {
      const cost = (s.qty || 0) * (s.buyPrice || 0);
      const value = (s.qty || 0) * (s.currentPrice || s.buyPrice || 0);
      const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
      return { symbol: s.symbol, name: s.name, returnPct };
    }).sort((a, b) => b.returnPct - a.returnPct);
  }, [stocks]);

  const sectorAllocation = useMemo(() => {
    const sectors: Record<string, number> = {};
    const total = metrics.totalValue;
    stocks.forEach(s => {
      const value = (s.qty || 0) * (s.currentPrice || s.buyPrice || 0);
      const sector = s.sector || 'أخرى';
      sectors[sector] = (sectors[sector] || 0) + value;
    });
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, pct: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct);
  }, [stocks, metrics.totalValue]);

  const generateReport = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    const now = new Date();
    setReport({
      date: now.toLocaleDateString('ar-SA-u-ca-gregory'),
      period: reportType === 'monthly' ? 'شهرية' : reportType === 'quarterly' ? 'ربع سنوية' : 'سنوية',
      totalCost: metrics.totalCost,
      totalValue: metrics.totalValue,
      returnPct: metrics.returnPct,
      totalDividends: 0,
      totalTrades: stocks.length + bonds.length + funds.length,
      dividendYield: 0,
      topWinners: stockPerformance.filter(s => s.returnPct > 0).slice(0, 5),
      topLosers: stockPerformance.filter(s => s.returnPct < 0).slice(0, 5),
      sectors: sectorAllocation.slice(0, 5),
      generatedAt: now.toLocaleString('ar-SA-u-ca-gregory'),
    });
    setGenerating(false);
  };

  const exportPDF = () => {
    if (!report) return;
    const content = `تقرير ${report.period}\nتاريخ: ${report.date}\nإجمالي القيمة: ${fmtCurrency(report.totalValue)}\nالعائد: ${fmt(report.returnPct)}%`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `portfolio-report-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              التقارير الذكية
            </h1>
            <p className="text-muted-foreground text-sm mt-1">أنشئ تقارير شاملة لمحفظتك الاستثمارية</p>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 flex-wrap items-center">
                <span className="font-medium text-sm">نوع التقرير:</span>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهرية</SelectItem>
                    <SelectItem value="quarterly">ربع سنوية</SelectItem>
                    <SelectItem value="yearly">سنوية</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateReport} disabled={generating}>
                  <BarChart3 className="h-4 w-4 ml-2" />
                  {generating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                </Button>
                {report && (
                  <>
                    <Button variant="outline" onClick={exportPDF}>
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button variant="outline">
                      <Mail className="h-4 w-4 ml-2" />
                      إرسال
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {report ? (
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Report Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold mb-1">تقرير {report.period}</h2>
                  <p className="text-sm text-muted-foreground">تاريخ التقرير: {report.date}</p>
                  <p className="text-xs text-muted-foreground">وقت الإنشاء: {report.generatedAt}</p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
                    <p className="text-lg font-bold mt-1">{fmtCurrency(report.totalValue)}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">العائد</p>
                    <p className={`text-lg font-bold mt-1 ${report.returnPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {report.returnPct >= 0 ? '+' : ''}{fmt(report.returnPct)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">التكلفة</p>
                    <p className="text-lg font-bold mt-1">{fmtCurrency(report.totalCost)}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">الأصول</p>
                    <p className="text-lg font-bold mt-1">{report.totalTrades}</p>
                  </div>
                </div>

                {/* Winners & Losers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-emerald-500">
                      <Trophy className="h-4 w-4" />
                      أفضل الرابحين
                    </h3>
                    {report.topWinners.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد أسهم رابحة</p>
                    ) : (
                      <div className="space-y-2">
                        {report.topWinners.map((s, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                            <span className="text-sm">{s.symbol}</span>
                            <span className="text-emerald-500 font-semibold text-sm">+{fmt(s.returnPct)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-red-500">
                      <TrendingDown className="h-4 w-4" />
                      أسوأ الخاسرين
                    </h3>
                    {report.topLosers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد أسهم خاسرة</p>
                    ) : (
                      <div className="space-y-2">
                        {report.topLosers.map((s, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                            <span className="text-sm">{s.symbol}</span>
                            <span className="text-red-500 font-semibold text-sm">{fmt(s.returnPct)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sector Allocation */}
                {report.sectors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">توزيع القطاعات</h3>
                    <div className="space-y-3">
                      {report.sectors.map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{fmt(s.pct, 1)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(s.pct, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-16 pb-16 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>اختر نوع التقرير ثم اضغط "إنشاء التقرير"</p>
                <p className="text-xs mt-2">التقارير تشمل: ملخص الأداء، أفضل وأسوأ الأسهم، وتوزيع القطاعات</p>
              </CardContent>
            </Card>
          )}

          {/* Report Templates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">قوالب التقارير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: '📄', title: 'تقرير شامل', desc: 'كل البيانات' },
                  { icon: '📈', title: 'تقرير الأداء', desc: 'العائد والمخاطر' },
                  { icon: '💰', title: 'تقرير الضرائب', desc: 'الزكاة والضريبة' },
                ].map((t, i) => (
                  <div key={i} className="p-4 text-center border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="text-3xl mb-2">{t.icon}</div>
                    <div className="font-semibold text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
