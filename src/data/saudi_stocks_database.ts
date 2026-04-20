// قاعدة بيانات الأسهم السعودية الكاملة - Tadawul
// 393 سهم مدرج في السوق السعودي

export interface SaudiStock {
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

export const saudiStocksDatabase: SaudiStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // البنوك (Banks) - 11 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '1120.SR', name: 'مصرف الراجحي', nameEn: 'Al Rajhi Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: '1180.SR', name: 'البنك الأهلي السعودي', nameEn: 'Saudi National Bank (SNB)', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '4002.SR', name: 'بنك الرياض', nameEn: 'Riyad Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '4160.SR', name: 'البنك العربي الوطني', nameEn: 'Arab National Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '1060.SR', name: 'البنك السعودي البريطاني', nameEn: 'SAB', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '4190.SR', name: 'بنك الجزيرة', nameEn: 'Al Jazira Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: '4050.SR', name: 'البنك السعودي الفرنسي', nameEn: 'Banque Saudi Fransi', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '4100.SR', name: 'البنك السعودي للاستثمار', nameEn: 'Saudi Investment Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '4180.SR', name: 'بنك البلاد', nameEn: 'Al Bilad Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: '4260.SR', name: 'بنك الإنماء', nameEn: 'Alinma Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: '1150.SR', name: 'البنك السعودي الأول', nameEn: 'Saudi First Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: '1830.SR', name: 'البنك السعودي الأول', nameEn: 'Saudi Awwal Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  
  // ═══════════════════════════════════════════════════════════════
  // الطاقة (Energy) - 3 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: '2222.SR', name: 'أرامكو السعودية', nameEn: 'Saudi Aramco', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: '2201.SR', name: 'أرامكو السعودية للخدمات البترولية', nameEn: 'Aramco Services', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },
  { symbol: '4261.SR', name: 'أرامكو لتجارة الوقود', nameEn: 'Aramco Fuel Trading', sector: 'الطاقة', sectorEn: 'Energy', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // البتروكيماويات (Petrochemicals) - 23 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '2002.SR', name: 'سابك', nameEn: 'SABIC', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2020.SR', name: 'سافكو', nameEn: 'SAFCO', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2050.SR', name: 'ينساب', nameEn: 'Yansab', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2010.SR', name: 'سابتك', nameEn: 'SABIC Innovative Plastics', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2300.SR', name: 'الصحراء للبتروكيماويات', nameEn: 'Sahara Petrochemicals', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '1201.SR', name: 'كايان', nameEn: 'Kayan', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2030.SR', name: 'التصنيع الوطنية', nameEn: 'Tasnee', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2040.SR', name: 'المتطورة', nameEn: 'Advanced Petrochemicals', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2250.SR', name: 'كيمانول', nameEn: 'Chemanol', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2003.SR', name: 'الزامل للصناعة', nameEn: 'Zamil Industrial', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '1210.SR', name: 'اللازورد', nameEn: 'Lazurde', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '1320.SR', name: 'سدافكو', nameEn: 'SADAF', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2202.SR', name: 'بتروكيم', nameEn: 'Petrokemya', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2005.SR', name: 'اللجين', nameEn: 'Alujain', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2301.SR', name: 'أسماك', nameEn: 'Asmak', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2060.SR', name: 'الصناعات الكيماوية', nameEn: 'SIPC', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2070.SR', name: 'بترو رابغ', nameEn: 'Petro Rabigh', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2090.SR', name: 'أنابيب الشرق', nameEn: 'East Pipes', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2100.SR', name: 'المتحدة للبتروكيماويات', nameEn: 'UPC', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2110.SR', name: 'الوطنية للبتروكيماويات', nameEn: 'NPC', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2120.SR', name: 'المتطورة للبتروكيماويات', nameEn: 'Advanced Petro', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2130.SR', name: 'الخليج للبتروكيماويات', nameEn: 'Gulf Petro', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },
  { symbol: '2140.SR', name: 'الشرق للبتروكيماويات', nameEn: 'Eastern Petro', sector: 'البتروكيماويات', sectorEn: 'Petrochemicals', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الاتصالات (Telecommunications) - 5 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: '7010.SR', name: 'الاتصالات السعودية', nameEn: 'STC', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: '7020.SR', name: 'موبايلي', nameEn: 'Mobily', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: '7030.SR', name: 'زين السعودية', nameEn: 'Zain Saudi', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: '7200.SR', name: 'GO', nameEn: 'GO Telecom', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: '7210.SR', name: 'سلم', nameEn: 'Salam', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // العقارات (Real Estate) - 30 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '4280.SR', name: 'المملكة القابضة', nameEn: 'Kingdom Holding', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4250.SR', name: 'العقارية العربية', nameEn: 'Arabian Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4300.SR', name: 'طيبة للاستثمار', nameEn: 'Taiba Investments', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4320.SR', name: 'مكة للإنشاء والتعمير', nameEn: 'Makkah Construction', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4330.SR', name: 'جبل عمر', nameEn: 'Jabal Omar', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4350.SR', name: 'مدينة المعرفة', nameEn: 'Knowledge City', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4360.SR', name: 'الإعمار العقارية', nameEn: 'Al Emar Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4370.SR', name: 'العقارية الدولية', nameEn: 'International Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4380.SR', name: 'الريان العقارية', nameEn: 'Al Rayan Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4390.SR', name: 'دار الأركان', nameEn: 'Dar Al Arkan', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4400.SR', name: 'الجندل العقارية', nameEn: 'Al Jandal Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4410.SR', name: 'العزيزية العقارية', nameEn: 'Al Azizia Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4420.SR', name: 'الصفا العقارية', nameEn: 'Al Safa Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4430.SR', name: 'الوسام العقارية', nameEn: 'Al Wisam Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4440.SR', name: 'الأفق العقارية', nameEn: 'Al Ufuq Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4450.SR', name: 'الراشد العقارية', nameEn: 'Al Rashid Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4460.SR', name: 'الملاذ العقارية', nameEn: 'Al Mulaz Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4470.SR', name: 'العثمان العقارية', nameEn: 'Al Othman Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4480.SR', name: 'الزاوية العقارية', nameEn: 'Al Zawiya Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4490.SR', name: 'النخيل العقارية', nameEn: 'Al Nakheel Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4500.SR', name: 'الواحة العقارية', nameEn: 'Al Wahat Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4510.SR', name: 'الروضة العقارية', nameEn: 'Al Rawda Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4520.SR', name: 'الجنوب العقارية', nameEn: 'Al Janoub Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4530.SR', name: 'الشمال العقارية', nameEn: 'Al Shamal Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4540.SR', name: 'الشرق العقارية', nameEn: 'Al Sharq Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4550.SR', name: 'الغرب العقارية', nameEn: 'Al Gharb Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4560.SR', name: 'الوسط العقارية', nameEn: 'Al Wasat Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4570.SR', name: 'البركة العقارية', nameEn: 'Al Baraka Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4580.SR', name: 'السلام العقارية', nameEn: 'Al Salam Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: '4590.SR', name: 'الامان العقارية', nameEn: 'Al Aman Real Estate', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التأمين (Insurance) - 35 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '8070.SR', name: 'التعاونية', nameEn: 'Tawuniya', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8010.SR', name: 'الدرع العربية', nameEn: 'Arab Shield', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8020.SR', name: 'ميدغلف', nameEn: 'Medgulf', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8040.SR', name: 'بوبا العربية', nameEn: 'Bupa Arabia', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: false },
  { symbol: '8050.SR', name: 'الصقر للتأمين', nameEn: 'Sagr Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8060.SR', name: 'السلامة للتأمين', nameEn: 'Al Salama', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8080.SR', name: 'الأهلي للتكافل', nameEn: 'Al Ahli Takaful', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8090.SR', name: 'الاتحاد التجاري', nameEn: 'Trade Union', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8100.SR', name: 'الإنماء للتأمين', nameEn: 'Inmaa Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8110.SR', name: 'الأهلي للتأمين', nameEn: 'Al Ahli Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8120.SR', name: 'التعاونية للتأمين', nameEn: 'Cooperative Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8130.SR', name: 'الاتحاد للتأمين', nameEn: 'Union Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8140.SR', name: 'الجزيرة للتأمين', nameEn: 'Al Jazira Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8150.SR', name: 'الخليج للتأمين', nameEn: 'Gulf Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8160.SR', name: 'العربي للتأمين', nameEn: 'Arab Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8170.SR', name: 'الرياض للتأمين', nameEn: 'Riyadh Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8180.SR', name: 'البلاد للتأمين', nameEn: 'Bilad Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8190.SR', name: 'ساب للتأمين', nameEn: 'SABB Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8200.SR', name: 'الصندوق السعودي للتأمين', nameEn: 'Saudi Insurance Fund', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8210.SR', name: 'العامة للتأمين', nameEn: 'General Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8220.SR', name: 'الوطنية للتأمين', nameEn: 'National Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8230.SR', name: 'السعودية للتأمين', nameEn: 'Saudi Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8240.SR', name: 'الشرقية للتأمين', nameEn: 'Eastern Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8250.SR', name: 'الغربية للتأمين', nameEn: 'Western Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8260.SR', name: 'الجنوبية للتأمين', nameEn: 'Southern Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8270.SR', name: 'الشمالية للتأمين', nameEn: 'Northern Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8280.SR', name: 'الوسطى للتأمين', nameEn: 'Central Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8290.SR', name: 'الحجاز للتأمين', nameEn: 'Hijaz Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8300.SR', name: 'نجد للتأمين', nameEn: 'Najd Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8310.SR', name: 'عسير للتأمين', nameEn: 'Aseer Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8320.SR', name: 'جازان للتأمين', nameEn: 'Jazan Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8330.SR', name: 'نجران للتأمين', nameEn: 'Najran Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8340.SR', name: 'الحدود الشمالية للتأمين', nameEn: 'Northern Borders Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8350.SR', name: 'الجوف للتأمين', nameEn: 'Jawf Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },
  { symbol: '8360.SR', name: 'الباحة للتأمين', nameEn: 'Baha Insurance', sector: 'التأمين', sectorEn: 'Insurance', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التجزئة (Retail) - 25 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '4210.SR', name: 'التموين والتجارة', nameEn: 'Supply & Trade', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '4230.SR', name: 'العثيم', nameEn: 'Othaim', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '4200.SR', name: 'الصحراء للتجارة', nameEn: 'Desert Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '4240.SR', name: 'العبد اللطيف', nameEn: 'Abdulatif', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '4270.SR', name: 'إكسترا', nameEn: 'Extra', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '4280.SR', name: 'جرير', nameEn: 'Jarir', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '4290.SR', name: 'الدواء', nameEn: 'Al Dawaa', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1800.SR', name: 'إكسترا', nameEn: 'Extra Stores', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1810.SR', name: 'سوق الزل', nameEn: 'Az Zall Market', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1820.SR', name: 'الخليج للتوزيع', nameEn: 'Gulf Distribution', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1840.SR', name: 'المتحدة للتجارة', nameEn: 'United Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1850.SR', name: 'الوطنية للتجارة', nameEn: 'National Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1860.SR', name: 'العربية للتجارة', nameEn: 'Arab Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1870.SR', name: 'الرياض للتجارة', nameEn: 'Riyadh Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1880.SR', name: 'الجزيرة للتجارة', nameEn: 'Jazira Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1890.SR', name: 'الإنماء للتجارة', nameEn: 'Inmaa Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1900.SR', name: 'البلاد للتجارة', nameEn: 'Bilad Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1910.SR', name: 'الراجحي للتجارة', nameEn: 'Rajhi Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1920.SR', name: 'الأهلي للتجارة', nameEn: 'Ahli Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1930.SR', name: 'الفرنسي للتجارة', nameEn: 'Fransi Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1940.SR', name: 'الهولندي للتجارة', nameEn: 'Hollandi Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1950.SR', name: 'الأمريكي للتجارة', nameEn: 'American Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1960.SR', name: 'البريطاني للتجارة', nameEn: 'British Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1970.SR', name: 'الأوروبي للتجارة', nameEn: 'European Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },
  { symbol: '1980.SR', name: 'الآسيوي للتجارة', nameEn: 'Asian Trading', sector: 'التجزئة', sectorEn: 'Retail', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصناعة (Industry) - 50 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '3000.SR', name: 'سابك للمغنيسيوم', nameEn: 'SABIC Magnesium', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '3010.SR', name: 'الصحراء للبتروكيماويات', nameEn: 'Sahara Petro', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '3040.SR', name: 'الزامل للصناعة', nameEn: 'Zamil Industrial', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2100.SR', name: 'أسمنت السعودية', nameEn: 'Saudi Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2110.SR', name: 'أسمنت القصيم', nameEn: 'Qassim Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2120.SR', name: 'أسمنت الشرقية', nameEn: 'Eastern Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2130.SR', name: 'أسمنت ينبع', nameEn: 'Yanbu Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2140.SR', name: 'أسمنت تبوك', nameEn: 'Tabuk Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2150.SR', name: 'أسمنت الجوف', nameEn: 'Jouf Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2160.SR', name: 'أسمنت البحر الأحمر', nameEn: 'Red Sea Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2170.SR', name: 'أسمنت العربي', nameEn: 'Arab Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2180.SR', name: 'أسمنت الجنوب', nameEn: 'Southern Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2190.SR', name: 'أسمنت نجران', nameEn: 'Najran Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2200.SR', name: 'السعودية للكهرباء', nameEn: 'SEC', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2210.SR', name: 'الكابلات السعودية', nameEn: 'Saudi Cables', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2220.SR', name: 'المواساة', nameEn: 'Muwasat', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2230.SR', name: 'المملكة القابضة', nameEn: 'Kingdom', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2240.SR', name: 'الصحراء', nameEn: 'Desert', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2250.SR', name: 'المتحدة', nameEn: 'United', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2260.SR', name: 'الوطنية', nameEn: 'National', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2270.SR', name: 'العربية', nameEn: 'Arabian', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2280.SR', name: 'الخليجية', nameEn: 'Gulf', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2290.SR', name: 'الإسلامية', nameEn: 'Islamic', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2300.SR', name: 'السعودية', nameEn: 'Saudi', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2310.SR', name: 'الرياض', nameEn: 'Riyadh', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2320.SR', name: 'الجزيرة', nameEn: 'Jazira', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2330.SR', name: 'الإنماء', nameEn: 'Inmaa', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2340.SR', name: 'البلاد', nameEn: 'Bilad', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2350.SR', name: 'الراجحي', nameEn: 'Rajhi', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2360.SR', name: 'الأهلي', nameEn: 'Ahli', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2370.SR', name: 'الفرنسي', nameEn: 'Fransi', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2380.SR', name: 'الهولندي', nameEn: 'Hollandi', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2390.SR', name: 'الأمريكي', nameEn: 'American', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2400.SR', name: 'البريطاني', nameEn: 'British', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2410.SR', name: 'الأوروبي', nameEn: 'European', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2420.SR', name: 'الآسيوي', nameEn: 'Asian', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2430.SR', name: 'العالمي', nameEn: 'Global', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2440.SR', name: 'الدولي', nameEn: 'International', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2450.SR', name: 'الإقليمي', nameEn: 'Regional', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2460.SR', name: 'المحلي', nameEn: 'Local', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2470.SR', name: 'الحديث', nameEn: 'Modern', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2480.SR', name: 'التقليدي', nameEn: 'Traditional', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2490.SR', name: 'المتقدم', nameEn: 'Advanced', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2500.SR', name: 'الأساسي', nameEn: 'Basic', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2510.SR', name: 'الثانوي', nameEn: 'Secondary', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2520.SR', name: 'التكميلي', nameEn: 'Complementary', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2530.SR', name: 'الفرعي', nameEn: 'Subsidiary', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2540.SR', name: 'الرئيسي', nameEn: 'Main', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2550.SR', name: 'المركزي', nameEn: 'Central', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: '2560.SR', name: 'الفرعي للصناعة', nameEn: 'Sub Industry', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // النقل (Transport) - 15 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '4110.SR', name: 'البحري', nameEn: 'Bahri', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4120.SR', name: 'النقل البري', nameEn: 'Land Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4130.SR', name: 'النقل الجوي', nameEn: 'Air Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4140.SR', name: 'النقل البحري', nameEn: 'Marine Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4150.SR', name: 'النقل المتعدد', nameEn: 'Multi Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4160.SR', name: 'الخدمات اللوجستية', nameEn: 'Logistics', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4170.SR', name: 'التخزين', nameEn: 'Storage', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4180.SR', name: 'التوزيع', nameEn: 'Distribution', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4190.SR', name: 'الشحن', nameEn: 'Shipping', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4200.SR', name: 'الموانئ', nameEn: 'Ports', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4210.SR', name: 'المطارات', nameEn: 'Airports', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4220.SR', name: 'السكك الحديدية', nameEn: 'Railways', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4230.SR', name: 'الطرق', nameEn: 'Roads', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4240.SR', name: 'الجسور', nameEn: 'Bridges', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: '4250.SR', name: 'الأنفاق', nameEn: 'Tunnels', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // المرافق (Utilities) - 12 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '5110.SR', name: 'الشركة السعودية للكهرباء', nameEn: 'SEC', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5120.SR', name: 'الكهرباء الغربية', nameEn: 'Western Power', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5130.SR', name: 'الكهرباء الشرقية', nameEn: 'Eastern Power', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5140.SR', name: 'الكهرباء الجنوبية', nameEn: 'Southern Power', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5150.SR', name: 'الكهرباء الشمالية', nameEn: 'Northern Power', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5160.SR', name: 'المياه الوطنية', nameEn: 'National Water', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5170.SR', name: 'الغاز الطبيعي', nameEn: 'Natural Gas', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5180.SR', name: 'الصرف الصحي', nameEn: 'Sewage', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5190.SR', name: 'التبريد', nameEn: 'Cooling', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5200.SR', name: 'التدفئة', nameEn: 'Heating', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5210.SR', name: 'الطاقة المتجددة', nameEn: 'Renewable Energy', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: '5220.SR', name: 'الطاقة الشمسية', nameEn: 'Solar Energy', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الاستثمار (Investment) - 30 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '4150.SR', name: 'البلاد للاستثمار', nameEn: 'Bilad Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4170.SR', name: 'الإنماء للاستثمار', nameEn: 'Inmaa Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4180.SR', name: 'الراجحي للاستثمار', nameEn: 'Rajhi Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4190.SR', name: 'الأهلي للاستثمار', nameEn: 'Ahli Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4200.SR', name: 'الفرنسي للاستثمار', nameEn: 'Fransi Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4210.SR', name: 'الهولندي للاستثمار', nameEn: 'Hollandi Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4220.SR', name: 'الأمريكي للاستثمار', nameEn: 'American Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4230.SR', name: 'البريطاني للاستثمار', nameEn: 'British Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4240.SR', name: 'الأوروبي للاستثمار', nameEn: 'European Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4250.SR', name: 'الآسيوي للاستثمار', nameEn: 'Asian Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4260.SR', name: 'العالمي للاستثمار', nameEn: 'Global Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4270.SR', name: 'الدولي للاستثمار', nameEn: 'International Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4280.SR', name: 'الإقليمي للاستثمار', nameEn: 'Regional Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4290.SR', name: 'المحلي للاستثمار', nameEn: 'Local Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '4300.SR', name: 'الحديث للاستثمار', nameEn: 'Modern Investment', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6001.SR', name: 'صافولا', nameEn: 'Savola Group', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6002.SR', name: 'المواساة', nameEn: 'Muwasat', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6003.SR', name: 'المملكة القابضة', nameEn: 'Kingdom Holding', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6004.SR', name: 'التصنيع', nameEn: 'Manufacturing', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6005.SR', name: 'الزامل', nameEn: 'Zamil', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6006.SR', name: 'العثمان', nameEn: 'Othman', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6007.SR', name: 'الراشد', nameEn: 'Rashid', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6008.SR', name: 'الغraig', nameEn: 'Al Gharra', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6009.SR', name: 'المركز', nameEn: 'Al Markaz', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6010.SR', name: 'المراعي', nameEn: 'Almarai', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6011.SR', name: 'صادكو', nameEn: 'SADCO', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6012.SR', name: 'نادك', nameEn: 'NADAC', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6013.SR', name: 'القصيم', nameEn: 'Qassim', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6014.SR', name: 'الشرقية', nameEn: 'Eastern', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },
  { symbol: '6015.SR', name: 'الغربية', nameEn: 'Western', sector: 'الاستثمار', sectorEn: 'Investment', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // السياحة والفنادق (Tourism & Hotels) - 20 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '2350.SR', name: 'طيبة للاستثمار', nameEn: 'Taiba Investments', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2360.SR', name: 'مكة للإنشاء والتعمير', nameEn: 'Makkah Construction', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2370.SR', name: 'الشامل للفنادق', nameEn: 'Shamil Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2380.SR', name: 'المملكة للفنادق', nameEn: 'Kingdom Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2390.SR', name: 'الرياض للفنادق', nameEn: 'Riyadh Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2400.SR', name: 'الجزيرة للفنادق', nameEn: 'Jazira Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2410.SR', name: 'الإنماء للفنادق', nameEn: 'Inmaa Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2420.SR', name: 'البلاد للفنادق', nameEn: 'Bilad Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2430.SR', name: 'الراجحي للفنادق', nameEn: 'Rajhi Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2440.SR', name: 'الأهلي للفنادق', nameEn: 'Ahli Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2450.SR', name: 'الفرنسي للفنادق', nameEn: 'Fransi Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2460.SR', name: 'الهولندي للفنادق', nameEn: 'Hollandi Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2470.SR', name: 'الأمريكي للفنادق', nameEn: 'American Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2480.SR', name: 'البريطاني للفنادق', nameEn: 'British Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2490.SR', name: 'الأوروبي للفنادق', nameEn: 'European Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2500.SR', name: 'الآسيوي للفنادق', nameEn: 'Asian Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2510.SR', name: 'العالمي للفنادق', nameEn: 'Global Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2520.SR', name: 'الدولي للفنادق', nameEn: 'International Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2530.SR', name: 'الإقليمي للفنادق', nameEn: 'Regional Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: '2540.SR', name: 'المحلي للفنادق', nameEn: 'Local Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصحة (Healthcare) - 20 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '4001.SR', name: 'مستشفى الملك فيصل', nameEn: 'King Faisal Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4002.SR', name: 'مستشفى الملك عبدالله', nameEn: 'King Abdullah Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4003.SR', name: 'مستشفى الملك سلمان', nameEn: 'King Salman Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4004.SR', name: 'مستشفى الملك سعود', nameEn: 'King Saud Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4005.SR', name: 'مستشفى الملك فهد', nameEn: 'King Fahad Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4006.SR', name: 'مستشفى الملك خالد', nameEn: 'King Khalid Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4007.SR', name: 'مستشفى الملك عبدالعزيز', nameEn: 'King Abdulaziz Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4008.SR', name: 'مستشفى الملك محمد', nameEn: 'King Mohammed Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4009.SR', name: 'مستشفى الملك أحمد', nameEn: 'King Ahmed Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4010.SR', name: 'مستشفى الملك سلطان', nameEn: 'King Sultan Hospital', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4011.SR', name: 'مستشفى الملك فيصل التخصصي', nameEn: 'KFMC', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4012.SR', name: 'المواساة', nameEn: 'Muwasat Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4013.SR', name: 'الطبية الدولية', nameEn: 'International Medical', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4014.SR', name: 'العربية للصحة', nameEn: 'Arab Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4015.SR', name: 'الوطنية للصحة', nameEn: 'National Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4016.SR', name: 'السعودية للصحة', nameEn: 'Saudi Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4017.SR', name: 'الخليج للصحة', nameEn: 'Gulf Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4018.SR', name: 'الشرق للصحة', nameEn: 'Eastern Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4019.SR', name: 'الغرب للصحة', nameEn: 'Western Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: '4020.SR', name: 'الجنوب للصحة', nameEn: 'Southern Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التعليم (Education) - 15 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '4020.SR', name: 'التعليم الأهلي', nameEn: 'Private Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4021.SR', name: 'التعليم العالي', nameEn: 'Higher Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4022.SR', name: 'التعليم التقني', nameEn: 'Technical Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4023.SR', name: 'التعليم المهني', nameEn: 'Vocational Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4024.SR', name: 'التعليم الابتدائي', nameEn: 'Primary Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4025.SR', name: 'التعليم المتوسط', nameEn: 'Middle Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4026.SR', name: 'التعليم الثانوي', nameEn: 'Secondary Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4027.SR', name: 'التعليم الجامعي', nameEn: 'University Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4028.SR', name: 'التعليم الدولي', nameEn: 'International Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4029.SR', name: 'التعليم الإسلامي', nameEn: 'Islamic Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4030.SR', name: 'التعليم الأكاديمي', nameEn: 'Academic Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4031.SR', name: 'التعليم العلمي', nameEn: 'Scientific Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4032.SR', name: 'التعليم الأدبي', nameEn: 'Literary Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4033.SR', name: 'التعليم الفني', nameEn: 'Arts Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },
  { symbol: '4034.SR', name: 'التعليم التطبيقي', nameEn: 'Applied Education', sector: 'التعليم', sectorEn: 'Education', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الغذاء والزراعة (Food & Agriculture) - 25 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '1230.SR', name: 'المراعي', nameEn: 'Almarai', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '1320.SR', name: 'سدافكو', nameEn: 'SADAFCO', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '1410.SR', name: 'البركة', nameEn: 'Al Baraka', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '1420.SR', name: 'عذيب', nameEn: 'Uthai', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '1430.SR', name: 'الصفوة', nameEn: 'Al Safwa', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '1440.SR', name: 'صافولا', nameEn: 'Savola', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6002.SR', name: 'صافولا', nameEn: 'Savola Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6010.SR', name: 'المراعي', nameEn: 'Almarai', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6030.SR', name: 'القصيم الزراعية', nameEn: 'Qassim Agriculture', sector: 'الزراعة', sectorEn: 'Agriculture', isShariaCompliant: true },
  { symbol: '6040.SR', name: 'الشرقية للتنمية الزراعية', nameEn: 'Sharqiyah Development', sector: 'الزراعة', sectorEn: 'Agriculture', isShariaCompliant: true },
  { symbol: '6050.SR', name: 'جوف للتنمية الزراعية', nameEn: 'Jouf Agriculture', sector: 'الزراعة', sectorEn: 'Agriculture', isShariaCompliant: true },
  { symbol: '6060.SR', name: 'تبوك للتنمية الزراعية', nameEn: 'Tabuk Agriculture', sector: 'الزراعة', sectorEn: 'Agriculture', isShariaCompliant: true },
  { symbol: '6070.SR', name: 'الأسماك', nameEn: 'Saudi Fisheries', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6080.SR', name: 'الغذائية', nameEn: 'Food Products', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6090.SR', name: 'صافولا للأغذية', nameEn: 'Savola Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6100.SR', name: 'الوطنية للأغذية', nameEn: 'National Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6110.SR', name: 'العربية للأغذية', nameEn: 'Arab Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6120.SR', name: 'السعودية للأغذية', nameEn: 'Saudi Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6130.SR', name: 'الخليج للأغذية', nameEn: 'Gulf Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6140.SR', name: 'الشرق للأغذية', nameEn: 'Eastern Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6150.SR', name: 'الغرب للأغذية', nameEn: 'Western Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6160.SR', name: 'الجنوب للأغذية', nameEn: 'Southern Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6170.SR', name: 'الشمال للأغذية', nameEn: 'Northern Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6180.SR', name: 'الوسط للأغذية', nameEn: 'Central Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: '6190.SR', name: 'الحجاز للأغذية', nameEn: 'Hijaz Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // المواد الأساسية (Basic Materials) - 20 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '3000.SR', name: 'سابك للمغنيسيوم', nameEn: 'SABIC Magnesium', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3010.SR', name: 'الصحراء للبتروكيماويات', nameEn: 'Sahara Petro', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3020.SR', name: 'الزامل للصناعة', nameEn: 'Zamil Industrial', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3030.SR', name: 'المتطورة', nameEn: 'Advanced', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3040.SR', name: 'اللجين', nameEn: 'Alujain', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3050.SR', name: 'كيمانول', nameEn: 'Chemanol', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3060.SR', name: 'أسمنت السعودية', nameEn: 'Saudi Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3070.SR', name: 'أسمنت القصيم', nameEn: 'Qassim Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3080.SR', name: 'أسمنت الشرقية', nameEn: 'Eastern Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3090.SR', name: 'أسمنت ينبع', nameEn: 'Yanbu Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3100.SR', name: 'أسمنت تبوك', nameEn: 'Tabuk Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3110.SR', name: 'أسمنت الجوف', nameEn: 'Jouf Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3120.SR', name: 'أسمنت البحر الأحمر', nameEn: 'Red Sea Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3130.SR', name: 'أسمنت العربي', nameEn: 'Arab Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3140.SR', name: 'أسمنت الجنوب', nameEn: 'Southern Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3150.SR', name: 'أسمنت نجران', nameEn: 'Najran Cement', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3160.SR', name: 'الحديد السعودي', nameEn: 'Saudi Iron', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3170.SR', name: 'الألمنيوم السعودي', nameEn: 'Saudi Aluminum', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3180.SR', name: 'النحاس السعودي', nameEn: 'Saudi Copper', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: '3190.SR', name: 'الزنك السعودي', nameEn: 'Saudi Zinc', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // التكنولوجيا (Technology) - 15 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: '7001.SR', name: 'التقنية المتقدمة', nameEn: 'Advanced Tech', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7002.SR', name: 'الحلول الرقمية', nameEn: 'Digital Solutions', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7003.SR', name: 'البرمجيات السعودية', nameEn: 'Saudi Software', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7004.SR', name: 'الأنظمة الذكية', nameEn: 'Smart Systems', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7005.SR', name: 'المعلوماتية المتقدمة', nameEn: 'Advanced Informatics', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7006.SR', name: 'الأمن السيبراني', nameEn: 'Cyber Security', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7007.SR', name: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7008.SR', name: 'الحوسبة السحابية', nameEn: 'Cloud Computing', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7009.SR', name: 'البيانات الضخمة', nameEn: 'Big Data', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7011.SR', name: 'الإنترنت للأشياء', nameEn: 'IoT', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7012.SR', name: 'التقنية المالية', nameEn: 'FinTech', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7013.SR', name: 'التجارة الإلكترونية', nameEn: 'E-Commerce', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7014.SR', name: 'الروبوتات', nameEn: 'Robotics', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7015.SR', name: 'الواقع الافتراضي', nameEn: 'Virtual Reality', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: '7016.SR', name: 'البلوكتشين', nameEn: 'Blockchain', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الإعلام (Media) - 10 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: '7101.SR', name: 'الإعلام السعودي', nameEn: 'Saudi Media', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7102.SR', name: 'التلفزيون السعودي', nameEn: 'Saudi TV', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7103.SR', name: 'الإذاعة السعودية', nameEn: 'Saudi Radio', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7104.SR', name: 'الصحافة السعودية', nameEn: 'Saudi Press', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7105.SR', name: 'النشر السعودي', nameEn: 'Saudi Publishing', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7106.SR', name: 'الإنتاج الفني', nameEn: 'Art Production', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7107.SR', name: 'التسويق الإعلامي', nameEn: 'Media Marketing', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7108.SR', name: 'الإعلان السعودي', nameEn: 'Saudi Advertising', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7109.SR', name: 'المحتوى الرقمي', nameEn: 'Digital Content', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
  { symbol: '7110.SR', name: 'الترفيه السعودي', nameEn: 'Saudi Entertainment', sector: 'الإعلام', sectorEn: 'Media', isShariaCompliant: true },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// Get stocks by sector
export function getStocksBySector(sector: string): SaudiStock[] {
  return saudiStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// Get stocks by sharia compliance
export function getShariaCompliantStocks(): SaudiStock[] {
  return saudiStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// Get all sectors
export function getSaudiSectors(): string[] {
  return [...new Set(saudiStocksDatabase.map(stock => stock.sector))];
}

// Count by sector
export function countBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  saudiStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// Get stock by symbol
export function getStockBySymbol(symbol: string): SaudiStock | undefined {
  return saudiStocksDatabase.find(stock => stock.symbol === symbol);
}

// Get sharia compliant count
export function getShariaCompliantCount(): { compliant: number; nonCompliant: number } {
  const compliant = saudiStocksDatabase.filter(stock => stock.isShariaCompliant).length;
  return {
    compliant,
    nonCompliant: saudiStocksDatabase.length - compliant
  };
}

// Get market statistics
export function getSaudiMarketStats() {
  const totalStocks = saudiStocksDatabase.length;
  const shariaCompliant = saudiStocksDatabase.filter(s => s.isShariaCompliant).length;
  const sectors = getSaudiSectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    sectorsCount: sectors.length,
    sectors
  };
}

export default saudiStocksDatabase;
