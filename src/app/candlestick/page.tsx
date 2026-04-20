'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  CandlestickChart,
  BarChart3,
  AlertTriangle,
  Target,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// بيانات الشموع اليابانية
const candlestickPatterns = [
  {
    id: 1,
    name: 'الدوجي (Doji)',
    nameEn: 'Doji',
    description: 'شمعة صغيرة الجسم جداً مع ظلال طويلة من الجهتين',
    signal: 'تردد في السوق، قد يشير إلى انعكاس',
    type: 'neutral',
    reliability: 70,
    image: '🕯️',
  },
  {
    id: 2,
    name: 'المطرقة (Hammer)',
    nameEn: 'Hammer',
    description: 'جسم صغير في الأعلى مع ظل سفلي طويل',
    signal: 'انعكاس صعودي - إشارة شراء',
    type: 'bullish',
    reliability: 85,
    image: '🔨',
  },
  {
    id: 3,
    name: 'النجم الساطع (Shooting Star)',
    nameEn: 'Shooting Star',
    description: 'جسم صغير في الأسفل مع ظل علوي طويل',
    signal: 'انعكاس هبوطي - إشارة بيع',
    type: 'bearish',
    reliability: 80,
    image: '⭐',
  },
  {
    id: 4,
    name: 'الابتلاع الصعودي (Bullish Engulfing)',
    nameEn: 'Bullish Engulfing',
    description: 'شمعة خضراء تبتلع الشمعة الحمراء السابقة',
    signal: 'انعكاس صعودي قوي',
    type: 'bullish',
    reliability: 90,
    image: '📈',
  },
  {
    id: 5,
    name: 'الابتلاع الهبوطي (Bearish Engulfing)',
    nameEn: 'Bearish Engulfing',
    description: 'شمعة حمراء تبتلع الشمعة الخضراء السابقة',
    signal: 'انعكاس هبوطي قوي',
    type: 'bearish',
    reliability: 90,
    image: '📉',
  },
  {
    id: 6,
    name: 'الصباح المشرق (Morning Star)',
    nameEn: 'Morning Star',
    description: 'ثلاث شموع: حمراء كبيرة، صغيرة، خضراء كبيرة',
    signal: 'انعكاس صعودي قوي جداً',
    type: 'bullish',
    reliability: 95,
    image: '🌅',
  },
  {
    id: 7,
    name: 'المساء (Evening Star)',
    nameEn: 'Evening Star',
    description: 'ثلاث شموع: خضراء كبيرة، صغيرة، حمراء كبيرة',
    signal: 'انعكاس هبوطي قوي جداً',
    type: 'bearish',
    reliability: 95,
    image: '🌆',
  },
  {
    id: 8,
    name: 'ال Harami',
    nameEn: 'Harami',
    description: 'شمعة صغيرة داخل جسم الشمعة الكبيرة السابقة',
    signal: 'تردد وإمكانية انعكاس',
    type: 'neutral',
    reliability: 75,
    image: '🤰',
  },
];

// بيانات الشموع اليومية
const dailyCandles = [
  { date: '2024-01-01', open: 105, high: 108, low: 102, close: 106, volume: 1500000, pattern: null },
  { date: '2024-01-02', open: 106, high: 110, low: 104, close: 109, volume: 1800000, pattern: null },
  { date: '2024-01-03', open: 109, high: 112, low: 108, close: 108, volume: 1200000, pattern: 'Shooting Star' },
  { date: '2024-01-04', open: 108, high: 108, low: 102, close: 103, volume: 2000000, pattern: null },
  { date: '2024-01-05', open: 103, high: 105, low: 101, close: 102, volume: 1600000, pattern: null },
  { date: '2024-01-06', open: 102, high: 104, low: 100, close: 104, volume: 1400000, pattern: 'Hammer' },
  { date: '2024-01-07', open: 104, high: 108, low: 103, close: 107, volume: 1900000, pattern: null },
  { date: '2024-01-08', open: 107, high: 111, low: 106, close: 110, volume: 2100000, pattern: null },
  { date: '2024-01-09', open: 110, high: 115, low: 109, close: 114, volume: 2500000, pattern: null },
  { date: '2024-01-10', open: 114, high: 116, low: 112, close: 113, volume: 1800000, pattern: null },
  { date: '2024-01-11', open: 113, high: 114, low: 110, close: 111, volume: 1500000, pattern: null },
  { date: '2024-01-12', open: 111, high: 113, low: 108, close: 109, volume: 1700000, pattern: null },
  { date: '2024-01-13', open: 109, high: 112, low: 107, close: 112, volume: 2000000, pattern: 'Bullish Engulfing' },
  { date: '2024-01-14', open: 112, high: 118, low: 111, close: 117, volume: 2300000, pattern: null },
  { date: '2024-01-15', open: 117, high: 120, low: 115, close: 119, volume: 2600000, pattern: null },
];

// الأنماط المكتشفة حالياً
const detectedPatterns = [
  {
    stock: '1180.SR',
    name: 'الراجحي',
    pattern: 'Hammer',
    date: 'اليوم',
    signal: 'شراء',
    confidence: 85,
    priceTarget: 112.50,
  },
  {
    stock: '1120.SR',
    name: 'أرامكو',
    pattern: 'Bearish Engulfing',
    date: 'أمس',
    signal: 'بيع',
    confidence: 78,
    priceTarget: 27.20,
  },
  {
    stock: '7010.SR',
    name: 'الاتصالات',
    pattern: 'Doji',
    date: 'اليوم',
    signal: 'انتظار',
    confidence: 65,
    priceTarget: null,
  },
];

// مكون شمعة واحدة
function CandleComponent({ candle, index, showPattern = false }: { candle: typeof dailyCandles[0]; index: number; showPattern?: boolean }) {
  const isGreen = candle.close >= candle.open;
  const bodyHeight = Math.abs(candle.close - candle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const range = candle.high - candle.low;
  const maxRange = 20; // نطاق السعر

  const bodyHeightPct = (bodyHeight / maxRange) * 100;
  const upperShadowPct = (upperShadow / maxRange) * 100;
  const lowerShadowPct = (lowerShadow / maxRange) * 100;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* نمط مكتشف */}
      {showPattern && candle.pattern && (
        <Badge className="text-[10px] mb-1" variant="outline">
          {candle.pattern}
        </Badge>
      )}

      {/* الشمعة */}
      <div className="relative w-8 h-32 flex flex-col items-center justify-center">
        {/* الظل العلوي */}
        <div
          className="w-0.5 bg-muted-foreground/50"
          style={{ height: `${upperShadowPct * 3}px` }}
        />

        {/* جسم الشمعة */}
        <div
          className={cn(
            'w-6 rounded-sm transition-all',
            isGreen ? 'bg-green-500' : 'bg-red-500'
          )}
          style={{ height: `${Math.max(bodyHeightPct * 3, 2)}px` }}
        />

        {/* الظل السفلي */}
        <div
          className="w-0.5 bg-muted-foreground/50"
          style={{ height: `${lowerShadowPct * 3}px` }}
        />
      </div>

      {/* التاريخ */}
      <span className="text-[10px] text-muted-foreground">
        {new Date(candle.date).getDate()}
      </span>
    </div>
  );
}

export default function CandlestickPage() {
  const [selectedStock, setSelectedStock] = useState('1180.SR');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'hourly'>('daily');
  const [patternFilter, setPatternFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');

  const filteredPatterns = candlestickPatterns.filter(p =>
    patternFilter === 'all' || p.type === patternFilter
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="🕯️ الشموع اليابانية" />
        <main className="p-6 space-y-6">
          {/* العنوان */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CandlestickChart className="h-7 w-7 text-primary" />
                أنماط الشموع اليابانية
              </h2>
              <p className="text-muted-foreground">
                تعلم واكتشف أنماط الشموع اليابانية للتداول
              </p>
            </div>
          </div>

          {/* الأنماط المكتشفة حالياً */}
          <Card className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                أنماط مكتشفة اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {detectedPatterns.map((p) => (
                  <div
                    key={p.stock}
                    className={cn(
                      'p-4 rounded-lg border',
                      p.signal === 'شراء' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                      p.signal === 'بيع' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                      p.signal === 'انتظار' && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold">{p.stock}</p>
                        <p className="text-sm text-muted-foreground">{p.name}</p>
                      </div>
                      <Badge
                        className={cn(
                          p.signal === 'شراء' && 'bg-green-600',
                          p.signal === 'بيع' && 'bg-red-600',
                          p.signal === 'انتظار' && 'bg-amber-600'
                        )}
                      >
                        {p.signal}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">النمط:</span>
                        <span className="font-medium">{p.pattern}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الثقة:</span>
                        <span className={cn(
                          'font-medium',
                          p.confidence >= 80 ? 'text-green-600' :
                          p.confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {p.confidence}%
                        </span>
                      </div>
                      {p.priceTarget && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">الهدف:</span>
                          <span className="font-medium">{p.priceTarget} ر.س</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* الرسم البياني */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                الرسم البياني للشموع
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="اختر السهم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1180.SR">الراجحي</SelectItem>
                    <SelectItem value="1120.SR">أرامكو</SelectItem>
                    <SelectItem value="7010.SR">الاتصالات</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="الإطار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="hourly">ساعي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* محاكاة الرسم البياني */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-end justify-between h-48 gap-1 overflow-x-auto pb-2">
                  {dailyCandles.map((candle, index) => (
                    <CandleComponent key={index} candle={candle} index={index} showPattern={!!candle.pattern} />
                  ))}
                </div>

                {/* محور السعر */}
                <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <span>120 ر.س</span>
                  <span>110 ر.س</span>
                  <span>100 ر.س</span>
                </div>
              </div>

              {/* مفتاح الألوان */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-sm">شمعة صعودية (إغلاق أعلى من الفتح)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-sm">شمعة هبوطية (إغلاق أقل من الفتح)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الأنماط */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                مكتبة أنماط الشموع
              </CardTitle>
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={patternFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPatternFilter('all')}
                  className="h-7 px-2"
                >
                  الكل
                </Button>
                <Button
                  variant={patternFilter === 'bullish' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPatternFilter('bullish')}
                  className="h-7 px-2 text-green-600"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  صعودي
                </Button>
                <Button
                  variant={patternFilter === 'bearish' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPatternFilter('bearish')}
                  className="h-7 px-2 text-red-600"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  هبوطي
                </Button>
                <Button
                  variant={patternFilter === 'neutral' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPatternFilter('neutral')}
                  className="h-7 px-2 text-amber-600"
                >
                  <Minus className="h-3 w-3 mr-1" />
                  محايد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all hover:shadow-lg cursor-pointer',
                      pattern.type === 'bullish' && 'border-green-200 dark:border-green-800 hover:border-green-400',
                      pattern.type === 'bearish' && 'border-red-200 dark:border-red-800 hover:border-red-400',
                      pattern.type === 'neutral' && 'border-amber-200 dark:border-amber-800 hover:border-amber-400'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{pattern.image}</span>
                      <div>
                        <p className="font-bold">{pattern.name}</p>
                        <p className="text-xs text-muted-foreground">{pattern.nameEn}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                    <div className={cn(
                      'p-2 rounded text-sm mb-3',
                      pattern.type === 'bullish' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
                      pattern.type === 'bearish' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
                      pattern.type === 'neutral' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    )}>
                      <strong>الإشارة:</strong> {pattern.signal}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">موثوقية</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              pattern.reliability >= 80 ? 'bg-green-500' :
                              pattern.reliability >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${pattern.reliability}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{pattern.reliability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* نصائح للتداول */}
          <Card className="bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Info className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                    نصائح مهمة للتداول بالشموع اليابانية
                  </h3>
                  <ul className="space-y-2 text-amber-700 dark:text-amber-300">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>لا تعتمد على نمط الشموع فقط، بل أكده بمؤشرات فنية أخرى</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>أنماط الشموع أقوى عند مستويات الدعم والمقاومة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>حجم التداول مهم لتأكيد قوة النمط</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>انتظر إغلاق الشمعة لتأكيد النمط قبل الدخول</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* التحليل التقني المبسط */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  أنماط صعودية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candlestickPatterns.filter(p => p.type === 'bullish').map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2">
                        <span>{pattern.image}</span>
                        <span className="text-sm">{pattern.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{pattern.reliability}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  أنماط هبوطية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candlestickPatterns.filter(p => p.type === 'bearish').map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-center gap-2">
                        <span>{pattern.image}</span>
                        <span className="text-sm">{pattern.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{pattern.reliability}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                  <Minus className="h-5 w-5" />
                  أنماط محايدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candlestickPatterns.filter(p => p.type === 'neutral').map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <span>{pattern.image}</span>
                        <span className="text-sm">{pattern.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{pattern.reliability}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
