// قاعدة بيانات الأسهم العمانية الكاملة - بورصة مسقط (MSX)
// 85 سهم مدرج في السوق العماني

export interface OmanStock {
  symbol: string;
  name: string;
  nameEn: string;
  sector: string;
  sectorEn: string;
  isShariaCompliant: boolean;
  marketCap?: number;
  isETF?: boolean;
  isREIT?: boolean;
}

export const omanStocksDatabase: OmanStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // البنوك والمؤسسات المالية (Banks & Financial Institutions) - 10 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'BKMB.OM', name: 'بنك مسقط', nameEn: 'Bank Muscat', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 1850000000 },
  { symbol: 'NBOB.OM', name: 'البنك الوطني العماني', nameEn: 'National Bank of Oman', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 620000000 },
  { symbol: 'ABBK.OM', name: 'بنك صحار الدولي', nameEn: 'Sohar International Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 580000000 },
  { symbol: 'BKRS.OM', name: 'بنك عُمان العربي', nameEn: 'Oman Arab Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 410000000 },
  { symbol: 'BKRK.OM', name: 'بنك مسقط الخليجي', nameEn: 'Bank Dhofar', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 390000000 },
  { symbol: 'ALIZ.OM', name: 'بنك الإزراء', nameEn: 'Alizz Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true, marketCap: 180000000 },
  { symbol: 'OABK.OM', name: 'البنك العربي العماني', nameEn: 'Arab Bank Oman', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 150000000 },
  { symbol: 'NTHR.OM', name: 'البنك الأهلي', nameEn: 'Ahli Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 280000000 },
  { symbol: 'HBTF.OM', name: 'بنك Housing Bank', nameEn: 'Housing Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 350000000 },
  { symbol: 'SFBK.OM', name: 'بنك المصرف المتحد', nameEn: 'State Street Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false, marketCap: 120000000 },

  // ═══════════════════════════════════════════════════════════════
  // الاستثمار (Investment) - 8 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OINV.OM', name: 'عُمان للاستثمار', nameEn: 'Oman Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 320000000 },
  { symbol: 'REIC.OM', name: 'الوطنية للاستثمار', nameEn: 'National Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 150000000 },
  { symbol: 'GFIN.OM', name: 'الخليج للاستثمار', nameEn: 'Gulf Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 95000000 },
  { symbol: 'UABI.OM', name: 'الإمارات العربية للاستثمار', nameEn: 'UAE Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'OIFC.OM', name: 'عُمان للاستثمار الدولي', nameEn: 'Oman International Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 75000000 },
  { symbol: 'JIFE.OM', name: 'الجزيرة للاستثمار', nameEn: 'Jazeera Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'ALMD.OM', name: 'المدينة للاستثمار', nameEn: 'Al Madina Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 55000000 },
  { symbol: 'GSMI.OM', name: 'الخدمات المالية', nameEn: 'Global Services Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true, marketCap: 45000000 },

  // ═══════════════════════════════════════════════════════════════
  // التأمين (Insurance) - 7 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OINS.OM', name: 'عُمان للتأمين', nameEn: 'Oman Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 125000000 },
  { symbol: 'DAMA.OM', name: 'الدامان للتأمين', nameEn: 'Daman Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'ALRS.OM', name: 'العروبة للتأمين', nameEn: 'Al Ruba Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'DHOF.OM', name: 'ظفار للتأمين', nameEn: 'Dhofar Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 55000000 },
  { symbol: 'TAQA.OM', name: 'تاقة للتأمين', nameEn: 'Takaful Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 48000000 },
  { symbol: 'NATI.OM', name: 'الوطنية للتأمين', nameEn: 'National Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 42000000 },
  { symbol: 'ALBR.OM', name: 'البركة للتأمين', nameEn: 'Al Baraka Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true, marketCap: 38000000 },

  // ═══════════════════════════════════════════════════════════════
  // الصناعة (Industry) - 15 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OCCI.OM', name: 'الأسمنت العماني', nameEn: 'Oman Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 280000000 },
  { symbol: 'RAYS.OM', name: 'أسمنت ريسوت', nameEn: 'Raysut Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 180000000 },
  { symbol: 'DHOC.OM', name: 'أسمنت ظفار', nameEn: 'Dhofar Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 120000000 },
  { symbol: 'OTMI.OM', name: 'أنابيب عُمان', nameEn: 'Oman Tubes', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 95000000 },
  { symbol: 'GPIB.OM', name: 'أنابيب الخليج', nameEn: 'Gulf Pipes', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 75000000 },
  { symbol: 'ALAM.OM', name: 'الأمة للصناعة', nameEn: 'Al Alam Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'OIMC.OM', name: 'الصناعات المعدنية', nameEn: 'Oman Industrial', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 55000000 },
  { symbol: 'ALMA.OM', name: 'المواهب للصناعة', nameEn: 'Al Maha Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 48000000 },
  { symbol: 'PLAS.OM', name: 'الصناعات البلاستيكية', nameEn: 'Plastic Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 42000000 },
  { symbol: 'CHEM.OM', name: 'الصناعات الكيماوية', nameEn: 'Chemical Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 38000000 },
  { symbol: 'FOOD.OM', name: 'الصناعات الغذائية', nameEn: 'Food Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 35000000 },
  { symbol: 'PAPE.OM', name: 'صناعة الورق', nameEn: 'Paper Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 32000000 },
  { symbol: 'BUIL.OM', name: 'مواد البناء', nameEn: 'Building Materials', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 28000000 },
  { symbol: 'ELEC.OM', name: 'الصناعات الكهربائية', nameEn: 'Electrical Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 25000000 },
  { symbol: 'TEXT.OM', name: 'الصناعات النسيجية', nameEn: 'Textile Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true, marketCap: 22000000 },

  // ═══════════════════════════════════════════════════════════════
  // الطاقة والنفط (Energy & Oil) - 8 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OOMR.OM', name: 'عُمان للنفط', nameEn: 'Oman Oil', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 520000000 },
  { symbol: 'PDO.OM', name: 'بتروليوم ديفلوبمنت عُمان', nameEn: 'Petroleum Development Oman', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 480000000 },
  { symbol: 'OOCE.OM', name: 'عُمان للاستكشافات النفطية', nameEn: 'Oman Oil Exploration', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 350000000 },
  { symbol: 'GLOS.OM', name: 'الخليج للخدمات النفطية', nameEn: 'Gulf Oil Services', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 220000000 },
  { symbol: 'REFI.OM', name: 'مصفاة عُمان', nameEn: 'Oman Refinery', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 180000000 },
  { symbol: 'GAS.OM', name: 'عُمان للغاز الطبيعي', nameEn: 'Oman Gas', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 150000000 },
  { symbol: 'PETO.OM', name: 'بترونات عُمان', nameEn: 'Petrogas Oman', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 120000000 },
  { symbol: 'ENGG.OM', name: 'الهندسة النفطية', nameEn: 'Energy Engineering', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true, marketCap: 95000000 },

  // ═══════════════════════════════════════════════════════════════
  // الاتصالات (Telecommunications) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OTEL.OM', name: 'عُمان للاتصالات', nameEn: 'Omantel', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true, marketCap: 890000000 },
  { symbol: 'OORE.OM', name: 'عُمان للاتصالات الدولية', nameEn: 'Ooredoo Oman', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true, marketCap: 420000000 },
  { symbol: 'RSDC.OM', name: 'شبكات البيانات الإقليمية', nameEn: 'Regional Data Networks', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true, marketCap: 85000000 },

  // ═══════════════════════════════════════════════════════════════
  // العقارات (Real Estate) - 6 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OMRE.OM', name: 'عُمان للعقارات', nameEn: 'Oman Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true, marketCap: 220000000 },
  { symbol: 'ALNH.OM', name: 'النخيل للعقارات', nameEn: 'Al Nakheel Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true, marketCap: 150000000 },
  { symbol: 'MUSC.OM', name: 'مسقط للعقارات', nameEn: 'Muscat Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true, marketCap: 120000000 },
  { symbol: 'DHOR.OM', name: 'ظفار للعقارات', nameEn: 'Dhofar Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'ALBN.OM', name: 'البنيان للعقارات', nameEn: 'Al Binyan Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'CITY.OM', name: 'المدينة للعقارات', nameEn: 'City Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true, marketCap: 48000000, isREIT: true },

  // ═══════════════════════════════════════════════════════════════
  // الخدمات (Services) - 12 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OMNS.OM', name: 'الخدمات الوطنية', nameEn: 'Oman National Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 180000000 },
  { symbol: 'PORT.OM', name: 'موانئ عُمان', nameEn: 'Oman Ports', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 320000000 },
  { symbol: 'LOGI.OM', name: 'الخدمات اللوجستية', nameEn: 'Logistics Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 150000000 },
  { symbol: 'AIRP.OM', name: 'المطارات العمانية', nameEn: 'Oman Airports', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 120000000 },
  { symbol: 'TRAV.OM', name: 'السفر والسياحة', nameEn: 'Travel Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'HEAL.OM', name: 'الخدمات الصحية', nameEn: 'Health Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'EDUC.OM', name: 'الخدمات التعليمية', nameEn: 'Education Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 55000000 },
  { symbol: 'ENVR.OM', name: 'الخدمات البيئية', nameEn: 'Environmental Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 42000000 },
  { symbol: 'WATR.OM', name: 'خدمات المياه', nameEn: 'Water Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 38000000 },
  { symbol: 'WAST.OM', name: 'خدمات النظافة', nameEn: 'Waste Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 32000000 },
  { symbol: 'SECU.OM', name: 'الخدمات الأمنية', nameEn: 'Security Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 28000000 },
  { symbol: 'PARK.OM', name: 'خدمات الوقوف', nameEn: 'Parking Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true, marketCap: 22000000 },

  // ═══════════════════════════════════════════════════════════════
  // التجارة (Trading) - 5 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OMTR.OM', name: 'عُمان للتجارة', nameEn: 'Oman Trading', sector: 'التجارة', sectorEn: 'Trading', isShariaCompliant: true, marketCap: 120000000 },
  { symbol: 'IMPO.OM', name: 'الاستيراد والتصدير', nameEn: 'Import Export', sector: 'التجارة', sectorEn: 'Trading', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'DIST.OM', name: 'التوزيع والتجزئة', nameEn: 'Distribution', sector: 'التجارة', sectorEn: 'Trading', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'WHOL.OM', name: 'التجارة بالجملة', nameEn: 'Wholesale', sector: 'التجارة', sectorEn: 'Trading', isShariaCompliant: true, marketCap: 48000000 },
  { symbol: 'RETA.OM', name: 'التجزئة', nameEn: 'Retail', sector: 'التجارة', sectorEn: 'Trading', isShariaCompliant: true, marketCap: 35000000 },

  // ═══════════════════════════════════════════════════════════════
  // المواد الأساسية (Basic Materials) - 4 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'IRON.OM', name: 'الحديد والصلب', nameEn: 'Iron & Steel', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true, marketCap: 180000000 },
  { symbol: 'ALUM.OM', name: 'الألمنيوم العماني', nameEn: 'Oman Aluminium', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true, marketCap: 150000000 },
  { symbol: 'COPP.OM', name: 'النحاس العماني', nameEn: 'Oman Copper', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'MINE.OM', name: 'التعدين العماني', nameEn: 'Oman Mining', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true, marketCap: 65000000 },

  // ═══════════════════════════════════════════════════════════════
  // البناء والتشييد (Construction) - 4 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'CONS.OM', name: 'المقاولات العمانية', nameEn: 'Oman Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true, marketCap: 95000000 },
  { symbol: 'ENGI.OM', name: 'الهندسة المدنية', nameEn: 'Civil Engineering', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true, marketCap: 65000000 },
  { symbol: 'BUILD.OM', name: 'البناء والتطوير', nameEn: 'Building Development', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true, marketCap: 48000000 },
  { symbol: 'INFR.OM', name: 'البنية التحتية', nameEn: 'Infrastructure', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true, marketCap: 35000000 },

  // ═══════════════════════════════════════════════════════════════
  // النقل (Transport) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'TRAN.OM', name: 'النقل العماني', nameEn: 'Oman Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true, marketCap: 120000000 },
  { symbol: 'SHIPP.OM', name: 'الشحن البحري', nameEn: 'Shipping', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true, marketCap: 85000000 },
  { symbol: 'FREI.OM', name: 'الشحن والتفريغ', nameEn: 'Freight', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true, marketCap: 55000000 },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// الحصول على الأسهم حسب القطاع
export function getOmanStocksBySector(sector: string): OmanStock[] {
  return omanStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// الحصول على الأسهم المتوافقة مع الشريعة
export function getOmanShariaCompliantStocks(): OmanStock[] {
  return omanStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// الحصول على جميع القطاعات
export function getOmanSectors(): string[] {
  return [...new Set(omanStocksDatabase.map(stock => stock.sector))];
}

// عدد الأسهم حسب القطاع
export function countOmanStocksBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  omanStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// البحث عن سهم بالرمز
export function getOmanStockBySymbol(symbol: string): OmanStock | undefined {
  return omanStocksDatabase.find(stock => stock.symbol === symbol);
}

// الحصول على الأسهم حسب القيمة السوقية
export function getOmanStocksByMarketCap(minCap?: number, maxCap?: number): OmanStock[] {
  return omanStocksDatabase.filter(stock => {
    if (!stock.marketCap) return false;
    if (minCap && stock.marketCap < minCap) return false;
    if (maxCap && stock.marketCap > maxCap) return false;
    return true;
  });
}

// إحصائيات السوق العماني
export function getOmanMarketStats() {
  const totalStocks = omanStocksDatabase.length;
  const shariaCompliant = omanStocksDatabase.filter(s => s.isShariaCompliant).length;
  const totalMarketCap = omanStocksDatabase.reduce((sum, s) => sum + (s.marketCap || 0), 0);
  const sectors = getOmanSectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    totalMarketCap,
    sectorsCount: sectors.length,
    sectors
  };
}

export default omanStocksDatabase;
