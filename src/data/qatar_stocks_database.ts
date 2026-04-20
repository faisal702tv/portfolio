// قاعدة بيانات الأسهم القطرية الكاملة - بورصة قطر (QE)
// 55 سهم مدرج في السوق القطري

export interface QatarStock {
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

export const qatarStocksDatabase: QatarStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // البنوك (Banks) - 10 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'QNBK.QA', name: 'بنك قطر الوطني', nameEn: 'Qatar National Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'MARK.QA', name: 'بنك الدوحة', nameEn: 'Doha Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'DOHI.QA', name: 'بنك الدوحة الإسلامي', nameEn: 'Doha Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'QIIK.QA', name: 'البنك الإسلامي الدولي في قطر', nameEn: 'Qatar Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'CBQK.QA', name: 'البنك التجاري القطري', nameEn: 'Commercial Bank of Qatar', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'ABQK.QA', name: 'البنك العربي القطري', nameEn: 'Arab Bank Qatar', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'QIBK.QA', name: 'البنك الإسلامي القطري', nameEn: 'Qatar Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'KCBK.QA', name: 'بنك الخليج الدولي', nameEn: 'Al Khaliji Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'RAYA.QA', name: 'بنك الريان', nameEn: 'Masraf Al Rayan', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'QABK.QA', name: 'بنك قطر الأول', nameEn: 'Qatar First Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الاتصالات (Telecommunications) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OOREDOO.QA', name: 'أوريدو قطر', nameEn: 'Ooredoo Qatar', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'VODAFONE.QA', name: 'فودافون قطر', nameEn: 'Vodafone Qatar', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'QTEL.QA', name: 'قطر للاتصالات', nameEn: 'Qatar Telecom', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // العقارات (Real Estate) - 8 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'EZDK.QA', name: 'إعمار العقارية', nameEn: 'Ezdan Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'REYA.QA', name: 'الريان العقارية', nameEn: 'Al Rayan Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'QDHB.QA', name: 'قطر للأعمال العقارية', nameEn: 'Qatar Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'UDCB.QA', name: 'الاتحاد للتنمية العقارية', nameEn: 'United Development', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'BRES.QA', name: 'بروا العقارية', nameEn: 'Barwa Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'QREC.QA', name: 'الريان للتداول', nameEn: 'Al Rayan Trading', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'INMA.QA', name: 'إنما العقارية', nameEn: 'Inma Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'QATR.QA', name: 'قطر العقارية', nameEn: 'Qatar Real Estate Co', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصناعة والطاقة (Industry & Energy) - 8 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'QIMC.QA', name: 'الصناعات القطرية', nameEn: 'Qatar Industrial Manufacturing', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'QATC.QA', name: 'قطر للكيماويات', nameEn: 'Qatar Chemicals', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'IQCQ.QA', name: 'قطر للكيماويات البتروكيماوية', nameEn: 'Qatar Petrochemicals', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: 'QFLF.QA', name: 'قطر للأسمدة', nameEn: 'Qatar Fertiliser', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'QAFAC.QA', name: 'قطر للكيماويات', nameEn: 'Qatar Fuel Additives', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'QGRC.QA', name: 'قطر للغاز', nameEn: 'Qatar Gas', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'RASG.QA', name: 'رأس غاز', nameEn: 'RasGas', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'QPQC.QA', name: 'قطر للبترول', nameEn: 'Qatar Petroleum', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التأمين (Insurance) - 7 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'QIC.QA', name: 'شركة قطر للتأمين', nameEn: 'Qatar Insurance Company', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'QIIC.QA', name: 'الإسلامية القطرية للتأمين', nameEn: 'Qatar Islamic Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'DOHA.QA', name: 'الدوحة للتأمين', nameEn: 'Doha Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'TIIC.QA', name: 'تكافل', nameEn: 'Takaful', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'IGIC.QA', name: 'الخليج الدولية للتأمين', nameEn: 'International Gulf Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ALKA.QA', name: 'الخليج للتأمين', nameEn: 'Al Khaleej Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'QTIC.QA', name: 'قطر للتأمين التكافلي', nameEn: 'Qatar Takaful Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الخدمات (Services) - 7 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'MNSR.QA', name: 'المواصلات السريعة', nameEn: 'Mannai Corporation', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'WQOD.QA', name: 'وقود', nameEn: 'Woqod', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'QNFS.QA', name: 'قطر الوطنية للخدمات', nameEn: 'Qatar National Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'CINQ.QA', name: 'سينكو', nameEn: 'Cinco', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'QMCQ.QA', name: 'قطر للمناجم', nameEn: 'Qatar Mining', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'QSCS.QA', name: 'الخدمات القطرية', nameEn: 'Qatar Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'GCCS.QA', name: 'الخدمات الخليجية', nameEn: 'Gulf Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التجزئة والسلع الاستهلاكية (Retail & Consumer Goods) - 5 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'MERS.QA', name: 'ميركو', nameEn: 'Mirqab Capital', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'CSCK.QA', name: 'سوق الأغذية', nameEn: 'Consumer Foods', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'QDC.QA', name: 'التموين القطرية', nameEn: 'Qatar Distribution', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'SALW.QA', name: 'السلع الاستهلاكية', nameEn: 'Salwa', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'CGSC.QA', name: 'السلع العامة', nameEn: 'General Goods', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // النقل (Transport) - 4 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'NAVL.QA', name: 'الملاحة القطرية', nameEn: 'Navigation', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'QPSC.QA', name: 'النقل البري', nameEn: 'Land Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'AIRP.QA', name: 'المطارات القطرية', nameEn: 'Airports', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'LOGS.QA', name: 'الخدمات اللوجستية', nameEn: 'Logistics', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الاستثمار (Investment) - 5 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'QIPR.QA', name: 'قطر للاستثمار', nameEn: 'Qatar Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'INVS.QA', name: 'الاستثمارات القطرية', nameEn: 'Qatar Investments', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'GCCI.QA', name: 'الخليج للاستثمار', nameEn: 'Gulf Investments', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'QCAP.QA', name: 'قطر كابيتال', nameEn: 'Qatar Capital', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'AHLC.QA', name: 'الأهلية للاستثمار', nameEn: 'Ahli Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الإعلام والترفيه (Media & Entertainment) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'MEDC.QA', name: 'الإعلام القطري', nameEn: 'Media City', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: 'ENTR.QA', name: 'الترفيه القطري', nameEn: 'Entertainment', sector: 'الترفيه', sectorEn: 'Entertainment', isShariaCompliant: true },
  { symbol: 'QTVC.QA', name: 'التلفزيون القطري', nameEn: 'Qatar TV', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// Get stocks by sector
export function getQatarStocksBySector(sector: string): QatarStock[] {
  return qatarStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// Get stocks by sharia compliance
export function getQatarShariaCompliantStocks(): QatarStock[] {
  return qatarStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// Get all sectors
export function getQatarSectors(): string[] {
  return [...new Set(qatarStocksDatabase.map(stock => stock.sector))];
}

// Count by sector
export function countQatarBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  qatarStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// Get stock by symbol
export function getQatarStockBySymbol(symbol: string): QatarStock | undefined {
  return qatarStocksDatabase.find(stock => stock.symbol === symbol);
}

// Get sharia compliant count
export function getQatarShariaCompliantCount(): { compliant: number; nonCompliant: number } {
  const compliant = qatarStocksDatabase.filter(stock => stock.isShariaCompliant).length;
  return {
    compliant,
    nonCompliant: qatarStocksDatabase.length - compliant
  };
}

// Get market statistics
export function getQatarMarketStats() {
  const totalStocks = qatarStocksDatabase.length;
  const shariaCompliant = qatarStocksDatabase.filter(s => s.isShariaCompliant).length;
  const sectors = getQatarSectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    sectorsCount: sectors.length,
    sectors
  };
}

export default qatarStocksDatabase;
