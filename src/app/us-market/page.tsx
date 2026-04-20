'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Download,
  Building2,
  CheckCircle,
  XCircle,
  Database,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ShariaDetails {
  [key: string]: {
    status: string;
    debtRatio?: number;
    cashRatio?: number;
    threshold?: number;
    reason: string;
    source?: string;
    hasDebt?: boolean;
  };
}

interface Stock {
  symbol: string;
  name: string;
  exchange?: string;
  market: string;
  sector: string;
  industry?: string;
  price: number | null;
  marketCap?: number;
  debtRatio?: number;
  sharia: {
    status: 'compliant' | 'non_compliant' | 'pending';
    grade: string;
    sectorCheck: string;
    debtCheck: string;
    reasons?: string;
  };
  shariaDetails?: ShariaDetails;
}

// ═══════════════════════════════════════════════════════════════════════════
// معايير الشريعة الإسلامية - 4 معايير فقط
// ═══════════════════════════════════════════════════════════════════════════

const SHARIA_STANDARDS_INFO: Record<string, { name: string; nameAr: string; color: string; threshold: string; description: string; website?: string }> = {
  alBilad: { 
    name: "البلاد", 
    nameAr: "معايير بنك البلاد", 
    color: "bg-teal-500", 
    threshold: "التمويل ≤30%",
    description: "التمويل غير الإسلامي ≤ 30% من الأصول"
  },
  alRajhi: { 
    name: "الراجحي", 
    nameAr: "معايير بنك الراجحي", 
    color: "bg-green-600", 
    threshold: "الديون ≤25%",
    description: "الديون ذات الفوائد ≤ 25% من الأصول"
  },
  maqased: { 
    name: "مكتب المقاصد", 
    nameAr: "د. محمد العصيمي - almaqased.net", 
    color: "bg-amber-500", 
    threshold: "الدين ≤30%, النقد ≤30%",
    description: "الدين ≤ 30%, النقد ≤ 30%",
    website: "https://almaqased.net"
  },
  zeroDebt: { 
    name: "صفر ديون", 
    nameAr: "صفر قروض وصفر ديون", 
    color: "bg-red-500", 
    threshold: "0%",
    description: "صفر ديون ربوية + النشاط المحرم"
  }
};

interface ApiResponse {
  stats: { total: number; compliant: number; nonCompliant: number; pending: number };
  standardStats: { [key: string]: { compliant: number; nonCompliant: number; threshold: number; nameAr: string } };
  standards: typeof SHARIA_STANDARDS_INFO;
  metadata?: { lastUpdate: string; totalStocks: number; totalETFs: number };
  count: number;
  page: number;
  totalPages: number;
  stocks: Stock[];
}

export default function USMarketPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stats, setStats] = useState({ total: 0, compliant: 0, nonCompliant: 0, pending: 0 });
  const [standardStats, setStandardStats] = useState<ApiResponse['standardStats']>({});
  const [metadata, setMetadata] = useState<{ lastUpdate: string; totalStocks: number; totalETFs: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStandard, setSelectedStandard] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const ITEMS_PER_PAGE = 50;

  // Fetch data with pagination
  const fetchData = useCallback(async (pageNum: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(search && { search }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedStandard !== 'all' && { standard: selectedStandard }),
      });
      
      const response = await fetch(`/api/us-stocks?${params}`);
      const data: ApiResponse = await response.json();
      
      setStocks(data.stocks || []);
      setStats(data.stats ?? { total: 0, compliant: 0, nonCompliant: 0, pending: 0 });
      setStandardStats(data.standardStats || {});
      setMetadata(data.metadata || null);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedStandard]);

  // Initial load
  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchData]);

  // Get unique sectors from current stocks
  const sectors = useMemo(() => {
    return [...new Set(stocks.map(s => s.sector).filter(Boolean))];
  }, [stocks]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage, searchTerm);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500 text-white"><ShieldCheck className="h-3 w-3 ml-1" />حلال</Badge>;
      case 'non_compliant':
        return <Badge className="bg-red-500 text-white"><ShieldX className="h-3 w-3 ml-1" />غير متوافق</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white"><ShieldAlert className="h-3 w-3 ml-1" />قيد المراجعة</Badge>;
    }
  };

  const getGradeBadge = (grade: string) => {
    if (!grade) return null;
    const gradeColors: { [key: string]: string } = {
      'A+': 'bg-emerald-500', 'A': 'bg-green-500', 'B+': 'bg-lime-500', 'B': 'bg-yellow-500',
      'C': 'bg-orange-500', 'D': 'bg-red-400', 'F': 'bg-red-600', '?': 'bg-gray-400',
    };
    return <Badge className={`${gradeColors[grade] || 'bg-gray-500'} text-white text-xs`}>{grade}</Badge>;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(0)}`;
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />
        <div className="mr-16 lg:mr-64 transition-all duration-300">
          <TopBar title="🇺🇸 السوق الأمريكي" />
          <main className="p-6 flex items-center justify-center">
            <div className="text-center">
              <Database className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل بيانات السوق الأمريكي...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="🇺🇸 السوق الأمريكي" />
        <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🇺🇸 السوق الأمريكي
            </h1>
            <p className="text-muted-foreground mt-1">
              {totalCount.toLocaleString()} سهم وصندوق من NASDAQ و NYSE مع فحص 4 معايير شرعية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData(1, searchTerm)}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/stocks-database">
                <Database className="h-4 w-4 ml-2" />
                قاعدة الأسهم والصناديق
              </a>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الأسهم</p>
                  <p className="text-xl font-bold">{totalCount.toLocaleString()}</p>
                </div>
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">متوافقة شرعاً</p>
                  <p className="text-xl font-bold text-green-500">{(stats?.compliant ?? 0).toLocaleString()}</p>
                </div>
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">غير متوافقة</p>
                  <p className="text-xl font-bold text-red-500">{(stats?.nonCompliant ?? 0).toLocaleString()}</p>
                </div>
                <ShieldX className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">قيد المراجعة</p>
                  <p className="text-xl font-bold text-yellow-500">{(stats?.pending ?? 0).toLocaleString()}</p>
                </div>
                <ShieldAlert className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">آخر تحديث</p>
                  <p className="text-sm font-medium">
                    {metadata?.lastUpdate ? new Date(metadata.lastUpdate).toLocaleDateString('ar-SA-u-ca-gregory') : '-'}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Standards Summary - 4 معايير فقط */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ملخص المعايير الشرعية (4 معايير)</CardTitle>
            <CardDescription>المعايير المعتمدة: البلاد، الراجحي، مكتب المقاصد، صفر ديون</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(SHARIA_STANDARDS_INFO).map(([key, info]) => (
                <div 
                  key={key}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStandard === key ? 'ring-2 ring-primary bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                  onClick={() => {
                    const newStandard = selectedStandard === key ? 'all' : key;
                    setSelectedStandard(newStandard);
                    fetchData(1, searchTerm);
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${info.color}`}></div>
                    <span className="font-medium text-sm">{info.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{info.threshold}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-500">✅ {standardStats[key]?.compliant?.toLocaleString() || 0}</span>
                    <span className="text-red-500">❌ {standardStats[key]?.nonCompliant?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن سهم (AAPL, Apple, Microsoft...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); fetchData(1, searchTerm); }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="compliant">✅ حلال</SelectItem>
                  <SelectItem value="non_compliant">❌ غير متوافق</SelectItem>
                  <SelectItem value="pending">⚠️ قيد المراجعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>الأسهم (الصفحة {page} من {totalPages})</CardTitle>
              <span className="text-sm text-muted-foreground">عرض {stocks.length} من {totalCount.toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-2">الرمز</th>
                    <th className="text-right py-3 px-2">الشركة</th>
                    <th className="text-right py-3 px-2">القطاع</th>
                    <th className="text-right py-3 px-2">السعر</th>
                    <th className="text-right py-3 px-2">الحالة</th>
                    <th className="text-right py-3 px-2">الدين %</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr 
                      key={stock.symbol}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => { setSelectedStock(stock); setShowDetails(true); }}
                    >
                      <td className="py-3 px-2 font-mono font-bold text-primary">{stock.symbol}</td>
                      <td className="py-3 px-2 max-w-[200px] truncate">{stock.name}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">{stock.sector || '-'}</Badge>
                      </td>
                      <td className="py-3 px-2 font-mono">
                        {stock.price ? `$${stock.price.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(stock.sharia.status)}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-mono ${
                          (stock.debtRatio || 0) <= 30 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stock.debtRatio !== undefined ? `${stock.debtRatio.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                الصفحة {page} من {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </main>
      </div>

      {/* Stock Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🇺🇸 {selectedStock?.symbol} - {selectedStock?.name}
            </DialogTitle>
            <DialogDescription>
              تفاصيل الفحص الشرعي - 4 معايير
            </DialogDescription>
          </DialogHeader>
          
          {selectedStock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">القطاع</p>
                  <p className="font-medium">{selectedStock.sector}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الصناعة</p>
                  <p className="font-medium">{selectedStock.industry || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">السعر</p>
                  <p className="font-medium">{selectedStock.price ? `$${selectedStock.price.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">القيمة السوقية</p>
                  <p className="font-medium">{selectedStock.marketCap ? formatMarketCap(selectedStock.marketCap) : '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold mb-3">الفحص الشرعي (4 معايير)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStock.shariaDetails && Object.entries(selectedStock.shariaDetails).map(([key, details]) => {
                    const info = SHARIA_STANDARDS_INFO[key as keyof typeof SHARIA_STANDARDS_INFO];
                    if (!info) return null;
                    
                    return (
                      <div 
                        key={key}
                        className={`p-3 rounded-lg border text-sm ${
                          details.status === 'compliant' 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-red-500/30 bg-red-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${info.color}`}></div>
                            <span className="font-medium">{info.name}</span>
                          </div>
                          {details.status === 'compliant' ? 
                            <CheckCircle className="h-5 w-5 text-green-500" /> : 
                            <XCircle className="h-5 w-5 text-red-500" />
                          }
                        </div>
                        <p className="text-muted-foreground">{details.reason}</p>
                        {info.website && (
                          <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-primary text-xs mt-1 inline-block">
                            🌐 {info.website}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedStock.sharia.status)}
                  {getGradeBadge(selectedStock.sharia.grade)}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">فحص القطاع: </span>
                  <span>{selectedStock.sharia.sectorCheck}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
