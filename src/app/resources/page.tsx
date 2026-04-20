'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe,
  BookOpen,
  Newspaper,
  TrendingUp,
  ExternalLink,
  Search,
  Star,
  Bookmark,
  GraduationCap,
  Calculator,
  Shield,
  BarChart3,
  Landmark,
  Building2,
  Coins,
  LineChart,
  FileSearch,
  GanttChart,
  Flag,
  DollarSign,
  ChartNetwork,
} from 'lucide-react';
import { useState } from 'react';

// نوع المورد
interface Resource {
  name: string;
  url: string;
  description: string;
  icon: typeof Landmark;
  highlight?: boolean;
}

interface ResourceCategory {
  id: string;
  name: string;
  icon: typeof Landmark;
  color: string;
  resources: Resource[];
}

// البيانات المنظمة بدون تكرار
const resourcesCategories: ResourceCategory[] = [
  {
    id: 'exchanges',
    name: 'البورصات الرسمية',
    icon: Landmark,
    color: 'from-blue-600 to-indigo-700',
    resources: [
      { name: 'السوق المالية السعودية (تداول)', url: 'https://www.saudiexchange.sa', description: 'البورصة السعودية الرسمية', icon: Flag },
      { name: 'سوق أبوظبي للأوراق المالية (ADX)', url: 'https://www.adx.ae', description: 'Abu Dhabi Securities Exchange', icon: Building2 },
      { name: 'سوق دبي المالي (DFM)', url: 'https://www.dfm.ae', description: 'Dubai Financial Market', icon: Building2 },
      { name: 'ناسداك دبي', url: 'https://www.nasdaqdubai.com', description: 'Nasdaq Dubai', icon: Building2 },
      { name: 'بورصة الكويت', url: 'https://www.boursakuwait.com.kw', description: 'Boursa Kuwait - سوق الأسهم الكويتي', icon: Building2 },
      { name: 'بورصة قطر', url: 'https://www.qatarexchange.qa', description: 'Qatar Stock Exchange', icon: Building2 },
      { name: 'بورصة البحرين', url: 'https://www.bahrainbourse.com', description: 'Bahrain Bourse', icon: Building2 },
      { name: 'بورصة مسقط', url: 'https://www.msm.gov.om', description: 'Muscat Securities Market', icon: Building2 },
      { name: 'البورصة المصرية', url: 'https://www.egx.com.eg', description: 'Egyptian Exchange', icon: Building2 },
      { name: 'بورصة عمّان', url: 'https://www.ase.com.jo', description: 'Amman Stock Exchange', icon: Building2 },
      { name: 'Nasdaq', url: 'https://www.nasdaq.com', description: 'ناسداك - الأسهم الأمريكية', icon: DollarSign },
      { name: 'NYSE', url: 'https://www.nyse.com', description: 'بورصة نيويورك', icon: DollarSign },
    ],
  },
  {
    id: 'saudi',
    name: 'السوق السعودي',
    icon: Flag,
    color: 'from-green-600 to-emerald-700',
    resources: [
      { name: 'تداول (Saudi Exchange)', url: 'https://www.saudiexchange.sa', description: 'البورصة السعودية الرسمية', icon: TrendingUp },
      { name: 'أرقام (Argaam)', url: 'https://www.argaam.com', description: 'أخبار وبيانات السوق السعودي', icon: Newspaper },
      { name: 'مباشر (Mubasher)', url: 'https://www.mubasher.info', description: 'أخبار مالية وأسعار مباشرة', icon: LineChart },
      { name: 'TradingView - تاسي', url: 'https://www.tradingview.com/chart/?symbol=TADAWUL%3ATASI', description: 'رسوم بيانية متقدمة للمؤشر العام', icon: BarChart3 },
    ],
  },
  {
    id: 'us-data',
    name: 'البيانات الأمريكية',
    icon: DollarSign,
    color: 'from-purple-600 to-violet-700',
    resources: [
      { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', description: 'بيانات لحظية، قوائم مالية، أخبار اقتصادية', icon: ChartNetwork },
      { name: 'MarketWatch', url: 'https://www.marketwatch.com', description: 'أخبار الأسواق المالية وتحليل الاتجاهات', icon: Newspaper },
      { name: 'Investing.com', url: 'https://www.investing.com', description: 'بيانات وتحليلات عالمية شاملة', icon: Globe },
      { name: 'Stock Analysis', url: 'https://www.stockanalysis.com', description: 'تحليل مالي مفصّل، توزيعات، قوائم مالية', icon: FileSearch, highlight: true },
      { name: 'Finviz', url: 'https://finviz.com', description: 'فلترة وبحث في الأسهم حسب المؤشرات', icon: Search },
      { name: 'Macrotrends', url: 'https://www.macrotrends.net', description: 'بيانات مالية تاريخية ورسوم بيانية طويلة المدى', icon: GanttChart },
      { name: 'Fintel', url: 'https://fintel.io', description: 'بيانات متقدمة للمستثمرين', icon: FileSearch },
      { name: 'Split History', url: 'https://splithistory.com', description: 'تقسيمات الأسهم التاريخية', icon: BarChart3 },
    ],
  },
  {
    id: 'analysis',
    name: 'التحليل والتوصيات',
    icon: BarChart3,
    color: 'from-orange-500 to-amber-600',
    resources: [
      { name: 'Seeking Alpha', url: 'https://www.seekingalpha.com', description: 'تحليلات ومقالات من خبراء ومستثمرين', icon: Newspaper },
      { name: 'Morningstar', url: 'https://www.morningstar.com', description: 'تقييمات الصناديق الاستثمارية وتحليل الشركات', icon: Star },
      { name: 'TipRanks', url: 'https://www.tipranks.com', description: 'توصيات المحللين وتقييماتهم', icon: TrendingUp },
      { name: 'Simply Wall St', url: 'https://simplywall.st', description: 'تحليل مرئي ذكي لقيمة السهم ونموه', icon: BarChart3 },
      { name: 'TradingView', url: 'https://www.tradingview.com', description: 'أفضل موقع للرسوم البيانية والتحليل الفني', icon: LineChart },
      { name: 'ROIC.ai', url: 'https://roic.ai', description: 'بيانات مدعومة بالذكاء الاصطناعي', icon: BarChart3 },
    ],
  },
  {
    id: 'official-data',
    name: 'البيانات الرسمية',
    icon: FileSearch,
    color: 'from-slate-600 to-gray-700',
    resources: [
      { name: 'SEC EDGAR', url: 'https://www.sec.gov/cgi-bin/browse-edgar', description: 'الإيداعات الرسمية للشركات الأمريكية', icon: Landmark },
      { name: 'Whalewisdom', url: 'https://www.whalewisdom.com', description: 'محافظ المستثمرين الكبار', icon: TrendingUp },
      { name: 'Data Roma', url: 'https://www.dataroma.com', description: 'تتبع استثمارات كبار المستثمرين مثل وارن بافيت', icon: TrendingUp },
      { name: 'Dividend.com', url: 'https://www.dividend.com', description: 'توزيعات الأرباح والعوائد ونسب النمو', icon: Coins },
    ],
  },
  {
    id: 'crypto-commodities',
    name: 'الكريبتو والسلع',
    icon: Coins,
    color: 'from-yellow-500 to-orange-600',
    resources: [
      { name: 'CoinMarketCap', url: 'https://coinmarketcap.com', description: 'أسعار وتحليلات العملات الرقمية', icon: Coins },
      { name: 'Binance', url: 'https://www.binance.com', description: 'أكبر منصة تداول عملات رقمية', icon: Coins },
      { name: 'Oilprice.com', url: 'https://oilprice.com', description: 'أسعار النفط والطاقة والتحليلات', icon: BarChart3 },
      { name: 'Trading Economics', url: 'https://tradingeconomics.com', description: 'مؤشرات اقتصادية عالمية', icon: Globe },
    ],
  },
  {
    id: 'learning',
    name: 'التعلم والأدوات',
    icon: GraduationCap,
    color: 'from-teal-500 to-cyan-600',
    resources: [
      { name: 'Investopedia', url: 'https://www.investopedia.com', description: 'المرجع الأول للتعلم المالي والاستثماري', icon: BookOpen },
      { name: 'Federal Reserve', url: 'https://www.federalreserve.gov', description: 'البنك المركزي الأمريكي', icon: Landmark },
      { name: 'Webull', url: 'https://www.webull.com', description: 'منصة تداول وتحليل متكاملة', icon: LineChart },
      { name: 'NetDania', url: 'https://www.netdania.com', description: 'مخططات وأسعار مباشرة للعملات والأسهم', icon: LineChart },
    ],
  },
  {
    id: 'sharia',
    name: 'الموارد الشرعية',
    icon: Shield,
    color: 'from-green-600 to-teal-700',
    resources: [
      { name: 'قائمة البلاد للأسهم الشرعية', url: '#', description: 'قائمة الأسهم المتوافقة شرعاً - البنك البلاد', icon: Shield },
      { name: 'قائمة الراجحي للأسهم الشرعية', url: '#', description: 'قائمة الأسهم المتوافقة شرعاً - الراجحي', icon: Shield },
      { name: 'مكتب المقاصد', url: '#', description: 'خدمات الاستشارة الشرعية', icon: Shield },
      { name: 'صفر ديون', url: '#', description: 'قائمة الأسهم الشرعية الخالية من الديون', icon: Shield },
    ],
  },
];

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleFavorite = (name: string) => {
    setFavorites(prev => 
      prev.includes(name) 
        ? prev.filter(f => f !== name)
        : [...prev, name]
    );
  };

  const getAllResources = () => {
    return resourcesCategories.flatMap(category => 
      category.resources.map(resource => ({ ...resource, category: category.id, categoryName: category.name }))
    );
  };

  const filteredResources = () => {
    let resources = getAllResources();
    
    if (activeCategory) {
      resources = resources.filter(r => r.category === activeCategory);
    }
    
    if (searchQuery) {
      resources = resources.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return resources;
  };

  const renderResourceCard = (resource: Resource & { category: string; categoryName: string }) => {
    const Icon = resource.icon;
    const isFavorite = favorites.includes(resource.name);
    const category = resourcesCategories.find(c => c.id === resource.category);
    
    return (
      <Card key={resource.name} className={`border-2 hover:shadow-lg transition-all group ${resource.highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${category?.color || 'from-gray-400 to-gray-600'} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {resource.name}
                  {resource.highlight && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </h3>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toggleFavorite(resource.name)}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <Badge variant="outline" className="gap-1">
              {category?.name}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => window.open(resource.url, '_blank')}
              disabled={resource.url === '#'}
            >
              زيارة الموقع
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="المصادر والروابط الاستثمارية"
          subtitle="روابط مفيدة للمستثمرين والمضاربين - بورصات، تحليل، بيانات، وأكثر"
        />
        
        <main className="p-6 space-y-6">
          {/* البحث */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن مصدر..."
                className="pr-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Star className="h-4 w-4" />
                المفضلة ({favorites.length})
              </Button>
              {activeCategory && (
                <Button variant="ghost" onClick={() => setActiveCategory(null)}>
                  مسح الفلتر
                </Button>
              )}
            </div>
          </div>
          
          {/* الفئات */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {resourcesCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              
              return (
                <Card 
                  key={category.id}
                  className={`border-2 cursor-pointer transition-all ${isActive ? 'border-primary shadow-lg' : 'hover:border-primary/50'}`}
                  onClick={() => setActiveCategory(isActive ? null : category.id)}
                >
                  <CardContent className="p-3 text-center">
                    <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg mb-2`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-medium text-xs">{category.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.resources.length} مصدر
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* المصادر */}
          <div className="space-y-6">
            {!activeCategory && !searchQuery ? (
              // عرض كل الفئات
              resourcesCategories.map((category) => (
                <Card key={category.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${category.color}`}>
                          <category.icon className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle>{category.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {category.resources.length} موقع
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveCategory(category.id)}
                      >
                        عرض الكل
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {category.resources.map((resource) => {
                        const Icon = resource.icon;
                        const isFavorite = favorites.includes(resource.name);
                        
                        return (
                          <div key={resource.name} className={`p-4 rounded-xl hover:bg-muted transition-colors group ${resource.highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${resource.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div>
                                  <h4 className="font-medium flex items-center gap-1">
                                    {resource.name}
                                    {resource.highlight && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">{resource.description}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => toggleFavorite(resource.name)}
                              >
                                <Star className={`h-3 w-3 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              </Button>
                            </div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="mt-2 p-0 h-auto text-primary"
                              onClick={() => window.open(resource.url, '_blank')}
                              disabled={resource.url === '#'}
                            >
                              زيارة الموقع
                              <ExternalLink className="h-3 w-3 mr-1" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // عرض النتائج المفلترة
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources().map(renderResourceCard)}
              </div>
            )}
          </div>
          
          {/* نصيحة */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Bookmark className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">نصيحة للمستثمر</h3>
                  <p className="text-muted-foreground mt-1">
                    احرص على متابعة المصادر الرسمية للحصول على معلومات دقيقة وموثوقة. تجنب الإشاعات وتحقق دائماً من مصادر المعلومات قبل اتخاذ قرارات استثمارية. المواقع المميزة بنجمة ⭐ هي الأكثر أهمية واستخداماً.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
