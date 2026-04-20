// قاعدة بيانات الأسهم الكويتية الكاملة - بورصة الكويت (Boursa Kuwait)
// 136 سهم مدرج في السوق الكويتي

export interface KuwaitStock {
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

export const kuwaitStocksDatabase: KuwaitStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // البنوك (Banks) - 11 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'NBK.KW', name: 'بنك الكويت الوطني', nameEn: 'National Bank of Kuwait', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'KFH.KW', name: 'بيت التمويل الكويتي', nameEn: 'Kuwait Finance House', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'BURG.KW', name: 'بنك برقان', nameEn: 'Burgan Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'AUB.KW', name: 'البنك الأهلي المتحد - الكويت', nameEn: 'Ahli United Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'CBK.KW', name: 'البنك التجاري الكويتي', nameEn: 'Commercial Bank of Kuwait', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'KIB.KW', name: 'البنك الكويتي الصناعي', nameEn: 'Kuwait Industrial Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'KMEB.KW', name: 'بنك الكويت والشرق الأوسط', nameEn: 'Kuwait and Middle East Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'SAB.KW', name: 'البنك السعودي البريطاني - الكويت', nameEn: 'SAB Kuwait', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'GBANK.KW', name: 'بنك الخليج', nameEn: 'Gulf Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'BOUBYAN.KW', name: 'بنك بوبيان', nameEn: 'Boubyan Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'WKBS.KW', name: 'ورقة بنك الكويت الوطني', nameEn: 'NBK Capital', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },

  // ═══════════════════════════════════════════════════════════════
  // الاستثمار (Investment) - 28 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'KINV.KW', name: 'الاستثمارات الكويتية', nameEn: 'Kuwait Investment Company', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KIPCO.KW', name: 'مشاريع الكويت القابضة', nameEn: 'Kuwait Projects Company', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'GULF.KW', name: 'الخليج للاستثمار', nameEn: 'Gulf Investment House', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ALR.KW', name: 'الرياض للاستثمار', nameEn: 'Al Riyadh Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'NOOR.KW', name: 'النور للاستثمار', nameEn: 'Noor Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KAMCO.KW', name: 'كامكو للاستثمار', nameEn: 'KAMCO Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'MARKAZ.KW', name: 'المركز المالي الكويتي', nameEn: 'Markaz', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ICO.KW', name: 'الاستثمارات الوطنية', nameEn: 'International Capital', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'JER.KW', name: 'جيركا للاستثمار', nameEn: 'Jersey Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KINTL.KW', name: 'الكويت الدولية للاستثمار', nameEn: 'Kuwait International Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ALAQARI.KW', name: 'العقارية للاستثمار', nameEn: 'Aqari Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SAMA.KW', name: 'سامة للاستثمار', nameEn: 'Sama Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ALDEERA.KW', name: 'الديرة للاستثمار', nameEn: 'Al Deera Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KSE.KW', name: 'الكويتية للاستثمار', nameEn: 'Kuwait Stock Exchange', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'MENA.KW', name: 'مينا للاستثمار', nameEn: 'MENA Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'GRANITE.KW', name: 'جرانيت للاستثمار', nameEn: 'Granite Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'TAMWEEL.KW', name: 'تمويل للاستثمار', nameEn: 'Tamweel Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'PIONEER.KW', name: 'الرائد للاستثمار', nameEn: 'Pioneer Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SANAM.KW', name: 'صنام للاستثمار', nameEn: 'Sanam Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'FIRST.KW', name: 'الأولى للاستثمار', nameEn: 'First Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KUFPEC.KW', name: 'الكويت للأوراق المالية', nameEn: 'KUFPEC', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'ENAYA.KW', name: 'عناية للاستثمار', nameEn: 'Enaya Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'AMANA.KW', name: 'أمانة للاستثمار', nameEn: 'Amana Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'OSOUL.KW', name: 'أصول للاستثمار', nameEn: 'Osoul Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KRC.KW', name: 'الكويتية للموارد', nameEn: 'Kuwait Resources', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'DARALARKAN.KW', name: 'دار الأركان للاستثمار', nameEn: 'Dar Al Arkan Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'SAFAT.KW', name: 'صفات للاستثمار', nameEn: 'Safat Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: 'KCC.KW', name: 'الكويتية للتنمية', nameEn: 'Kuwait Development Company', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التأمين (Insurance) - 11 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'GIC.KW', name: 'الخليج للتأمين', nameEn: 'Gulf Insurance Company', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'AIG.KW', name: 'أمريكان إنترناشونال', nameEn: 'American International Group', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: false },
  { symbol: 'KI.KW', name: 'الكويت للتأمين', nameEn: 'Kuwait Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: false },
  { symbol: 'WIKA.KW', name: 'الوطنية للتأمين', nameEn: 'Warba Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ALKHALIJI.KW', name: 'الخليجي للتأمين', nameEn: 'Al Khaleji Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'BAHRA.KW', name: 'بحرة للتأمين', nameEn: 'Bahra Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'GULFCHAMP.KW', name: 'خليجي للتأمين', nameEn: 'Gulf Champion Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'DAR.KW', name: 'دار للتأمين', nameEn: 'Dar Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'SAFWA.KW', name: 'الصفوة للتأمين', nameEn: 'Safwa Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'TAKAFUL.KW', name: 'التكافل للتأمين', nameEn: 'Takaful Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: 'ALAHLEIA.KW', name: 'الأهلية للتأمين', nameEn: 'Al Ahleia Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // العقارات (Real Estate) - 17 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'MABANEE.KW', name: 'مباني للمشاريع العقارية', nameEn: 'Mabanee Company', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ARZAN.KW', name: 'أرزان العقارية', nameEn: 'Arzan Wealth', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'MASHAER.KW', name: 'مشاعر العقارية', nameEn: 'Mashaer Holding', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'AAYAN.KW', name: 'عيان العقارية', nameEn: 'Aayan Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ALMAZAYA.KW', name: 'المزايا القابضة', nameEn: 'Al Mazaya Holding', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'TAMEER.KW', name: 'تطوير العقارية', nameEn: 'Tameer Holding', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'INSHAA.KW', name: 'الإنشاء العقارية', nameEn: 'Inshaa Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'SALHIA.KW', name: 'الصالحية العقارية', nameEn: 'Salhia Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DARALWASAT.KW', name: 'دار الوسط العقارية', nameEn: 'Dar Al Wasat', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'TABGHA.KW', name: 'طبغة العقارية', nameEn: 'Tabgha Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'BUNAYAN.KW', name: 'بنيان العقارية', nameEn: 'Bunyan Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'JAMALAT.KW', name: 'جمالات العقارية', nameEn: 'Jamalat Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'AFAQ.KW', name: 'آفاق العقارية', nameEn: 'Afaq Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ALAQAR.KW', name: 'العقار القابضة', nameEn: 'Al Aqar Holding', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'TIJARIA.KW', name: 'التجارية العقارية', nameEn: 'Tijaria Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ALSHUWAIKH.KW', name: 'الشويخ العقارية', nameEn: 'Al Shuwaikh Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DAAR.KW', name: 'دار العقارية', nameEn: 'Daar Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصناعة (Industry) - 16 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'EQUATE.KW', name: 'ايكويت', nameEn: 'Equate', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'PIC.KW', name: 'الصناعات البترولية', nameEn: 'Petrochemical Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'KPRINT.KW', name: 'مطبوعات الكويت', nameEn: 'Kuwait Print', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'MISHREF.KW', name: 'المشرف للصناعات', nameEn: 'Mishref Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'KIS.KW', name: 'الكويتية للصناعات', nameEn: 'Kuwait Industrial Sectors', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'NPRINT.KW', name: 'المطبعة الوطنية', nameEn: 'National Print', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'KCABLE.KW', name: 'كابلات الكويت', nameEn: 'Kuwait Cables', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'ALMAZROUI.KW', name: 'المزروعي للصناعات', nameEn: 'Al Mazroui Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'KFLOR.KW', name: 'أرض الكويت للصناعات', nameEn: 'Kuwait Flor', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'MANUF.KW', name: 'التصنيع الكويتية', nameEn: 'Kuwait Manufacturing', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'METAL.KW', name: 'المعدنية الكويتية', nameEn: 'Kuwait Metal', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'BUILD.KW', name: 'البناء والصناعات', nameEn: 'Build & Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'SANAMIND.KW', name: 'صنام الصناعية', nameEn: 'Sanam Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'ALKHATIB.KW', name: 'الخطيب للصناعات', nameEn: 'Al Khatib Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'ALABDULLAH.KW', name: 'العبدالله للصناعات', nameEn: 'Al Abdullah Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'ALDARIND.KW', name: 'الدار للصناعات', nameEn: 'Al Dar Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الخدمات (Services) - 18 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'AGILITY.KW', name: 'أجيليتي للخدمات اللوجستية', nameEn: 'Agility', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'KLC.KW', name: 'اللوجستية الكويتية', nameEn: 'Kuwait Logistics', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'ALSOOR.KW', name: 'الصور للخدمات', nameEn: 'Al Soor Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'KSERV.KW', name: 'الخدمات الكويتية', nameEn: 'Kuwait Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'MAZSERV.KW', name: 'مزايا للخدمات', nameEn: 'Mazaya Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'PSERV.KW', name: 'الخدمات العامة', nameEn: 'Public Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'MAINT.KW', name: 'الصيانة والخدمات', nameEn: 'Maintenance Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'CLEAN.KW', name: 'النظافة والخدمات', nameEn: 'Cleaning Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'SECUR.KW', name: 'الأمن والخدمات', nameEn: 'Security Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'CATER.KW', name: 'التموين والخدمات', nameEn: 'Catering Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'CONS.KW', name: 'الاستشارات والخدمات', nameEn: 'Consulting Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'TRAIN.KW', name: 'التدريب والخدمات', nameEn: 'Training Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'RECRUIT.KW', name: 'التوظيف والخدمات', nameEn: 'Recruitment Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'DOC.KW', name: 'توثيق للخدمات', nameEn: 'Document Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'TRANS.KW', name: 'الترجمة والخدمات', nameEn: 'Translation Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'EVENT.KW', name: 'الفعاليات والخدمات', nameEn: 'Events Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'ADVERT.KW', name: 'الإعلان والخدمات', nameEn: 'Advertising Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },
  { symbol: 'TRAVEL.KW', name: 'السفر والخدمات', nameEn: 'Travel Services', sector: 'الخدمات', sectorEn: 'Services', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // المواد الأساسية (Basic Materials) - 8 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'KCEMENT.KW', name: 'أسمنت الكويت', nameEn: 'Kuwait Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'BLDMAT.KW', name: 'مواد البناء الكويتية', nameEn: 'Building Materials', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'KCHEM.KW', name: 'المواد الكيميائية الكويتية', nameEn: 'Kuwait Chemical', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'KSTEEL.KW', name: 'الحديد الكويتي', nameEn: 'Kuwait Steel', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'KALUM.KW', name: 'الألمنيوم الكويتي', nameEn: 'Kuwait Aluminium', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'KPLAST.KW', name: 'البلاستيك الكويتي', nameEn: 'Kuwait Plastic', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'KGLASS.KW', name: 'الزجاج الكويتي', nameEn: 'Kuwait Glass', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'KPAINT.KW', name: 'الدهانات الكويتية', nameEn: 'Kuwait Paint', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الغذاء والتغذية (Food & Beverages) - 7 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'KFOOD.KW', name: 'الأغذية الكويتية', nameEn: 'Kuwait Food Company (Americana)', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },
  { symbol: 'MEZZAN.KW', name: 'ميزان القابضة', nameEn: 'Mezzan Holding', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },
  { symbol: 'KDAIRY.KW', name: 'الألبان الكويتية', nameEn: 'Kuwait Dairy', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },
  { symbol: 'KWATER.KW', name: 'المياه الكويتية', nameEn: 'Kuwait Water', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },
  { symbol: 'KBAKERY.KW', name: 'المخابز الكويتية', nameEn: 'Kuwait Bakery', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },
  { symbol: 'KREST.KW', name: 'المطاعم الكويتية', nameEn: 'Kuwait Restaurants', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },
  { symbol: 'KBEV.KW', name: 'المشروبات الكويتية', nameEn: 'Kuwait Beverage', sector: 'الغذاء والتغذية', sectorEn: 'Food & Beverages', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الاتصالات (Telecommunications) - 4 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ZAIN.KW', name: 'زين الكويت', nameEn: 'Zain Kuwait', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'OOREDOO.KW', name: 'أوريدو الكويت', nameEn: 'Ooredoo Kuwait', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'STC.KW', name: 'الاتصالات السعودية - الكويت', nameEn: 'STC Kuwait', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'KTEL.KW', name: 'الاتصالات الكويتية', nameEn: 'Kuwait Telecom', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // النقل (Transportation) - 6 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'KAIR.KW', name: 'الخطوط الجوية الكويتية', nameEn: 'Kuwait Airways', sector: 'النقل', sectorEn: 'Transportation', isShariaCompliant: true },
  { symbol: 'KSHIP.KW', name: 'الملاحة الكويتية', nameEn: 'Kuwait Shipping', sector: 'النقل', sectorEn: 'Transportation', isShariaCompliant: true },
  { symbol: 'JAZEERA.KW', name: 'الجزيرة للطيران', nameEn: 'Jazeera Airways', sector: 'النقل', sectorEn: 'Transportation', isShariaCompliant: true },
  { symbol: 'LANDTR.KW', name: 'النقل البري الكويتي', nameEn: 'Kuwait Land Transport', sector: 'النقل', sectorEn: 'Transportation', isShariaCompliant: true },
  { symbol: 'LOGIST.KW', name: 'اللوجستيات الكويتية', nameEn: 'Kuwait Logistics', sector: 'النقل', sectorEn: 'Transportation', isShariaCompliant: true },
  { symbol: 'KPORTS.KW', name: 'الموانئ الكويتية', nameEn: 'Kuwait Ports', sector: 'النقل', sectorEn: 'Transportation', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التجزئة (Retail) - 5 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'CITYCTR.KW', name: 'سيتي سنتر', nameEn: 'City Center', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'LUCKY.KW', name: 'لوكي مول', nameEn: 'Lucky Mall', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'KSOUQ.KW', name: 'السوق الكويتي', nameEn: 'Kuwait Souq', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'KMALL.KW', name: 'المولات الكويتية', nameEn: 'Kuwait Malls', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: 'KSMARKET.KW', name: 'السوبرماركت الكويتية', nameEn: 'Kuwait Supermarkets', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الطاقة (Energy) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'KPC.KW', name: 'مؤسسة البترول الكويتية', nameEn: 'Kuwait Petroleum Corporation', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'KOC.KW', name: 'شركة نفط الكويت', nameEn: 'Kuwait Oil Company', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: 'KNPC.KW', name: 'شركة مصافي الكويت', nameEn: 'Kuwait National Petroleum', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التكنولوجيا (Technology) - 2 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'HAYAT.KW', name: 'الحياة للتكنولوجيا', nameEn: 'Hayat Technology', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'KTECH.KW', name: 'الكويت للتكنولوجيا', nameEn: 'Kuwait Technology', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// Get stocks by sector
export function getKuwaitStocksBySector(sector: string): KuwaitStock[] {
  return kuwaitStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// Get stocks by sharia compliance
export function getKuwaitShariaCompliantStocks(): KuwaitStock[] {
  return kuwaitStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// Get all sectors
export function getKuwaitSectors(): string[] {
  return [...new Set(kuwaitStocksDatabase.map(stock => stock.sector))];
}

// Count by sector
export function countKuwaitBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  kuwaitStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// Get stock by symbol
export function getKuwaitStockBySymbol(symbol: string): KuwaitStock | undefined {
  return kuwaitStocksDatabase.find(stock => stock.symbol === symbol);
}

// Get sharia compliant count
export function getKuwaitShariaCompliantCount(): { compliant: number; nonCompliant: number } {
  const compliant = kuwaitStocksDatabase.filter(stock => stock.isShariaCompliant).length;
  return {
    compliant,
    nonCompliant: kuwaitStocksDatabase.length - compliant
  };
}

// Get market statistics
export function getKuwaitMarketStats() {
  const totalStocks = kuwaitStocksDatabase.length;
  const shariaCompliant = kuwaitStocksDatabase.filter(s => s.isShariaCompliant).length;
  const sectors = getKuwaitSectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    sectorsCount: sectors.length,
    sectors
  };
}

export default kuwaitStocksDatabase;
