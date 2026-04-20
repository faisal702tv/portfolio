// قاعدة بيانات الأسهم البحرينية الكاملة - بورصة البحرين (BHB)
// 24 سهم مدرج في بورصة البحرين

export interface BahrainStock {
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

export const bahrainStocksDatabase: BahrainStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // البنوك (Banks) - 6 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'BISB.BH', name: 'بنك البحرين الإسلامي', nameEn: 'Bahrain Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'NBOB.BH', name: 'البنك الوطني البحريني', nameEn: 'National Bank of Bahrain', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'BBKB.BH', name: 'بنك البحرين والكويت', nameEn: 'Bahrain Kuwait Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'KHCB.BH', name: 'بنك الخليج التجاري', nameEn: 'Khaleeji Commercial Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'ABAB.BH', name: 'البنك الأهلي البحريني', nameEn: 'Al Baraka Banking Group', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'SALB.BH', name: 'بنك السلام', nameEn: 'Salam Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الاستثمار (Investment) - 5 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'INVESTOR.BH', name: 'شركة البحرين للاستثمار', nameEn: 'Bahrain Investment Company', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'GFH.BH', name: 'مصرف الخليج الأول', nameEn: 'Gulf Finance House', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'TIDC.BH', name: 'شركة الخليج للاستثمار', nameEn: 'TIDC', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'YBAKAN.BH', name: 'يباكان القابضة', nameEn: 'YBA Kanoo Holdings', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SICO.BH', name: 'سيكو للاستثمار', nameEn: 'SICO', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التأمين (Insurance) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ARIG.BH', name: 'العربية للتأمين', nameEn: 'Arab Insurance Group', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'TAKFUL.BH', name: 'الراحة للتأمين', nameEn: 'Takaful International', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'BCI.BH', name: 'الاتحاد البحريني للتأمين', nameEn: 'Bahrain National Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // العقارات (Real Estate) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'SEEF.BH', name: 'سيف العقارية', nameEn: 'Seef Properties', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ARING.BH', name: 'العربية العقارية', nameEn: 'Arab Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DURINTL.BH', name: 'دار المعروفة', nameEn: 'Durrat Al Bahrain', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الخدمات (Services) - 4 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'BMTC.BH', name: 'شركة البحرين للأسواق', nameEn: 'Bahrain Maritime & Mercantile', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'CARS.BH', name: 'الوطنية للسيارات', nameEn: 'National Motor Company', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'TRAVEL.BH', name: 'شركة السفر البحرينية', nameEn: 'Bahrain Travel', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'BTV.BH', name: 'قناة البحرين', nameEn: 'Bahrain TV', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصناعة (Industry) - 2 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'GARMCO.BH', name: 'شركة الخليج للألمنيوم', nameEn: 'Gulf Aluminum', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'BAKAIN.BH', name: 'الخليج للصناعات', nameEn: 'Bakain Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // المواد الأساسية (Basic Materials) - 1 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'GPIC.BH', name: 'شركة الخليج للبتروكيماويات', nameEn: 'Gulf Petrochemical Industries', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// Get stocks by sector
export function getBahrainStocksBySector(sector: string): BahrainStock[] {
  return bahrainStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// Get stocks by sharia compliance
export function getBahrainShariaCompliantStocks(): BahrainStock[] {
  return bahrainStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// Get all sectors
export function getBahrainSectors(): string[] {
  return [...new Set(bahrainStocksDatabase.map(stock => stock.sector))];
}

// Count by sector
export function countBahrainBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  bahrainStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// Get stock by symbol
export function getBahrainStockBySymbol(symbol: string): BahrainStock | undefined {
  return bahrainStocksDatabase.find(stock => stock.symbol === symbol);
}

// Get sharia compliant count
export function getBahrainShariaCompliantCount(): { compliant: number; nonCompliant: number } {
  const compliant = bahrainStocksDatabase.filter(stock => stock.isShariaCompliant).length;
  return {
    compliant,
    nonCompliant: bahrainStocksDatabase.length - compliant
  };
}

// Get market statistics
export function getBahrainMarketStats() {
  const totalStocks = bahrainStocksDatabase.length;
  const shariaCompliant = bahrainStocksDatabase.filter(s => s.isShariaCompliant).length;
  const sectors = getBahrainSectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    sectorsCount: sectors.length,
    sectors
  };
}

export default bahrainStocksDatabase;
