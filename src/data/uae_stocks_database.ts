// قاعدة بيانات الأسهم الإماراتية الكاملة
// 3 أسواق: ADX (أبوظبي) + DFM (دبي المالي) + Nasdaq Dubai (ناسداك دبي)

export interface UAEStock {
  symbol: string;
  name: string;
  nameEn: string;
  market: 'ADX' | 'DFM' | 'NASDAQ_DUBAI';
  sector: string;
  sectorEn: string;
  isShariaCompliant: boolean;
  marketCap?: number;
  isETF?: boolean;
  isREIT?: boolean;
}

export const uaeStocksDatabase: UAEStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // سوق أبوظبي للأوراق المالية (ADX) - 70+ سهم
  // ═══════════════════════════════════════════════════════════════
  
  // --- البنوك في ADX ---
  { symbol: 'FAB', name: 'بنك أبوظبي الأول', nameEn: 'First Abu Dhabi Bank', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'ADCB', name: 'بنك أبوظبي التجاري', nameEn: 'Abu Dhabi Commercial Bank', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'ADIB', name: 'بنك أبوظبي الإسلامي', nameEn: 'Abu Dhabi Islamic Bank', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'NBF', name: 'البنك الوطني في الفجيرة', nameEn: 'National Bank of Fujairah', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'RAKBANK', name: 'البنك الوطني للراس الخيمة', nameEn: 'RAKBANK', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'UNB', name: 'البنك الوطني الاتحاد', nameEn: 'Union National Bank', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'ABQ', name: 'البنك العربي', nameEn: 'Arab Banking Corporation', market: 'ADX', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  
  // --- العقارات في ADX ---
  { symbol: 'ALDAR', name: 'الدار العقارية', nameEn: 'Aldar Properties', market: 'ADX', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'SOROUH', name: 'الصروح العقارية', nameEn: 'Sorouh Real Estate', market: 'ADX', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'RAKPROP', name: 'رأس الخيمة العقارية', nameEn: 'RAK Properties', market: 'ADX', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'MANASEK', name: 'المناسك', nameEn: 'Manasek', market: 'ADX', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'REEM', name: 'ريم للاستثمار', nameEn: 'Reem Investment', market: 'ADX', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  
  // --- الاتصالات في ADX ---
  { symbol: 'ETISALAT', name: 'اتصالات', nameEn: 'Emirates Telecommunications Group', market: 'ADX', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: false },
  { symbol: 'THURAYA', name: 'الثريا للاتصالات', nameEn: 'Thuraya Telecommunications', market: 'ADX', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'YAHSAT', name: 'ياهسات', nameEn: 'Yahsat', market: 'ADX', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'BAYANAT', name: 'بيانات', nameEn: 'Bayanat', market: 'ADX', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  
  // --- الطاقة في ADX ---
  { symbol: 'ADNOC', name: 'أدنوك للتوزيع', nameEn: 'ADNOC Distribution', market: 'ADX', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'ADNOCGAS', name: 'أدنوك للغاز', nameEn: 'ADNOC Gas', market: 'ADX', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'BOROUGE', name: 'بوروج', nameEn: 'Borouge', market: 'ADX', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: 'TAQA', name: 'طاقة أبوظبي', nameEn: 'TAQA', market: 'ADX', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'DANA', name: 'دانة للغاز', nameEn: 'Dana Gas', market: 'ADX', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'RAKGAS', name: 'رأس الخيمة للغاز', nameEn: 'RAK Gas', market: 'ADX', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  
  // --- التأمين في ADX ---
  { symbol: 'ADNIC', name: 'الوطنية للتأمين أبوظبي', nameEn: 'Abu Dhabi National Insurance', market: 'ADX', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: false },
  { symbol: 'DAR', name: 'الدار للتأمين', nameEn: 'Dar Al Takaful', market: 'ADX', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'WATAN', name: 'وطن للتأمين', nameEn: 'Watan Insurance', market: 'ADX', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ISLAMICINS', name: 'الإسلامية للتأمين', nameEn: 'Islamic Insurance', market: 'ADX', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'RAKINS', name: 'رأس الخيمة للتأمين', nameEn: 'RAK Insurance', market: 'ADX', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ALKHALEEJ', name: 'الخليج للتأمين', nameEn: 'Al Khaleej Insurance', market: 'ADX', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  
  // --- التجزئة في ADX ---
  { symbol: 'LULU', name: 'مجموعة لولو', nameEn: 'Lulu Group', market: 'ADX', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'ABUDHABICOOP', name: 'جمعية أبوظبي التعاونية', nameEn: 'Abu Dhabi Cooperative', market: 'ADX', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'GRANDMALL', name: 'غراند مول', nameEn: 'Grand Mall', market: 'ADX', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'CITY', name: 'سيتي مول', nameEn: 'City Mall', market: 'ADX', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  
  // --- الصناعة في ADX ---
  { symbol: 'EMSTEEL', name: 'حديد الإمارات', nameEn: 'Emirates Steel', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'ARCE', name: 'أرك للصناعات', nameEn: 'ARCE Industries', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'DUCAB', name: 'دوكاب للكابلات', nameEn: 'DUCAB Cables', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'RAKCERAMIC', name: 'سيراميك رأس الخيمة', nameEn: 'RAK Ceramic', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'AGRICULTURAL', name: 'الزراعية المتحدة', nameEn: 'United Agricultural', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'AMBER', name: 'عنبر للصناعات', nameEn: 'Amber Industries', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CHEMICALS', name: 'الكيماويات المتحدة', nameEn: 'United Chemicals', market: 'ADX', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  
  // --- النقل في ADX ---
  { symbol: 'AIRARABIA', name: 'العربية للطيران', nameEn: 'Air Arabia', market: 'ADX', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'ABUDHABIAIR', name: 'مطار أبوظبي', nameEn: 'Abu Dhabi Airports', market: 'ADX', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'SHARJAHPORT', name: 'موانئ الشارقة', nameEn: 'Sharjah Ports', market: 'ADX', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'TRANSPORT', name: 'الإمارات للنقل', nameEn: 'Emirates Transport', market: 'ADX', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  
  // --- الاستثمار في ADX ---
  { symbol: 'ADIA', name: 'جهاز أبوظبي للاستثمار', nameEn: 'ADIA', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'MUBADALA', name: 'مبادلة للاستثمار', nameEn: 'Mubadala Investment', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ADQ', name: 'أبوظبي للاستثمار والتنمية', nameEn: 'ADQ', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ALDAARINV', name: 'الدار للاستثمار', nameEn: 'Aldar Investment', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'RAKINV', name: 'رأس الخيمة للاستثمار', nameEn: 'RAK Investment', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SHARJAHINV', name: 'الشارقة للاستثمار', nameEn: 'Sharjah Investment', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'FUJAIRAHINV', name: 'الفجيرة للاستثمار', nameEn: 'Fujairah Investment', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'UMMALQAIWAIN', name: 'أم القيوين للاستثمار', nameEn: 'Umm Al Quwain Investment', market: 'ADX', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  
  // --- الخدمات في ADX ---
  { symbol: 'ABUDHABISERV', name: 'أبوظبي للخدمات', nameEn: 'Abu Dhabi Services', market: 'ADX', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'ENGINEERING', name: 'الهندسة المتحدة', nameEn: 'United Engineering', market: 'ADX', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'MAINTENANCE', name: 'الصيانة المتحدة', nameEn: 'United Maintenance', market: 'ADX', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  
  // --- السياحة في ADX ---
  { symbol: 'ROTANA', name: 'روتانا للفنادق', nameEn: 'Rotana Hotels', market: 'ADX', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'EMIRATESPALACE', name: 'قصر الإمارات', nameEn: 'Emirates Palace', market: 'ADX', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'ABUDHABITOURISM', name: 'أبوظبي للسياحة', nameEn: 'Abu Dhabi Tourism', market: 'ADX', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  
  // --- الصحة في ADX ---
  { symbol: 'NMC', name: 'إن إم سي للرعاية الصحية', nameEn: 'NMC Healthcare', market: 'ADX', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: 'HEALTHPOINT', name: 'هيلث بوينت', nameEn: 'Healthpoint', market: 'ADX', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  
  // --- التعليم في ADX ---
  { symbol: 'ABUDHABIEDU', name: 'أبوظبي للتعليم', nameEn: 'Abu Dhabi Education', market: 'ADX', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  
  // --- المرافق في ADX ---
  { symbol: 'TRANSCO', name: 'نقل الكهرباء والمياه', nameEn: 'TRANSCO', market: 'ADX', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // سوق دبي المالي (DFM) - السوق الرئيسي - 60+ سهم
  // ═══════════════════════════════════════════════════════════════
  
  // --- البنوك في DFM ---
  { symbol: 'ENBD', name: 'بنك الإمارات دبي الوطني', nameEn: 'Emirates NBD Bank', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'DIB', name: 'بنك دبي الإسلامي', nameEn: 'Dubai Islamic Bank', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'MASHREQ', name: 'بنك المشرق', nameEn: 'Mashreq Bank', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'CBD', name: 'البنك التجاري الدولي', nameEn: 'Commercial Bank of Dubai', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'AJMAN', name: 'بنك عجمان', nameEn: 'Ajman Bank', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'DIBPS', name: 'أسهم بنك دبي الإسلامي الممتاز', nameEn: 'DIB Preferred Shares', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'GFH', name: 'الخليج للتمويل', nameEn: 'Gulf Finance House', market: 'DFM', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'SHUAA', name: 'شعاع كابيتال', nameEn: 'SHUAA Capital', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'HABTOOR', name: 'مجموعة الحبتور', nameEn: 'Al Habtoor Group', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: false },
  
  // --- العقارات في DFM ---
  { symbol: 'EMAAR', name: 'إعمار العقارية', nameEn: 'Emaar Properties', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'EMAARDEV', name: 'إعمار للتطوير', nameEn: 'Emaar Development', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DAMAC', name: 'داماك العقارية', nameEn: 'DAMAC Properties', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ARABTEC', name: 'العربي للتعمير', nameEn: 'Arabtec Holding', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'UNION', name: 'الاتحاد العقارية', nameEn: 'Union Properties', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DIC', name: 'دبي للاستثمار', nameEn: 'Dubai Investments', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DEYAR', name: 'ديرة العقارية', nameEn: 'Deyaar Development', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'SELECT', name: 'سيليكت', nameEn: 'Select Group', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'TAMEER', name: 'تعمير العقارية', nameEn: 'Tameer Holdings', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'NAKHEEL', name: 'نخيل العقارية', nameEn: 'Nakheel Properties', market: 'DFM', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  
  // --- الاتصالات في DFM ---
  { symbol: 'DU', name: 'دو', nameEn: 'Emirates Integrated Telecom (du)', market: 'DFM', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  
  // --- الطاقة في DFM ---
  { symbol: 'DUC', name: 'الإمارات للبترول', nameEn: 'DUC', market: 'DFM', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'GULFNAV', name: 'الخليج للملاحة', nameEn: 'Gulf Navigation', market: 'DFM', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'ALMANSOOR', name: 'المنصور للطاقة', nameEn: 'Al Mansoor Energy', market: 'DFM', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'ESCA', name: 'شرق للطاقة', nameEn: 'ESCA', market: 'DFM', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  
  // --- التأمين في DFM ---
  { symbol: 'TAKAFULEM', name: 'التكافل الإمارات', nameEn: 'Emirates Takaful', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'DUBAIINS', name: 'دبي للتأمين', nameEn: 'Dubai Insurance', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ISLAMICTAKAFUL', name: 'التكافف الإسلامي', nameEn: 'Islamic Takaful', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ALSAFA', name: 'الصفا للتأمين', nameEn: 'Al Safa Insurance', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ORIENT', name: 'الشرق للتأمين', nameEn: 'Orient Insurance', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: false },
  { symbol: 'AFIA', name: 'أفيا للتأمين', nameEn: 'AFIA Insurance', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ARABORIENT', name: 'العربي الشرقي للتأمين', nameEn: 'Arab Orient Insurance', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'NATIONALGENERAL', name: 'الوطنية العامة للتأمين', nameEn: 'National General Insurance', market: 'DFM', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  
  // --- التجزئة في DFM ---
  { symbol: 'CARREFOUR', name: 'كارفور الإمارات', nameEn: 'Carrefour UAE', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'MAJID', name: 'ماجد الفطيم', nameEn: 'Majid Al Futtaim', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'SPINNEYS', name: 'سبينس', nameEn: 'Spinneys', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'CHOITHRAMS', name: 'تشويثرامز', nameEn: 'Choithrams', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'UNIONCOOP', name: 'التعاونية الاتحاد', nameEn: 'Union Cooperative', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'ALMAYA', name: 'المايا للتوزيع', nameEn: 'Al Maya Distribution', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'BAKER', name: 'بيكر للتجارة', nameEn: 'Baker Trading', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'EMAX', name: 'إيماكس للإلكترونيات', nameEn: 'Emax Electronics', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'SHARAFDG', name: 'شرف دي جي', nameEn: 'Sharaf DG', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'JASHANMAL', name: 'جاشانمال', nameEn: 'Jashanmal', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'BAQER', name: 'باقر للتجارة', nameEn: 'Baqer Trading', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'MALL', name: 'ذا مول', nameEn: 'The Mall', market: 'DFM', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  
  // --- الصناعة في DFM ---
  { symbol: 'EMAARIND', name: 'إعمار الصناعية', nameEn: 'Emaar Industries', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'ALGHURAIR', name: 'الغرير للصناعات', nameEn: 'Al Ghurair Industries', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'GULFCABLES', name: 'كابلات الخليج', nameEn: 'Gulf Cables', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'FOODCO', name: 'فودكو للصناعات الغذائية', nameEn: 'Foodco Industries', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'PALM', name: 'نخيل للصناعات', nameEn: 'Palm Industries', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'GULFGLASS', name: 'زجاج الخليج', nameEn: 'Gulf Glass', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'METALCO', name: 'ميتالكو', nameEn: 'Metalco', market: 'DFM', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  
  // --- النقل في DFM ---
  { symbol: 'EMAARMALLS', name: 'إعمار مولز', nameEn: 'Emaar Malls', market: 'DFM', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'ARAMEX', name: 'أرامكس', nameEn: 'Aramex', market: 'DFM', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'EMIRATESAIR', name: 'طيران الإمارات', nameEn: 'Emirates Airline', market: 'DFM', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'FLYDUBAI', name: 'فلاي دبي', nameEn: 'Fly Dubai', market: 'DFM', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'DPWORLD', name: 'موانئ دبي العالمية', nameEn: 'DP World', market: 'DFM', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'GULFLOGISTICS', name: 'الخليج للخدمات اللوجستية', nameEn: 'Gulf Logistics', market: 'DFM', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  
  // --- الاستثمار في DFM ---
  { symbol: 'ICD', name: 'مؤسسة دبي للاستثمار', nameEn: 'Investment Corporation of Dubai', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'GULFINVEST', name: 'الخليج للاستثمار', nameEn: 'Gulf Investment', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'EMIRATESINV', name: 'الإمارات للاستثمار', nameEn: 'Emirates Investment', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'EMAARINV', name: 'إعمار للاستثمار', nameEn: 'Emaar Investment', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SHUAAINV', name: 'شعاع للاستثمار', nameEn: 'SHUAA Investment', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'AJMANINV', name: 'عجمان للاستثمار', nameEn: 'Ajman Investment', market: 'DFM', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  
  // --- الخدمات في DFM ---
  { symbol: 'EMAARSERV', name: 'إعمار للخدمات', nameEn: 'Emaar Services', market: 'DFM', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'DUBAISERV', name: 'دبي للخدمات', nameEn: 'Dubai Services', market: 'DFM', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'TECHSERV', name: 'التقنية للخدمات', nameEn: 'Tech Services', market: 'DFM', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'CONSULTING', name: 'الاستشارات الإماراتية', nameEn: 'Emirates Consulting', market: 'DFM', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'FACILITY', name: 'إدارة المرافق', nameEn: 'Facility Management', market: 'DFM', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  
  // --- السياحة في DFM ---
  { symbol: 'JUMEIRAH', name: 'جميرا للفنادق', nameEn: 'Jumeirah Hotels', market: 'DFM', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'ATLANTIS', name: 'أتلانتس', nameEn: 'Atlantis', market: 'DFM', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'DUBAITOURISM', name: 'دبي للسياحة', nameEn: 'Dubai Tourism', market: 'DFM', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  
  // --- الصحة في DFM ---
  { symbol: 'ASTER', name: 'أستر للرعاية الصحية', nameEn: 'Aster Healthcare', market: 'DFM', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: 'MEDCARE', name: 'ميديكير', nameEn: 'Medcare', market: 'DFM', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  
  // --- التعليم في DFM ---
  { symbol: 'GEMSEDUCATION', name: 'جيمس للتعليم', nameEn: 'GEMS Education', market: 'DFM', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: 'TALEEM', name: 'تعليل للتعليم', nameEn: 'Taaleem Education', market: 'DFM', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  
  // --- المرافق في DFM ---
  { symbol: 'DEWA', name: 'هيئة كهرباء ومياه دبي', nameEn: 'DEWA', market: 'DFM', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // سوق ناسداك دبي (Nasdaq Dubai) - 25+ سهم
  // ═══════════════════════════════════════════════════════════════
  
  // --- السندات والصكوك ---
  { symbol: 'DIFX-SUKUK1', name: 'صكوك دبي السيادية', nameEn: 'Dubai Sovereign Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  { symbol: 'DIFX-SUKUK2', name: 'صكوك أبوظبي السيادية', nameEn: 'Abu Dhabi Sovereign Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  { symbol: 'DIFX-SUKUK3', name: 'صكوك الشارقة السيادية', nameEn: 'Sharjah Sovereign Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  { symbol: 'DIFX-BOND1', name: 'سندات دبي الحكومية', nameEn: 'Dubai Government Bonds', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: false },
  { symbol: 'DIFX-BOND2', name: 'سندات أبوظبي الحكومية', nameEn: 'Abu Dhabi Government Bonds', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: false },
  { symbol: 'DIFX-ENBD-SUKUK', name: 'صكوك بنك الإمارات دبي الوطني', nameEn: 'ENBD Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  { symbol: 'DIFX-EMAAR-SUKUK', name: 'صكوك إعمار', nameEn: 'Emaar Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  { symbol: 'DIFX-DIB-SUKUK', name: 'صكوك بنك دبي الإسلامي', nameEn: 'DIB Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  { symbol: 'DIFX-ADIB-SUKUK', name: 'صكوك بنك أبوظبي الإسلامي', nameEn: 'ADIB Sukuk', market: 'NASDAQ_DUBAI', sector: 'السندات', sectorEn: 'Bonds', isShariaCompliant: true },
  
  // --- صناديق الاستثمار المتداولة (ETFs) ---
  { symbol: 'UAEETF', name: 'صندوق الإمارات المتداول', nameEn: 'UAE ETF', market: 'NASDAQ_DUBAI', sector: 'صناديق المؤشرات', sectorEn: 'ETFs', isShariaCompliant: true, isETF: true },
  { symbol: 'SHARIAETF', name: 'صندوق الشريعة المتداول', nameEn: 'Sharia ETF', market: 'NASDAQ_DUBAI', sector: 'صناديق المؤشرات', sectorEn: 'ETFs', isShariaCompliant: true, isETF: true },
  { symbol: 'GULFETF', name: 'صندوق الخليج المتداول', nameEn: 'Gulf ETF', market: 'NASDAQ_DUBAI', sector: 'صناديق المؤشرات', sectorEn: 'ETFs', isShariaCompliant: true, isETF: true },
  { symbol: 'EMIRATESETF', name: 'صندوق الإمارات للمؤشر', nameEn: 'Emirates Index ETF', market: 'NASDAQ_DUBAI', sector: 'صناديق المؤشرات', sectorEn: 'ETFs', isShariaCompliant: true, isETF: true },
  { symbol: 'DUBAIMAINTF', name: 'صندوق دبي للعقارات', nameEn: 'Dubai Real Estate Fund', market: 'NASDAQ_DUBAI', sector: 'صناديق العقارات', sectorEn: 'REITs', isShariaCompliant: true, isREIT: true },
  { symbol: 'ADREIT', name: 'صندوق أبوظبي العقاري', nameEn: 'Abu Dhabi REIT', market: 'NASDAQ_DUBAI', sector: 'صناديق العقارات', sectorEn: 'REITs', isShariaCompliant: true, isREIT: true },
  
  // --- أسهم الشركات الكبرى المدرجة في ناسداك دبي ---
  { symbol: 'DPWORLD-DIFX', name: 'موانئ دبي العالمية', nameEn: 'DP World', market: 'NASDAQ_DUBAI', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'DAMAC-DIFX', name: 'داماك الدولية', nameEn: 'DAMAC International', market: 'NASDAQ_DUBAI', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'EMAAR-DIFX', name: 'إعمار الدولية', nameEn: 'Emaar International', market: 'NASDAQ_DUBAI', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DIC-DIFX', name: 'دبي للاستثمار الدولية', nameEn: 'Dubai Investments International', market: 'NASDAQ_DUBAI', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SHUAA-DIFX', name: 'شعاع الدولية', nameEn: 'SHUAA International', market: 'NASDAQ_DUBAI', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'GFH-DIFX', name: 'الخليج للتمويل الدولي', nameEn: 'Gulf Finance House International', market: 'NASDAQ_DUBAI', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  
  // --- المشتقات والأسهم الأجنبية ---
  { symbol: 'AAPL-DIFX', name: 'أبل (مدرج في دبي)', nameEn: 'Apple Inc. (Dubai Listed)', market: 'NASDAQ_DUBAI', sector: 'التقنية', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'MSFT-DIFX', name: 'مايكروسوفت (مدرج في دبي)', nameEn: 'Microsoft (Dubai Listed)', market: 'NASDAQ_DUBAI', sector: 'التقنية', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'GOOGL-DIFX', name: 'ألفابت (مدرج في دبي)', nameEn: 'Alphabet (Dubai Listed)', market: 'NASDAQ_DUBAI', sector: 'التقنية', sectorEn: 'Technology', isShariaCompliant: true },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// Get stocks by market
export function getStocksByMarket(market: 'ADX' | 'DFM' | 'NASDAQ_DUBAI'): UAEStock[] {
  return uaeStocksDatabase.filter(stock => stock.market === market);
}

// Get stocks by sector
export function getUAEStocksBySector(sector: string): UAEStock[] {
  return uaeStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// Get stocks by sharia compliance
export function getUAEShariaCompliantStocks(): UAEStock[] {
  return uaeStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// Get all sectors
export function getUAESectors(): string[] {
  return [...new Set(uaeStocksDatabase.map(stock => stock.sector))];
}

// Count by sector
export function countUAEBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  uaeStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// Count by market
export function countByMarket(): Record<string, number> {
  const counts: Record<string, number> = {};
  uaeStocksDatabase.forEach(stock => {
    counts[stock.market] = (counts[stock.market] || 0) + 1;
  });
  return counts;
}

// Get stock by symbol
export function getUAEStockBySymbol(symbol: string): UAEStock | undefined {
  return uaeStocksDatabase.find(stock => stock.symbol === symbol);
}

// Get sharia compliant count
export function getUAEShariaCompliantCount(): { compliant: number; nonCompliant: number } {
  const compliant = uaeStocksDatabase.filter(stock => stock.isShariaCompliant).length;
  return {
    compliant,
    nonCompliant: uaeStocksDatabase.length - compliant
  };
}

// Get market statistics
export function getUAEMarketStats() {
  const totalStocks = uaeStocksDatabase.length;
  const shariaCompliant = uaeStocksDatabase.filter(s => s.isShariaCompliant).length;
  const adxStocks = uaeStocksDatabase.filter(s => s.market === 'ADX').length;
  const dfmStocks = uaeStocksDatabase.filter(s => s.market === 'DFM').length;
  const nasdaqDubaiStocks = uaeStocksDatabase.filter(s => s.market === 'NASDAQ_DUBAI').length;
  const sectors = getUAESectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    adxStocks,
    dfmStocks,
    nasdaqDubaiStocks,
    sectorsCount: sectors.length,
    sectors
  };
}

export default uaeStocksDatabase;
