'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Globe, TrendingUp, TrendingDown, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

/* ── Market configs ── */
interface MarketConfig {
  id: string;
  label: string;
  flag: string;
  indexName: string;
  indexSym: string;
  currency: string;
  color: string;
  movers: { s: string; n: string }[];
  sectors: { label: string; color: string; syms: { s: string; n: string }[] }[];
}

const MARKETS: MarketConfig[] = [
  {
    id: 'saudi', label: 'السعودية', flag: '🇸🇦', indexName: 'تاسي', indexSym: '^TASI.SR',
    currency: 'ر.س', color: '#22c55e',
    movers: [
      { s: '2222.SR', n: 'أرامكو' }, { s: '1120.SR', n: 'الراجحي' },
      { s: '2010.SR', n: 'سابك' }, { s: '1180.SR', n: 'الأهلي' },
      { s: '2350.SR', n: 'كيان' }, { s: '1211.SR', n: 'معادن' },
    ],
    sectors: [
      { label: 'البنوك', color: '#3b82f6', syms: [{ s: '1120.SR', n: 'الراجحي' }, { s: '1180.SR', n: 'الأهلي' }, { s: '1150.SR', n: 'بنك الإنماء' }] },
      { label: 'البتروكيماويات', color: '#8b5cf6', syms: [{ s: '2010.SR', n: 'سابك' }, { s: '2350.SR', n: 'كيان' }, { s: '2310.SR', n: 'سبكيم' }] },
      { label: 'الطاقة', color: '#f59e0b', syms: [{ s: '2222.SR', n: 'أرامكو' }] },
      { label: 'التعدين', color: '#ef4444', syms: [{ s: '1211.SR', n: 'معادن' }] },
    ],
  },
  {
    id: 'us', label: 'أمريكا', flag: '🇺🇸', indexName: 'S&P 500', indexSym: '^GSPC',
    currency: '$', color: '#3b82f6',
    movers: [
      { s: 'AAPL', n: 'Apple' }, { s: 'MSFT', n: 'Microsoft' },
      { s: 'GOOGL', n: 'Alphabet' }, { s: 'AMZN', n: 'Amazon' },
      { s: 'NVDA', n: 'NVIDIA' }, { s: 'TSLA', n: 'Tesla' },
    ],
    sectors: [
      { label: 'التقنية', color: '#3b82f6', syms: [{ s: 'AAPL', n: 'Apple' }, { s: 'MSFT', n: 'Microsoft' }, { s: 'GOOGL', n: 'Alphabet' }] },
      { label: 'التجزئة', color: '#22c55e', syms: [{ s: 'AMZN', n: 'Amazon' }, { s: 'TSLA', n: 'Tesla' }] },
      { label: 'أشباه الموصلات', color: '#8b5cf6', syms: [{ s: 'NVDA', n: 'NVIDIA' }] },
    ],
  },
  {
    id: 'uae', label: 'الإمارات', flag: '🇦🇪', indexName: 'DFM', indexSym: '^DFMGI',
    currency: 'د.إ', color: '#ef4444',
    movers: [
      { s: 'EMAAR.AE', n: 'إعمار' }, { s: 'DIB.AE', n: 'دبي الإسلامي' },
    ],
    sectors: [
      { label: 'العقارات', color: '#f59e0b', syms: [{ s: 'EMAAR.AE', n: 'إعمار' }] },
      { label: 'البنوك', color: '#3b82f6', syms: [{ s: 'DIB.AE', n: 'دبي الإسلامي' }] },
    ],
  },
  {
    id: 'kuwait', label: 'الكويت', flag: '🇰🇼', indexName: 'بورصة الكويت', indexSym: '^KWSE',
    currency: 'د.ك', color: '#0891b2',
    movers: [
      { s: 'NBK.KW', n: 'بنك الكويت الوطني' }, { s: 'ZAIN.KW', n: 'زين' },
    ],
    sectors: [
      { label: 'البنوك', color: '#3b82f6', syms: [{ s: 'NBK.KW', n: 'بنك الكويت الوطني' }] },
      { label: 'الاتصالات', color: '#8b5cf6', syms: [{ s: 'ZAIN.KW', n: 'زين' }] },
    ],
  },
];

interface IndexData {
  price: number;
  chg: number;
  history: { t: string; v: number }[];
}

interface PriceData {
  price: number;
  changePct: number;
  volume: number;
}

async function fetchMarketSnapshot(indexSym: string, symbols: string[]) {
  const params = new URLSearchParams();
  if (indexSym) params.set('indexSym', indexSym);
  if (symbols.length > 0) params.set('symbols', symbols.join(','));

  try {
    const res = await fetch(`/api/market/snapshot?${params.toString()}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success) return null;
    return {
      index: (data.index ?? null) as IndexData | null,
      prices: (data.prices ?? {}) as Record<string, PriceData>,
    };
  } catch {
    return null;
  }
}

function fmtVol(v: number) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
}

type MoverTab = 'gainers' | 'losers' | 'topValue' | 'topVol';

export default function MarketActionsPage() {
  const [activeMarket, setActiveMarket] = useState('saudi');
  const [moverTab, setMoverTab] = useState<MoverTab>('gainers');
  const [indices, setIndices] = useState<Record<string, IndexData>>({});
  const [prices, setPrices] = useState<Record<string, PriceData>>({});

  const mkt = MARKETS.find(m => m.id === activeMarket) || MARKETS[0];

  // Fetch all market indices
  useEffect(() => {
    const loadAllIndices = async () => {
      MARKETS.forEach(async (m) => {
        const snap = await fetchMarketSnapshot(m.indexSym, []);
        if (snap?.index) {
          setIndices(prev => ({ ...prev, [m.id]: snap.index as IndexData }));
        }
      });
    };

    void loadAllIndices();
    const t = setInterval(loadAllIndices, 300000);
    return () => clearInterval(t);
  }, []);

  // Fetch active market prices
  useEffect(() => {
    const unique = [
      ...new Set([
        ...mkt.movers.map(m => m.s),
        ...mkt.sectors.flatMap(s => s.syms.map(x => x.s)),
      ]),
    ];

    const loadActiveMarket = async () => {
      const snap = await fetchMarketSnapshot(mkt.indexSym, unique);
      if (!snap) return;

      if (snap.index) {
        setIndices(prev => ({ ...prev, [activeMarket]: snap.index as IndexData }));
      }
      setPrices(prev => ({ ...prev, ...snap.prices }));
    };

    void loadActiveMarket();
    const t = setInterval(loadActiveMarket, 60000);
    return () => clearInterval(t);
  }, [activeMarket, mkt]);

  const idx = indices[activeMarket];

  // Sector performance
  const sectorPerf = useMemo(() => mkt.sectors.map(sec => {
    const stocks = sec.syms.map(x => ({
      sym: x.s, name: x.n,
      chg: prices[x.s]?.changePct ?? null,
      price: prices[x.s]?.price ?? null,
    }));
    const withData = stocks.filter(s => s.chg !== null);
    const avgChg = withData.length ? withData.reduce((sum, s) => sum + (s.chg || 0), 0) / withData.length : 0;
    return { ...sec, avgChg, stocks, up: withData.filter(s => (s.chg || 0) > 0).length, dn: withData.filter(s => (s.chg || 0) < 0).length };
  }), [mkt, prices]);

  // All loaded stocks
  const allLoaded = useMemo(() => {
    const seen = new Set<string>();
    const all = [
      ...mkt.movers.map(m => ({ sym: m.s, name: m.n, price: prices[m.s]?.price, chg: prices[m.s]?.changePct, vol: prices[m.s]?.volume || 0 })),
      ...mkt.sectors.flatMap(s => s.syms.map(x => ({ sym: x.s, name: x.n, price: prices[x.s]?.price, chg: prices[x.s]?.changePct, vol: prices[x.s]?.volume || 0 }))),
    ].filter(x => {
      if (!x.price || seen.has(x.sym)) return false;
      seen.add(x.sym);
      return true;
    });
    return all.map(x => ({ ...x, value: (x.price || 0) * (x.vol || 0) }));
  }, [prices, mkt]);

  const gainers = [...allLoaded].sort((a, b) => (b.chg || 0) - (a.chg || 0)).filter(s => (s.chg || 0) > 0).slice(0, 6);
  const losers = [...allLoaded].sort((a, b) => (a.chg || 0) - (b.chg || 0)).filter(s => (s.chg || 0) < 0).slice(0, 6);
  const topValue = [...allLoaded].filter(s => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const topVol = [...allLoaded].filter(s => s.vol > 0).sort((a, b) => b.vol - a.vol).slice(0, 6);

  const totalUp = allLoaded.filter(s => (s.chg || 0) > 0).length;
  const totalDn = allLoaded.filter(s => (s.chg || 0) < 0).length;

  const TABS: { k: MoverTab; icon: string; title: string; data: typeof allLoaded; showVol?: boolean; showValue?: boolean }[] = [
    { k: 'gainers', icon: '🚀', title: 'أكثر ارتفاعا', data: gainers },
    { k: 'losers', icon: '📉', title: 'أكثر انخفاضا', data: losers },
    { k: 'topValue', icon: '💰', title: 'أعلى قيمة تداول', data: topValue, showValue: true },
    { k: 'topVol', icon: '📊', title: 'أعلى حجم تداول', data: topVol, showVol: true },
  ];

  const activeTab = TABS.find(t => t.k === moverTab) || TABS[0];

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              إجراءات السوق
            </h1>
            <p className="text-muted-foreground text-sm mt-1">نظرة شاملة على أداء الأسواق والقطاعات</p>
          </div>

          {/* Market Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {MARKETS.map(m => {
              const idxD = indices[m.id];
              const isActive = activeMarket === m.id;
              return (
                <Button
                  key={m.id}
                  variant={isActive ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3 px-5 min-w-[90px]"
                  onClick={() => setActiveMarket(m.id)}
                >
                  <span className="text-lg">{m.flag}</span>
                  <span className="text-xs font-bold">{m.indexName}</span>
                  {idxD ? (
                    <span className={`text-xs font-bold ${idxD.chg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {idxD.chg >= 0 ? '▲' : '▼'}{Math.abs(idxD.chg).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Hero Index Card */}
          <Card className="overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(var(--card)), ${mkt.color}22)` }}>
            <CardContent className="pt-6 flex items-center gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm text-muted-foreground mb-1">{mkt.flag} {mkt.label} · {mkt.indexName}</p>
                {!idx ? (
                  <p className="text-muted-foreground">جاري جلب البيانات...</p>
                ) : (
                  <>
                    <p className="text-4xl font-black" dir="ltr">
                      {idx.price?.toLocaleString('en', { maximumFractionDigits: 2 })}
                      <span className="text-sm text-muted-foreground mr-2">{mkt.currency}</span>
                    </p>
                    <span className={`text-lg font-bold ${idx.chg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {idx.chg >= 0 ? '▲' : '▼'}{Math.abs(idx.chg).toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
              {idx?.history && idx.history.length > 0 && (
                <div className="w-48 h-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={idx.history}>
                      <defs>
                        <linearGradient id={`mg${activeMarket}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={idx.chg >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={idx.chg >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={idx.chg >= 0 ? '#22c55e' : '#ef4444'} fill={`url(#mg${activeMarket})`} dot={false} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex gap-3 shrink-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 rounded-xl">
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-black text-emerald-500">{totalUp}</p>
                    <p className="text-xs text-muted-foreground">صاعدة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 rounded-xl">
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-2xl font-black text-red-500">{totalDn}</p>
                    <p className="text-xs text-muted-foreground">هابطة</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                أداء قطاعات {mkt.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sectorPerf.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/50 border-r-[3px]" style={{ borderColor: s.color }}>
                    <p className="text-sm font-bold mb-1">{s.label}</p>
                    <p className={`text-lg font-black ${s.avgChg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {s.avgChg !== 0 ? `${s.avgChg >= 0 ? '+' : ''}${s.avgChg.toFixed(2)}%` : '--'}
                    </p>
                    <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.avgChg >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(s.avgChg) * 20, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.up}↑ {s.dn}↓</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sector Stock Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorPerf.map((sec, si) => (
              <Card key={si}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: sec.color }} />
                      {sec.label}
                    </CardTitle>
                    <Badge variant={sec.avgChg >= 0 ? 'default' : 'destructive'} className="text-xs">
                      {sec.avgChg >= 0 ? '+' : ''}{sec.avgChg.toFixed(2)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0">
                  {sec.stocks.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded min-w-[45px] text-center">{s.sym.split('.')[0]}</span>
                      <span className="flex-1 text-sm truncate">{s.name}</span>
                      {s.price != null ? (
                        <>
                          <span className="text-sm font-bold" dir="ltr">{s.price.toFixed(2)}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${(s.chg || 0) >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {(s.chg || 0) >= 0 ? '+' : ''}{s.chg?.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">جاري...</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Movers Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TABS.map(t => (
              <Button
                key={t.k}
                variant={moverTab === t.k ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setMoverTab(t.k)}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="text-xs font-bold">{t.title}</span>
              </Button>
            ))}
          </div>

          {/* Movers List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{activeTab.icon} {activeTab.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab.data.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">جاري تحميل البيانات...</div>
              ) : (
                <div className="space-y-0">
                  {activeTab.data.map((s, i) => (
                    <div key={i} className={`flex items-center gap-4 py-3 px-2 ${i % 2 === 0 ? '' : 'bg-muted/30'} border-b last:border-0`}>
                      <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" dir="ltr">{s.sym.split('.')[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.name}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-bold text-sm" dir="ltr">{s.price?.toFixed(2)}</p>
                        {activeTab.showValue && <p className="text-xs text-cyan-500 font-semibold">{fmtVol(s.value || 0)}</p>}
                        {activeTab.showVol && <p className="text-xs text-amber-500 font-semibold">{fmtVol(s.vol || 0)}</p>}
                        <p className={`text-sm font-bold ${(s.chg || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {(s.chg || 0) >= 0 ? '▲ +' : '▼ '}{Math.abs(s.chg || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
