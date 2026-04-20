'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator, TrendingUp, Target, BarChart3, ArrowUpDown,
  Scale, Crosshair, DollarSign, Percent, RotateCcw,
} from 'lucide-react';
import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Safe math evaluator — recursive descent parser (no eval)
// ---------------------------------------------------------------------------
function safeMathEval(expr: string): number {
  const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!/^[0-9+\-*/.()]+$/.test(normalized)) throw new Error('Invalid');
  let pos = 0;
  const peek = () => normalized[pos];
  function parseExpr(): number {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = normalized[pos++];
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }
  function parseTerm(): number {
    let left = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = normalized[pos++];
      const right = parseFactor();
      if (op === '/') { if (right === 0) throw new Error('Div/0'); left /= right; }
      else left *= right;
    }
    return left;
  }
  function parseFactor(): number {
    if (peek() === '(') { pos++; const v = parseExpr(); pos++; return v; }
    if (peek() === '-') { pos++; return -parseFactor(); }
    let n = '';
    while (peek() && /[0-9.]/.test(peek())) n += normalized[pos++];
    if (!n) throw new Error('Expected number');
    return parseFloat(n);
  }
  const result = parseExpr();
  if (pos !== normalized.length) throw new Error('Unexpected');
  return result;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RowData { qty: string; price: string }
interface TradePL { avgBuy: number; avgSell: number; buyTotal: number; netSell: number; pl: number; plPct: number }
interface AvgResult { avg: string; qty: number; cost: string }
interface PosResult { qty: number; cost: number; riskAmt: number; riskPerShare: number; rewardRisk: number | null; potentialProfit: number | null; pctOfCapital: number }
interface DcfCashFlow { year: number; fcf: string; pv: string }
interface DcfResult { pv: string; pvTV: string; total: string; cashFlows: DcfCashFlow[]; upside: string }
interface CalcHistory { expr: string; result: string | number }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CalculatorPage() {
  // ── Standard Calculator ──
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<CalcHistory[]>([]);
  const [justCalc, setJustCalc] = useState(false);

  const calcPress = useCallback((key: string) => {
    if (key === 'C') { setDisplay('0'); setExpr(''); setJustCalc(false); return; }
    if (key === 'CE') { setDisplay('0'); return; }
    if (key === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if (key === 'M+') { setMemory(m => m + parseFloat(display || '0')); return; }
    if (key === 'M-') { setMemory(m => m - parseFloat(display || '0')); return; }
    if (key === 'MR') { setDisplay(String(memory)); return; }
    if (key === 'MC') { setMemory(0); return; }
    if (key === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }
    if (key === '+/-') { setDisplay(d => String(-parseFloat(d))); return; }
    if (key === '√') { setDisplay(d => String(Math.sqrt(parseFloat(d)))); return; }
    if (key === 'x²') { setDisplay(d => String(Math.pow(parseFloat(d), 2))); return; }
    if (key === '1/x') { setDisplay(d => String(1 / parseFloat(d))); return; }
    if (key === '=') {
      try {
        const fullExpr = expr + display;
        const result = safeMathEval(fullExpr);
        const r = Number.isFinite(result) ? +result.toFixed(10) : 'خطأ';
        setHistory(h => [...h.slice(-9), { expr: fullExpr, result: r }]);
        setDisplay(String(r));
        setExpr('');
        setJustCalc(true);
      } catch { setDisplay('خطأ'); }
      return;
    }
    const isOp = ['+', '-', '×', '÷'].includes(key);
    if (isOp) {
      setExpr((justCalc ? display : expr + display) + key);
      setDisplay('0');
      setJustCalc(false);
      return;
    }
    setDisplay(d => {
      if (justCalc) { setJustCalc(false); return key === '.' ? '0.' : key; }
      if (key === '.' && d.includes('.')) return d;
      return d === '0' && key !== '.' ? key : d + key;
    });
  }, [display, expr, justCalc, memory]);

  // ── P&L Calculator ──
  const [buyPrice, setBuyPrice] = useState('100');
  const [sellPrice, setSellPrice] = useState('120');
  const [quantity, setQuantity] = useState('10');
  const [fees, setFees] = useState('0.15');
  const [vatPct, setVatPct] = useState('15');
  const totalBuy = parseFloat(buyPrice || '0') * parseFloat(quantity || '0');
  const totalSell = parseFloat(sellPrice || '0') * parseFloat(quantity || '0');
  const brokPct = parseFloat(fees || '0') / 100;
  const vatRate = parseFloat(vatPct || '0') / 100;
  const buyBrok = totalBuy * brokPct;
  const sellBrok = totalSell * brokPct;
  const totalVat = (buyBrok + sellBrok) * vatRate;
  const totalFees = buyBrok + sellBrok + totalVat;
  const profit = totalSell - totalBuy - totalFees;
  const profitPct = totalBuy > 0 ? ((profit / totalBuy) * 100) : 0;

  // ── Trading (مضاربة) ──
  const emptyRows = (): RowData[] => Array(5).fill(null).map(() => ({ qty: '', price: '' }));
  const [buyRows, setBuyRows] = useState<RowData[]>(emptyRows());
  const [sellRows, setSellRows] = useState<RowData[]>(emptyRows());
  const [tradePL, setTradePL] = useState<TradePL | null>(null);

  const calcTrade = () => {
    const buy = buyRows.filter(r => r.qty && r.price).reduce((s, r) => ({ qty: s.qty + (+r.qty), cost: s.cost + (+r.qty) * (+r.price) }), { qty: 0, cost: 0 });
    const sell = sellRows.filter(r => r.qty && r.price).reduce((s, r) => ({ qty: s.qty + (+r.qty), rev: s.rev + (+r.qty) * (+r.price) }), { qty: 0, rev: 0 });
    const avgBuy = buy.qty ? buy.cost / buy.qty : 0;
    const avgSell = sell.qty ? sell.rev / sell.qty : 0;
    const brok = brokPct;
    const buyTotal = buy.cost * (1 + brok);
    const sellBrokAmt = sell.rev * brok;
    const netSell = sell.rev - sellBrokAmt - sellBrokAmt * vatRate;
    const pl = netSell - buyTotal;
    setTradePL({ avgBuy, avgSell, buyTotal, netSell, pl, plPct: buyTotal > 0 ? (pl / buyTotal) * 100 : 0 });
  };

  // ── Average Price ──
  const [avgRows, setAvgRows] = useState<RowData[]>(emptyRows());
  const [avgResult, setAvgResult] = useState<AvgResult | null>(null);
  const calcAvg = () => {
    const rows = avgRows.filter(r => r.qty && r.price);
    if (!rows.length) return;
    const total = rows.reduce((s, r) => ({ qty: s.qty + (+r.qty), cost: s.cost + (+r.qty) * (+r.price) }), { qty: 0, cost: 0 });
    setAvgResult({ avg: (total.cost / total.qty).toFixed(4), qty: total.qty, cost: total.cost.toFixed(2) });
  };

  // ── Position Sizing ──
  const [posForm, setPosForm] = useState({ price: '', target: '', stopLoss: '', capital: '', riskPct: '2' });
  const [posResult, setPosResult] = useState<PosResult | null>(null);
  const pf = (k: string, v: string) => { setPosForm(p => ({ ...p, [k]: v })); setPosResult(null); };
  const calcPosition = () => {
    const p = +posForm.price, t = +posForm.target, sl = +posForm.stopLoss, cap = +posForm.capital, rPct = +posForm.riskPct;
    if (!p || !sl || !cap) return;
    const riskPerShare = Math.abs(p - sl);
    const riskAmt = cap * (rPct / 100);
    const qty = Math.floor(riskAmt / riskPerShare);
    const cost = qty * p;
    const rewardRisk = t > 0 ? Math.abs(t - p) / riskPerShare : null;
    const potentialProfit = t > 0 ? qty * (t - p) : null;
    setPosResult({ qty, cost, riskAmt, riskPerShare, rewardRisk, potentialProfit, pctOfCapital: (cost / cap) * 100 });
  };

  // ── DCF ──
  const [dcfForm, setDcfForm] = useState({ eps: 5, growth1: 15, growth2: 8, terminal: 3, discount: 10, years: 5 });
  const [dcfResult, setDcfResult] = useState<DcfResult | null>(null);
  const df = (k: string, v: string) => setDcfForm(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const calcDCF = () => {
    const { eps, growth1, growth2, terminal, discount, years } = dcfForm;
    let fcf = eps, pv = 0;
    const cashFlows: DcfCashFlow[] = [];
    for (let i = 1; i <= years; i++) {
      const g = i <= 3 ? growth1 / 100 : growth2 / 100;
      fcf = fcf * (1 + g);
      const pvF = fcf / Math.pow(1 + discount / 100, i);
      pv += pvF;
      cashFlows.push({ year: i, fcf: fcf.toFixed(2), pv: pvF.toFixed(2) });
    }
    const tv = (fcf * (1 + terminal / 100)) / (discount / 100 - terminal / 100);
    const pvTV = tv / Math.pow(1 + discount / 100, years);
    const total = pv + pvTV;
    setDcfResult({ pv: pv.toFixed(2), pvTV: pvTV.toFixed(2), total: total.toFixed(2), cashFlows, upside: ((total - eps * 15) / (eps * 15) * 100).toFixed(1) });
  };

  // Calculator Buttons
  const BTNS = [
    ['MC', 'MR', 'M+', 'M-'],
    ['CE', 'C', '⌫', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['√', 'x²', '1/x', '%'],
    ['+/-', '0', '.', '='],
  ];
  const btnClass = (k: string) =>
    k === '=' ? 'bg-primary text-primary-foreground font-black text-xl hover:bg-primary/90' :
    ['+', '-', '×', '÷'].includes(k) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-200' :
    ['MC', 'MR', 'M+', 'M-', 'CE', 'C', '⌫'].includes(k) ? 'bg-muted font-semibold hover:bg-muted/80' :
    'bg-card font-semibold hover:bg-accent';

  // Row input helper
  const RowInput = ({ rows, setRows, idx }: { rows: RowData[]; setRows: (r: RowData[]) => void; idx: number }) => (
    <div className="flex gap-2 mb-1.5">
      <Input type="number" placeholder="الكمية" className="h-9 text-sm" value={rows[idx].qty}
        onChange={e => { const r = [...rows]; r[idx] = { ...r[idx], qty: e.target.value }; setRows(r); }} />
      <Input type="number" placeholder="السعر" className="h-9 text-sm" value={rows[idx].price}
        onChange={e => { const r = [...rows]; r[idx] = { ...r[idx], price: e.target.value }; setRows(r); }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="الحاسبة المالية" />
        <main className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              الحاسبة المالية الشاملة
            </h1>
            <p className="text-muted-foreground mt-1">آلة حاسبة • أرباح وخسائر • المضاربة • متوسط السعر • حجم المركز • التقييم DCF</p>
          </div>

          <Tabs defaultValue="standard" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
              <TabsTrigger value="standard" className="gap-1.5 text-xs sm:text-sm"><Calculator className="h-4 w-4" />آلة حاسبة</TabsTrigger>
              <TabsTrigger value="pnl" className="gap-1.5 text-xs sm:text-sm"><TrendingUp className="h-4 w-4" />أرباح وخسائر</TabsTrigger>
              <TabsTrigger value="trade" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="h-4 w-4" />المضاربة</TabsTrigger>
              <TabsTrigger value="avg" className="gap-1.5 text-xs sm:text-sm"><Scale className="h-4 w-4" />متوسط السعر</TabsTrigger>
              <TabsTrigger value="position" className="gap-1.5 text-xs sm:text-sm"><Crosshair className="h-4 w-4" />حجم المركز</TabsTrigger>
              <TabsTrigger value="dcf" className="gap-1.5 text-xs sm:text-sm"><Target className="h-4 w-4" />DCF</TabsTrigger>
            </TabsList>

            {/* ═══ Standard Calculator ═══ */}
            <TabsContent value="standard">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                  <CardContent className="p-4">
                    {/* Display */}
                    <div className="bg-muted rounded-xl p-4 mb-4" dir="ltr">
                      <div className="text-xs text-muted-foreground min-h-[16px]">{expr}&nbsp;</div>
                      <div className="text-4xl font-black text-primary overflow-hidden text-ellipsis whitespace-nowrap">{display}</div>
                      {memory !== 0 && <div className="text-xs text-cyan-600 mt-1">M: {memory}</div>}
                    </div>
                    {/* Buttons */}
                    {BTNS.map((row, ri) => (
                      <div key={ri} className="grid grid-cols-4 gap-1.5 mb-1.5">
                        {row.map(k => (
                          <button key={k} onClick={() => calcPress(k)}
                            className={`py-3.5 rounded-lg border-0 cursor-pointer transition-all shadow-sm text-base ${btnClass(k)}`}>
                            {k}
                          </button>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {/* History */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">📋 سجل العمليات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {history.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-12">لا يوجد سجل بعد</div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {[...history].reverse().map((h, i) => (
                          <div key={i} onClick={() => setDisplay(String(h.result))}
                            className="p-3 rounded-lg bg-muted hover:bg-primary/10 cursor-pointer transition-colors">
                            <div className="text-xs text-muted-foreground" dir="ltr">{h.expr} =</div>
                            <div className="font-bold text-primary" dir="ltr">{h.result}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {history.length > 0 && (
                      <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5" onClick={() => setHistory([])}>
                        <RotateCcw className="h-3.5 w-3.5" />مسح السجل
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══ P&L Calculator ═══ */}
            <TabsContent value="pnl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />حاسبة الأرباح والخسائر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2"><Label>سعر الشراء</Label><Input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} /></div>
                    <div className="space-y-2"><Label>سعر البيع</Label><Input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} /></div>
                    <div className="space-y-2"><Label>الكمية</Label><Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
                    <div className="space-y-2"><Label>نسبة العمولة (%)</Label><Input type="number" value={fees} onChange={e => setFees(e.target.value)} step="0.01" /></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'إجمالي الشراء', value: totalBuy.toFixed(2), color: '' },
                      { label: 'إجمالي البيع', value: totalSell.toFixed(2), color: '' },
                      { label: 'العمولات', value: buyBrok.toFixed(2) + ' + ' + sellBrok.toFixed(2), color: '' },
                      { label: 'ضريبة القيمة المضافة', value: totalVat.toFixed(2), color: '' },
                      { label: 'صافي الربح', value: `${profit.toFixed(2)} (${profitPct.toFixed(2)}%)`, color: profit >= 0 ? 'text-green-600' : 'text-red-600' },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-4 bg-muted rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Trading (مضاربة) ═══ */}
            <TabsContent value="trade">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />حاسبة المضاربة والربح/الخسارة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <div className="text-sm font-bold text-green-600 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">🟢 صفقات الشراء</div>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground px-1"><span>الكمية</span><span>السعر</span></div>
                      {buyRows.map((_, i) => <RowInput key={i} rows={buyRows} setRows={setBuyRows} idx={i} />)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-red-600 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">🔴 صفقات البيع</div>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground px-1"><span>الكمية</span><span>السعر</span></div>
                      {sellRows.map((_, i) => <RowInput key={i} rows={sellRows} setRows={setSellRows} idx={i} />)}
                    </div>
                  </div>
                  <Button className="w-full gap-2" size="lg" onClick={calcTrade}><BarChart3 className="h-4 w-4" />احسب الربح / الخسارة</Button>
                  {tradePL && (
                    <div className={`mt-6 p-5 rounded-xl border-2 ${tradePL.pl >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'}`}>
                      <div className={`text-2xl font-black text-center mb-4 ${tradePL.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tradePL.pl >= 0 ? '▲ ربح: +' : '▼ خسارة: '}{Math.abs(tradePL.pl).toFixed(2)}
                        <span className="text-base mr-2">({tradePL.plPct.toFixed(2)}٪)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { l: 'متوسط الشراء', v: tradePL.avgBuy.toFixed(4) },
                          { l: 'متوسط البيع', v: tradePL.avgSell.toFixed(4) },
                          { l: 'إجمالي الشراء', v: tradePL.buyTotal.toFixed(2) },
                          { l: 'صافي البيع', v: tradePL.netSell.toFixed(2) },
                        ].map((r, i) => (
                          <div key={i} className="bg-background rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground">{r.l}</div>
                            <div className="font-bold text-sm tabular-nums" dir="ltr">{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Average Price ═══ */}
            <TabsContent value="avg">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />حاسبة متوسط سعر الشراء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground font-bold px-1"><span>الكمية</span><span>السعر</span></div>
                    {avgRows.map((_, i) => <RowInput key={i} rows={avgRows} setRows={setAvgRows} idx={i} />)}
                    <Button className="w-full mt-4 gap-2" size="lg" onClick={calcAvg}><Scale className="h-4 w-4" />احسب المتوسط</Button>
                    {avgResult && (
                      <div className="mt-6 p-5 rounded-xl bg-muted border text-center">
                        <div className="text-xs text-muted-foreground mb-1">متوسط سعر الشراء</div>
                        <div className="text-4xl font-black text-primary" dir="ltr">{avgResult.avg}</div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-background rounded-lg p-3">
                            <div className="text-xs text-muted-foreground">إجمالي الكمية</div>
                            <div className="font-bold text-lg">{avgResult.qty}</div>
                          </div>
                          <div className="bg-background rounded-lg p-3">
                            <div className="text-xs text-muted-foreground">إجمالي التكلفة</div>
                            <div className="font-bold text-lg">{avgResult.cost}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Position Sizing ═══ */}
            <TabsContent value="position">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crosshair className="h-5 w-5 text-primary" />حاسبة حجم المركز (Position Sizing)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs">💰 السعر الحالي</Label><Input type="number" step="0.01" value={posForm.price} onChange={e => pf('price', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">🎯 السعر المستهدف</Label><Input type="number" step="0.01" value={posForm.target} onChange={e => pf('target', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">🛑 وقف الخسارة</Label><Input type="number" step="0.01" value={posForm.stopLoss} onChange={e => pf('stopLoss', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">💼 رأس المال الكلي</Label><Input type="number" step="0.01" value={posForm.capital} onChange={e => pf('capital', e.target.value)} /></div>
                      <div className="col-span-2 space-y-1.5"><Label className="text-xs">⚠️ نسبة المخاطرة (% من رأس المال)</Label><Input type="number" step="0.1" value={posForm.riskPct} onChange={e => pf('riskPct', e.target.value)} /></div>
                    </div>
                    <Button className="w-full gap-2" size="lg" onClick={calcPosition}><Crosshair className="h-4 w-4" />احسب الحجم الأمثل</Button>
                  </CardContent>
                </Card>
                {posResult && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">📊 النتيجة</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-center p-5 bg-primary/10 rounded-xl border-2 border-primary mb-4">
                        <div className="text-xs text-muted-foreground">عدد الأسهم الأمثل</div>
                        <div className="text-4xl font-black text-primary">{posResult.qty.toLocaleString()}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { l: 'إجمالي الاستثمار', v: posResult.cost.toFixed(2) },
                          { l: '% من رأس المال', v: posResult.pctOfCapital.toFixed(1) + '٪' },
                          { l: 'مبلغ المخاطرة', v: posResult.riskAmt.toFixed(2), c: 'text-red-600' },
                          { l: 'مخاطرة/سهم', v: posResult.riskPerShare.toFixed(4) },
                          ...(posResult.rewardRisk ? [{ l: 'Risk/Reward', v: '1:' + posResult.rewardRisk.toFixed(2), c: posResult.rewardRisk >= 2 ? 'text-green-600' : 'text-red-600' }] : []),
                          ...(posResult.potentialProfit != null ? [{ l: 'الربح المتوقع', v: posResult.potentialProfit.toFixed(2), c: 'text-green-600' }] : []),
                        ].map((r, i) => (
                          <div key={i} className="bg-muted rounded-lg p-3">
                            <div className="text-xs text-muted-foreground">{r.l}</div>
                            <div className={`font-bold text-sm tabular-nums ${(r as {c?: string}).c || ''}`} dir="ltr">{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═══ DCF Valuation ═══ */}
            <TabsContent value="dcf">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />تقييم التدفقات النقدية المخصومة DCF</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5"><Label>ربحية السهم EPS (ر.س)</Label><Input type="number" value={dcfForm.eps} onChange={e => df('eps', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs">نمو السنوات الأولى (3) %</Label><Input type="number" value={dcfForm.growth1} onChange={e => df('growth1', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">نمو السنوات التالية %</Label><Input type="number" value={dcfForm.growth2} onChange={e => df('growth2', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">معدل النمو النهائي %</Label><Input type="number" value={dcfForm.terminal} onChange={e => df('terminal', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">معدل الخصم WACC %</Label><Input type="number" value={dcfForm.discount} onChange={e => df('discount', e.target.value)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label>عدد السنوات</Label><Input type="number" value={dcfForm.years} onChange={e => df('years', e.target.value)} /></div>
                    <Button className="w-full gap-2" size="lg" onClick={calcDCF}><Target className="h-4 w-4" />احسب القيمة العادلة</Button>
                  </CardContent>
                </Card>
                {dcfResult && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">النتيجة</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-primary/10 rounded-xl border-2 border-primary">
                          <div className="text-3xl font-black text-primary">{dcfResult.total}</div>
                          <div className="text-xs text-muted-foreground mt-1">القيمة العادلة ر.س</div>
                        </div>
                        <div className={`text-center p-4 rounded-xl border-2 ${parseFloat(dcfResult.upside) >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-300' : 'bg-red-50 dark:bg-red-900/10 border-red-300'}`}>
                          <div className={`text-3xl font-black ${parseFloat(dcfResult.upside) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(dcfResult.upside) >= 0 ? '+' : ''}{dcfResult.upside}٪
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">فرصة الارتفاع</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="font-bold">{dcfResult.pv}</div>
                          <div className="text-xs text-muted-foreground">PV التدفقات</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="font-bold">{dcfResult.pvTV}</div>
                          <div className="text-xs text-muted-foreground">PV القيمة النهائية</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold mb-2">تفصيل التدفقات</div>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr><th className="p-2 text-right">السنة</th><th className="p-2 text-right">FCF</th><th className="p-2 text-right">PV</th></tr>
                          </thead>
                          <tbody>
                            {dcfResult.cashFlows.map(r => (
                              <tr key={r.year} className="border-t">
                                <td className="p-2">{r.year}</td>
                                <td className="p-2 tabular-nums" dir="ltr">{r.fcf}</td>
                                <td className="p-2 tabular-nums text-primary font-medium" dir="ltr">{r.pv}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
