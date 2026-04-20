'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Tag } from 'lucide-react';
import { useState, useMemo } from 'react';

interface FinancialTerm {
  ar: string;
  en: string;
  cat: string;
  def: string;
}

const FINANCIAL_TERMS: FinancialTerm[] = [
  // === Old project terms (34) ===
  { ar: 'سعر السهم', en: 'Stock Price', cat: 'أساسيات', def: 'القيمة السوقية الحالية للسهم الواحد — تتحدد بالعرض والطلب في السوق.' },
  { ar: 'الشراء', en: 'Buy / Long', cat: 'تداول', def: 'الدخول في صفقة بهدف الربح من ارتفاع السعر.' },
  { ar: 'البيع', en: 'Sell / Short', cat: 'تداول', def: 'إغلاق صفقة شراء أو المراهنة على انخفاض السعر.' },
  { ar: 'العائد على الاستثمار', en: 'ROI', cat: 'مؤشرات', def: 'نسبة الربح إلى التكلفة: (القيمة الحالية - التكلفة) / التكلفة × 100' },
  { ar: 'مضاعف الربحية', en: 'P/E Ratio', cat: 'مؤشرات', def: 'نسبة سعر السهم إلى ربحية السهم. كلما انخفض كان السهم أرخص نسبياً.' },
  { ar: 'القيمة السوقية', en: 'Market Cap', cat: 'مؤشرات', def: 'عدد الأسهم × سعر السهم. تحدد حجم الشركة في السوق.' },
  { ar: 'وقف الخسارة', en: 'Stop Loss', cat: 'إدارة مخاطر', def: 'أمر تلقائي لبيع السهم عند وصوله لسعر محدد لتقليل الخسارة.' },
  { ar: 'الهدف السعري', en: 'Price Target', cat: 'تحليل', def: 'السعر المتوقع للسهم بناءً على التحليل الفني أو الأساسي.' },
  { ar: 'التحليل الفني', en: 'Technical Analysis', cat: 'تحليل', def: 'دراسة حركة الأسعار والحجم عبر الرسوم البيانية للتنبؤ بالاتجاهات.' },
  { ar: 'التحليل الأساسي', en: 'Fundamental Analysis', cat: 'تحليل', def: 'تقييم الشركة بناءً على قوائمها المالية وأرباحها ومركزها التنافسي.' },
  { ar: 'الشمعة اليابانية', en: 'Candlestick', cat: 'رسوم بيانية', def: 'شكل بياني يعرض الافتتاح والإغلاق والأعلى والأدنى لفترة زمنية.' },
  { ar: 'المقاومة', en: 'Resistance', cat: 'تحليل فني', def: 'مستوى سعري يصعب على السهم تجاوزه للأعلى — عند الاختراق يصبح دعماً.' },
  { ar: 'الدعم', en: 'Support', cat: 'تحليل فني', def: 'مستوى سعري يرتد منه السهم للأعلى — عند الكسر يصبح مقاومة.' },
  { ar: 'المتوسط المتحرك', en: 'Moving Average (MA)', cat: 'مؤشرات', def: 'متوسط سعر السهم خلال فترة محددة — يستخدم لتحديد الاتجاه العام.' },
  { ar: 'مؤشر RSI', en: 'RSI', cat: 'مؤشرات', def: 'مؤشر القوة النسبية. أعلى من 70: مبالغ في الشراء. أقل من 30: مبالغ في البيع.' },
  { ar: 'المتوسط المتحرك MACD', en: 'MACD', cat: 'مؤشرات', def: 'الفرق بين متوسطَي 12 و26 يوماً. يُستخدم لتحديد الزخم واتجاه السعر.' },
  { ar: 'حجم التداول', en: 'Volume', cat: 'أساسيات', def: 'عدد الأسهم المتداولة خلال فترة معينة. الحجم يؤكد قوة الحركة السعرية.' },
  { ar: 'المحفظة الاستثمارية', en: 'Portfolio', cat: 'أساسيات', def: 'مجموعة الأصول المالية التي يملكها المستثمر من أسهم وسندات وصناديق.' },
  { ar: 'التنويع', en: 'Diversification', cat: 'استراتيجيات', def: 'توزيع الاستثمارات على أصول مختلفة لتقليل المخاطر الإجمالية.' },
  { ar: 'صندوق المؤشر', en: 'Index Fund / ETF', cat: 'أنواع أوراق مالية', def: 'صندوق يتتبع مؤشراً سوقياً كـ S&P 500 بتكاليف منخفضة.' },
  { ar: 'الصك الإسلامي', en: 'Sukuk', cat: 'إسلامي', def: 'أداة دين إسلامية تعادل السند لكنها مهيكلة بما يتوافق مع الشريعة.' },
  { ar: 'توزيعات الأرباح', en: 'Dividend', cat: 'أساسيات', def: 'جزء من أرباح الشركة يوزع على المساهمين نقداً أو أسهماً.' },
  { ar: 'الاكتتاب الأولي', en: 'IPO', cat: 'أنواع أوراق مالية', def: 'أول طرح عام للأسهم في السوق — فرصة الدخول المبكر في شركة جديدة.' },
  { ar: 'نسبة الدين', en: 'Debt Ratio', cat: 'مؤشرات', def: 'نسبة إجمالي الديون إلى إجمالي الأصول. كلما انخفضت كان وضع الشركة أفضل.' },
  { ar: 'هامش الربح', en: 'Profit Margin', cat: 'مؤشرات', def: 'نسبة صافي الربح إلى الإيرادات. يقيس كفاءة تحويل المبيعات لأرباح.' },
  { ar: 'السيولة', en: 'Liquidity', cat: 'أساسيات', def: 'سهولة تحويل الأصل لنقد دون خسارة كبيرة في القيمة.' },
  { ar: 'الزخم', en: 'Momentum', cat: 'تحليل فني', def: 'سرعة واستمرار حركة السعر. الأسهم ذات الزخم القوي تميل للاستمرار.' },
  { ar: 'الفجوة السعرية', en: 'Gap', cat: 'تحليل فني', def: 'فراغ بين إغلاق يوم وافتتاح اليوم التالي — غالباً يُملأ لاحقاً.' },
  { ar: 'الذروة الشرائية', en: 'Overbought', cat: 'تحليل فني', def: 'ارتفاع حاد يجعل السهم مرشحاً للتصحيح — RSI فوق 70.' },
  { ar: 'الذروة البيعية', en: 'Oversold', cat: 'تحليل فني', def: 'هبوط حاد يجعل السهم مرشحاً للارتداد — RSI تحت 30.' },
  // === New project unique terms (8) ===
  { ar: 'الأسهم', en: 'Stocks / Equities', cat: 'أنواع أوراق مالية', def: 'صكوك تمثل ملكية جزء من رأس مال الشركة، وتمنح حاملها حقوقاً في أرباح الشركة وأصولها.' },
  { ar: 'السندات', en: 'Bonds', cat: 'أنواع أوراق مالية', def: 'أوراق مالية تصدرها الشركات أو الحكومات كوسيلة للاقتراض، وتتعهد بسداد القيمة مع الفائدة.' },
  { ar: 'القيمة الدفترية', en: 'Book Value', cat: 'مؤشرات', def: 'قيمة الأصول بعد طرح الالتزامات، وتعادل حقوق المساهمين.' },
  { ar: 'صافي القيمة الدفترية', en: 'Net Book Value', cat: 'مؤشرات', def: 'إجمالي أصول الشركة مطروحاً منها إجمالي التزاماتها.' },
  { ar: 'العائد على حقوق المساهمين', en: 'ROE', cat: 'مؤشرات', def: 'مقياس لربحية الشركة بالنسبة لحقوق المساهمين، ويحسب بقسمة صافي الربح على حقوق المساهمين.' },
  { ar: 'نسبة الدين إلى حقوق المساهمين', en: 'Debt-to-Equity Ratio', cat: 'مؤشرات', def: 'مقياس للرافعة المالية، ويحسب بقسمة إجمالي الديون على حقوق المساهمين.' },
  { ar: 'الربحية لكل سهم', en: 'EPS', cat: 'مؤشرات', def: 'صافي ربح الشركة مقسوماً على عدد الأسهم القائمة.' },
  { ar: 'العرض والطلب', en: 'Supply & Demand', cat: 'أساسيات', def: 'العرض هو كمية الأصل المتاحة للبيع، والطلب هو كمية الأصل المطلوب شراؤها.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'أساسيات': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'تداول': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'مؤشرات': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'تحليل': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'تحليل فني': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'رسوم بيانية': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'إدارة مخاطر': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'استراتيجيات': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'أنواع أوراق مالية': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'إسلامي': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function DictionaryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(FINANCIAL_TERMS.map(t => t.cat)));
    return cats.sort();
  }, []);

  const filteredTerms = useMemo(() => {
    return FINANCIAL_TERMS.filter(item => {
      const matchesSearch =
        !search ||
        item.ar.includes(search) ||
        item.en.toLowerCase().includes(search.toLowerCase()) ||
        item.def.includes(search) ||
        item.cat.includes(search);
      const matchesCategory = !activeCategory || item.cat === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="القاموس المالي" />
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  القاموس المالي
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {filteredTerms.length} / {FINANCIAL_TERMS.length} مصطلح
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن مصطلح بالعربية أو الإنجليزية..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                    activeCategory === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  الكل
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                      activeCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Terms Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTerms.map((item, index) => (
                  <div
                    key={index}
                    className="group p-4 border rounded-xl hover:bg-muted/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-primary text-base">{item.ar}</h3>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          CATEGORY_COLORS[item.cat] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {item.cat}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 font-mono" dir="ltr" style={{ textAlign: 'right' }}>
                      {item.en}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.def}</p>
                  </div>
                ))}
              </div>

              {filteredTerms.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد نتائج للبحث</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
