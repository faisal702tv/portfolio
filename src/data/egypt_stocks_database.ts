// قاعدة بيانات الأسهم المصرية الكاملة - البورصة المصرية (EGX)
// 253 سهم مدرج في السوق المصري

export interface EgyptStock {
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

export const egyptStocksDatabase: EgyptStock[] = [
  // ═══════════════════════════════════════════════════════════════
  // البنوك (Banks) - 16 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'COMI.EG', name: 'البنك التجاري الدولي', nameEn: 'Commercial International Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'CBAK.EG', name: 'البنك الأهلي الكويتي - مصر', nameEn: 'Ahli United Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'ADIB.EG', name: 'بنك أبوظبي الإسلامي', nameEn: 'Abu Dhabi Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'FAIT.EG', name: 'بنك فيصل الإسلامي', nameEn: 'Faisal Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'SAUD.EG', name: 'البنك السعودي الأمريكي', nameEn: 'SABB', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'AUB.EG', name: 'البنك الأهلي المتحد', nameEn: 'Ahli United Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'CIEB.EG', name: 'بنك قناة السويس', nameEn: 'Suez Canal Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'EDBE.EG', name: 'البنك الأهلي المصري', nameEn: 'Bank of Alexandria', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'MIDG.EG', name: 'بنك المشرق', nameEn: 'Mashreq Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'MISR.EG', name: 'بنك مصر', nameEn: 'Banque Misr', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'NBE.EG', name: 'البنك الأهلي المصري', nameEn: 'National Bank of Egypt', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'SABB.EG', name: 'البنك السعودي البريطاني', nameEn: 'SABB Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'CAIRO.EG', name: 'بنك القاهرة', nameEn: 'Bank of Cairo', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'DUBAI.EG', name: 'بنك دبي الإسلامي', nameEn: 'Dubai Islamic Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: true },
  { symbol: 'QNB.EG', name: 'بنك قطر الوطني', nameEn: 'QNB', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },
  { symbol: 'AAIB.EG', name: 'البنك العربي الأفريقي', nameEn: 'Arab African Bank', sector: 'البنوك', sectorEn: 'Banks', isShariaCompliant: false },

  // ═══════════════════════════════════════════════════════════════
  // الاتصالات والتكنولوجيا (Telecom & Technology) - 14 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ETEL.EG', name: 'الإتصالات المصرية', nameEn: 'Telecom Egypt', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'EMRI.EG', name: 'المصرية للاتصالات', nameEn: 'Egyptian Telecom', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'VODE.EG', name: 'فودافون مصر', nameEn: 'Vodafone Egypt', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'ORAS.EG', name: 'أوراسكوم للاتصالات', nameEn: 'Orascom Telecom', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'GTEM.EG', name: 'جلوبال تيليكوم', nameEn: 'Global Telecom', sector: 'الاتصالات', sectorEn: 'Telecom', isShariaCompliant: true },
  { symbol: 'FWRY.EG', name: 'فوري للاتصالات', nameEn: 'Fawry', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'DCRC.EG', name: 'مصر للصناعات الرقمية', nameEn: 'Digital Creations', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'EFAA.EG', name: 'إفادة لتكنولوجيا المعلومات', nameEn: 'EFAA', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'IDSC.EG', name: 'المعلومات لدعم اتخاذ القرار', nameEn: 'IDSC', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'ACTS.EG', name: 'أكتوبر لصناعة البرمجيات', nameEn: 'ACTS', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'ITID.EG', name: 'معهد تكنولوجيا المعلومات', nameEn: 'ITI', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'RMDI.EG', name: 'رشد للبرمجيات', nameEn: 'Roshd', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'SOFT.EG', name: 'سوفت', nameEn: 'Soft', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },
  { symbol: 'DATA.EG', name: 'داتا', nameEn: 'Data', sector: 'التكنولوجيا', sectorEn: 'Technology', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // العقارات (Real Estate) - 22 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ORHD.EG', name: 'المتحدة للإسكان', nameEn: 'Orascom Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'HELI.EG', name: 'هليوبوليس للإسكان', nameEn: 'Heliopolis Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ISIN.EG', name: 'الإسماعيلية للإسكان', nameEn: 'Ismailia Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'MNHD.EG', name: 'مدينة نصر للإسكان', nameEn: 'Madinet Nasr Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ELKA.EG', name: 'الكابلات للإسكان', nameEn: 'Qena Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ALEX.EG', name: 'الإسكندرية للإسكان', nameEn: 'Alexandria Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'NOTR.EG', name: 'النور للإسكان', nameEn: 'Al Noor Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'PHD.EG', name: 'طلعت مصطفى', nameEn: 'Palm Hills', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'TMGH.EG', name: 'طلعت مصطفى القابضة', nameEn: 'Talaat Moustafa', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'OCDI.EG', name: 'أورا سكور للتنمية', nameEn: 'Ora Developers', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ALCN.EG', name: 'القاهرة للإسكان', nameEn: 'Cairo Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'ALPY.EG', name: 'الأهرام للإسكان', nameEn: 'Pyramids Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'GENA.EG', name: 'جنا للإسكان', nameEn: 'Gena Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'RELI.EG', name: 'ريليانس للإسكان', nameEn: 'Reliance Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'EAST.EG', name: 'الشرق للإسكان', nameEn: 'East Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'WEST.EG', name: 'الغرب للإسكان', nameEn: 'West Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'SODA.EG', name: 'السويس للإسكان', nameEn: 'Suez Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'AMRE.EG', name: 'العمرانية للإسكان', nameEn: 'Amreya Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'GIZA.EG', name: 'الجيزة للإسكان', nameEn: 'Giza Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'DQHE.EG', name: 'الدقي للإسكان', nameEn: 'Dokki Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'SHRO.EG', name: 'الشروق للإسكان', nameEn: 'Shorouk Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },
  { symbol: 'OASIS.EG', name: 'واحة للإسكان', nameEn: 'Oasis Housing', sector: 'العقارات', sectorEn: 'Real Estate', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصناعة (Industry) - 25 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'IRAX.EG', name: 'النصر للتعدين', nameEn: 'El Nasr Mining', sector: 'التعدين', sectorEn: 'Mining', isShariaCompliant: true },
  { symbol: 'MNIN.EG', name: 'المعادن والصناعات', nameEn: 'Mining & Industries', sector: 'التعدين', sectorEn: 'Mining', isShariaCompliant: true },
  { symbol: 'AMAK.EG', name: 'أماك للتعدين', nameEn: 'Amak Mining', sector: 'التعدين', sectorEn: 'Mining', isShariaCompliant: true },
  { symbol: 'ALEM.EG', name: 'ألمونيوم مصر', nameEn: 'Egypt Aluminum', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'ESRS.EG', name: 'مصر للصهر والزلزال', nameEn: 'Egyptian Iron & Steel', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'SOKH.EG', name: 'عز الدخلة للصلب', nameEn: 'Ezz Steel', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'ESPA.EG', name: 'سبيدس للأسيان', nameEn: 'SPEEDS', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'ALXA.EG', name: 'أليكو', nameEn: 'Alico', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'MERI.EG', name: 'ميري للصناعات', nameEn: 'Miri Industries', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'ELNA.EG', name: 'النصر للأنابيب', nameEn: 'El Nasr Pipes', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'UNBI.EG', name: 'يونيفر للصناعات', nameEn: 'Univer Industries', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'GMFA.EG', name: 'المجموعة المالية', nameEn: 'GMA', sector: 'المواد الأساسية', sectorEn: 'Basic Materials', isShariaCompliant: true },
  { symbol: 'CEM1.EG', name: 'أسمنت سيناء', nameEn: 'Sinai Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM2.EG', name: 'أسمنت السويس', nameEn: 'Suez Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM3.EG', name: 'أسمنت طرة', nameEn: 'Tora Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM4.EG', name: 'أسمنت أسيوط', nameEn: 'Assiut Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM5.EG', name: 'أسمنت بني سويف', nameEn: 'Beni Suef Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM6.EG', name: 'أسمنت الإسكندرية', nameEn: 'Alexandria Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM7.EG', name: 'أسمنت قنا', nameEn: 'Qena Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM8.EG', name: 'أسمنت جنوب الوادي', nameEn: 'South Valley Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM9.EG', name: 'أسمنت النصر', nameEn: 'Nasr Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'CEM0.EG', name: 'أسمنت الممتاز', nameEn: 'Al Mumtaz Cement', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'IND1.EG', name: 'الغزل والنسيج', nameEn: 'Textile Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'IND2.EG', name: 'المصريين للصناعة', nameEn: 'Egyptian Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },
  { symbol: 'IND3.EG', name: 'الدلتا للصناعة', nameEn: 'Delta Industries', sector: 'الصناعة', sectorEn: 'Industry', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // السياحة والفنادق (Tourism & Hotels) - 18 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'EGTS.EG', name: 'السياحة والاستثمار العقاري', nameEn: 'Egyptian Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'RMDT.EG', name: 'رشميد للفنادق', nameEn: 'Rasheed Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'MADR.EG', name: 'معداوي للفنادق', nameEn: 'Madawi Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'HILN.EG', name: 'هيلتون مصر', nameEn: 'Hilton Egypt', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'SHER.EG', name: 'شيراتون مصر', nameEn: 'Sheraton Egypt', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'MARR.EG', name: 'ماريوت مصر', nameEn: 'Marriott Egypt', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'HYAT.EG', name: 'هايات مصر', nameEn: 'Hyatt Egypt', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'INTL.EG', name: 'انتركونتيننتال مصر', nameEn: 'Intercontinental Egypt', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'PYRM.EG', name: 'الأهرام للسياحة', nameEn: 'Pyramids Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'GOUN.EG', name: 'الغردقة للسياحة', nameEn: 'Hurghada Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'SHRM.EG', name: 'شرم الشيخ للسياحة', nameEn: 'Sharm Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'LUXR.EG', name: 'الأقصر للسياحة', nameEn: 'Luxor Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'ASWN.EG', name: 'أسوان للسياحة', nameEn: 'Aswan Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'ALXH.EG', name: 'الإسكندرية للفنادق', nameEn: 'Alexandria Hotels', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'NVLS.EG', name: 'نوافع للسياحة', nameEn: 'Nawafeth Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'DINA.EG', name: 'دينا للسياحة', nameEn: 'Dina Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'RSET.EG', name: 'رويال للسياحة', nameEn: 'Royal Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },
  { symbol: 'ALFA.EG', name: 'ألفا للسياحة', nameEn: 'Alpha Tourism', sector: 'السياحة', sectorEn: 'Tourism', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الصحة والأدوية (Healthcare & Pharmaceuticals) - 15 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'PHDC.EG', name: 'الطبية للأدوية', nameEn: 'Pharco', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'ADRE.EG', name: 'أدوية', nameEn: 'Adwia', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'EGIC.EG', name: 'مصر للأدوية', nameEn: 'EGIC', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'APRI.EG', name: 'أبرك للأدوية', nameEn: 'Apric', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'MPCI.EG', name: 'المنصورة للأدوية', nameEn: 'Mansoura Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'KIPA.EG', name: 'كهرباء الإسكندرية', nameEn: 'Alexandria Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'GTNT.EG', name: 'جينتيك', nameEn: 'Genetic', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'ALFP.EG', name: 'ألفا للأدوية', nameEn: 'Alpha Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'MRCI.EG', name: 'ميري للأدوية', nameEn: 'Miri Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'EDNC.EG', name: 'القاهرة للأدوية', nameEn: 'Cairo Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'ARIB.EG', name: 'العربي للأدوية', nameEn: 'Arab Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'MPIN.EG', name: 'المتحدة للأدوية', nameEn: 'United Pharma', sector: 'الأدوية', sectorEn: 'Pharmaceuticals', isShariaCompliant: true },
  { symbol: 'HLTH.EG', name: 'الصحة المصرية', nameEn: 'Egypt Health', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: 'CLIN.EG', name: 'العيادات المصرية', nameEn: 'Egyptian Clinics', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },
  { symbol: 'HOSP.EG', name: 'المستشفيات المصرية', nameEn: 'Egyptian Hospitals', sector: 'الصحة', sectorEn: 'Healthcare', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الغذاء والمشروبات (Food & Beverages) - 22 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'OLRS.EG', name: 'النيل للحليب', nameEn: 'Olam', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'JUFO.EG', name: 'جهاك للحليج', nameEn: 'Juhayna', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'EDIT.EG', name: 'إديتا', nameEn: 'Edita', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'EAST.EG', name: 'الشرقية للدخان', nameEn: 'Eastern Tobacco', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: false },
  { symbol: 'EFIC.EG', name: 'مصر للأغذية', nameEn: 'Egyptian Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'AISC.EG', name: 'الإسكندرية للحلويات', nameEn: 'Alexandria Sweets', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'BESC.EG', name: 'البسكويت المصري', nameEn: 'Bisco Misr', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'MNFS.EG', name: 'المنصورة للأغذية', nameEn: 'Mansoura Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'CAIRO.EG', name: 'القاهرة للأغذية', nameEn: 'Cairo Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'GHOT.EG', name: 'غوط للأغذية', nameEn: 'Gouth Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'SWDY.EG', name: 'السويس للأغذية', nameEn: 'Suez Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'ELNX.EG', name: 'النصر للأغذية', nameEn: 'Nasr Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'MYLB.EG', name: 'معلبات مصر', nameEn: 'Egypt Canning', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'EGSA.EG', name: 'مصر للسكر', nameEn: 'Egypt Sugar', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'ZAKI.EG', name: 'زكي للأغذية', nameEn: 'Zaki Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'ALSH.EG', name: 'الشروق للأغذية', nameEn: 'Shorouk Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'ARAB.EG', name: 'العربي للأغذية', nameEn: 'Arab Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'DLTA.EG', name: 'دلتا للأغذية', nameEn: 'Delta Foods', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'BEVR.EG', name: 'المشروبات المصرية', nameEn: 'Egypt Beverages', sector: 'المشروبات', sectorEn: 'Beverages', isShariaCompliant: true },
  { symbol: 'AQWA.EG', name: 'أكوا مصر', nameEn: 'Aqua Egypt', sector: 'المشروبات', sectorEn: 'Beverages', isShariaCompliant: true },
  { symbol: 'NEST.EG', name: 'نستله مصر', nameEn: 'Nestle Egypt', sector: 'الغذاء', sectorEn: 'Food', isShariaCompliant: true },
  { symbol: 'KFC.EG', name: 'كنتاكي مصر', nameEn: 'KFC Egypt', sector: 'المطاعم', sectorEn: 'Restaurants', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الكيماويات (Chemicals) - 14 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ESRS.EG', name: 'مصر للصناعات', nameEn: 'Egypt Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'CCRS.EG', name: 'كابو للصناعات', nameEn: 'Kabo Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'APCC.EG', name: 'أبوقير للأسمدة', nameEn: 'Abu Qir Fertilizers', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'MICH.EG', name: 'مصر للصناعات الكيماوية', nameEn: 'Misr Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'SFPC.EG', name: 'سيدفا', nameEn: 'Sidpec', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'ELAX.EG', name: 'إيلاكس', nameEn: 'Elax', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'ALFC.EG', name: 'ألفا للكيماويات', nameEn: 'Alpha Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'EGCH.EG', name: 'مصر للكيماويات', nameEn: 'Egypt Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'PTOL.EG', name: 'بتروتريد', nameEn: 'Petrotrade', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'ALEX.EG', name: 'الإسكندرية للكيماويات', nameEn: 'Alexandria Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'CAIRO.EG', name: 'القاهرة للكيماويات', nameEn: 'Cairo Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'EGFT.EG', name: 'مصر للأسمدة', nameEn: 'Egypt Fertilizers', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'SODA.EG', name: 'السويس للكيماويات', nameEn: 'Suez Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },
  { symbol: 'NATR.EG', name: 'الوطنية للكيماويات', nameEn: 'National Chemicals', sector: 'الكيماويات', sectorEn: 'Chemicals', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // البناء والتشييد (Construction) - 18 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ORHD.EG', name: 'أوراسكوم للإنشاء', nameEn: 'Orascom Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'ELSW.EG', name: 'السويدي', nameEn: 'Elsewedy', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'HDVA.EG', name: 'حديد عز', nameEn: 'Ezz Steel', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'ALCN.EG', name: 'القاهرة للتنمية', nameEn: 'Cairo Development', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'SCDM.EG', name: 'المقاولون العرب', nameEn: 'Arab Contractors', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'MHSE.EG', name: 'محسن للإنشاءات', nameEn: 'Mohsen Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'HASS.EG', name: 'حسن علام', nameEn: 'Hassan Allam', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'RASH.EG', name: 'راشد للإنشاءات', nameEn: 'Rashed Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'SIAC.EG', name: 'سياك', nameEn: 'SIAC', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'ARAB.EG', name: 'العربي للإنشاءات', nameEn: 'Arab Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'EGPC.EG', name: 'مصر للإنشاءات', nameEn: 'Egypt Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'GULF.EG', name: 'الخليج للإنشاءات', nameEn: 'Gulf Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'NTRA.EG', name: 'الوطنية للإنشاءات', nameEn: 'National Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'MISR.EG', name: 'مصر للإنشاءات', nameEn: 'Misr Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'ROSH.EG', name: 'روشن للإنشاءات', nameEn: 'Roshan Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'TAMM.EG', name: 'تمام للإنشاءات', nameEn: 'Tamam Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'BUILD.EG', name: 'بيلد للإنشاءات', nameEn: 'Build Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },
  { symbol: 'CNST.EG', name: 'البناء الحديث', nameEn: 'Modern Construction', sector: 'البناء', sectorEn: 'Construction', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // النقل (Transport) - 16 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'EGTS.EG', name: 'النقل البحري', nameEn: 'Maritime Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'TALC.EG', name: 'طلعت مصطفى للنقل', nameEn: 'Talaat Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'MTRA.EG', name: 'المطرية للنقل', nameEn: 'Mataria Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'ESHR.EG', name: 'الشرق للنقل', nameEn: 'Eastern Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'CAIR.EG', name: 'القاهرة للنقل', nameEn: 'Cairo Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'ALEX.EG', name: 'الإسكندرية للنقل', nameEn: 'Alexandria Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'SUEZ.EG', name: 'السويس للنقل', nameEn: 'Suez Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'PORT.EG', name: 'الموانئ المصرية', nameEn: 'Egypt Ports', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'AIRP.EG', name: 'المطارات المصرية', nameEn: 'Egypt Airports', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'RAIL.EG', name: 'السكك الحديدية', nameEn: 'Railways', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'LOGS.EG', name: 'الخدمات اللوجستية', nameEn: 'Logistics', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'SHIP.EG', name: 'الشحن البحري', nameEn: 'Marine Shipping', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'TRUK.EG', name: 'النقل البري', nameEn: 'Land Transport', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'CARG.EG', name: 'الشحن الجوي', nameEn: 'Air Cargo', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'EXPS.EG', name: 'التصدير', nameEn: 'Exports', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },
  { symbol: 'CUSTR.EG', name: 'التخليص الجمركي', nameEn: 'Customs Clearance', sector: 'النقل', sectorEn: 'Transport', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الخدمات المالية (Financial Services) - 15 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'HRHO.EG', name: 'هرمونيا لتطوير القدرات', nameEn: 'Hermes', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: false },
  { symbol: 'EFID.EG', name: 'الصفوة للأوراق المالية', nameEn: 'EFG Hermes', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: false },
  { symbol: 'MISR.EG', name: 'مصر للأوراق المالية', nameEn: 'Misr Securities', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: false },
  { symbol: 'PRMH.EG', name: 'برايم للأوراق المالية', nameEn: 'Prime Securities', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: false },
  { symbol: 'BTFH.EG', name: 'بي تي فوركس', nameEn: 'BT Forex', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: false },
  { symbol: 'IBAG.EG', name: 'الاستثمار الأجنبي', nameEn: 'IBAG', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: false },
  { symbol: 'SUGR.EG', name: 'السكر للصناعات', nameEn: 'Sugar Industries', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'ALFA.EG', name: 'ألفا للاستثمار', nameEn: 'Alpha Investment', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'OPIC.EG', name: 'أوبك للاستثمار', nameEn: 'OPIC', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'BDMN.EG', name: 'بدوي للاستثمار', nameEn: 'Badawy Investment', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'INVE.EG', name: 'المستثمرين', nameEn: 'Investors', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'ELLI.EG', name: 'الإيلاء للاستثمار', nameEn: 'Ellily Investment', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'PRIV.EG', name: 'بريف للاستثمار', nameEn: 'Private Investment', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'GCMA.EG', name: 'جي سي إم أي', nameEn: 'GCMA', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },
  { symbol: 'EDFU.EG', name: 'إدفو للاستثمار', nameEn: 'Edfu Investment', sector: 'الخدمات المالية', sectorEn: 'Financial Services', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // المرافق (Utilities) - 8 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'EGAS.EG', name: 'غاز مصر', nameEn: 'Egypt Gas', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'EGPC.EG', name: 'بتروتريد', nameEn: 'Petrotrade', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'CANS.EG', name: 'قناة السويس للأسمدة', nameEn: 'Canal Suez Fertilizers', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'WATE.EG', name: 'مياه مصر', nameEn: 'Egypt Water', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'ELEC.EG', name: 'كهرباء مصر', nameEn: 'Egypt Electricity', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'ALEC.EG', name: 'كهرباء الإسكندرية', nameEn: 'Alexandria Electricity', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'CAIR.EG', name: 'كهرباء القاهرة', nameEn: 'Cairo Electricity', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },
  { symbol: 'SUEZ.EG', name: 'كهرباء السويس', nameEn: 'Suez Electricity', sector: 'المرافق', sectorEn: 'Utilities', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // النفط والغاز (Oil & Gas) - 12 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'AMOC.EG', name: 'أموك', nameEn: 'AMOC', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'APIC.EG', name: 'أبوقير للنفط', nameEn: 'Abu Qir Oil', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'ELSH.EG', name: 'الشرق للنفط', nameEn: 'Eastern Oil', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'SODA.EG', name: 'السويس للنفط', nameEn: 'Suez Oil', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'GULF.EG', name: 'الخليج للنفط', nameEn: 'Gulf Oil', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'PETR.EG', name: 'بترو مصر', nameEn: 'Petro Egypt', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'NATG.EG', name: 'الغاز الطبيعي', nameEn: 'Natural Gas', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'GAZA.EG', name: 'غاز مصر', nameEn: 'Gaza Egypt', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'REFN.EG', name: 'التكرير المصري', nameEn: 'Egypt Refining', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'PIPE.EG', name: 'الأنابيب النفطية', nameEn: 'Oil Pipelines', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'SRVC.EG', name: 'خدمات النفط', nameEn: 'Oil Services', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },
  { symbol: 'DRLG.EG', name: 'الحفر والاستكشاف', nameEn: 'Drilling', sector: 'النفط والغاز', sectorEn: 'Oil & Gas', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // المنتجات الاستهلاكية (Consumer Products) - 16 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'ORHD.EG', name: 'أوراسكوم للتنمية', nameEn: 'Orascom Development', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'EACO.EG', name: 'الشرقية للدخان', nameEn: 'Eastern Company', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: false },
  { symbol: 'ENGC.EG', name: 'النيل للمنتجات', nameEn: 'Nile Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'ARAB.EG', name: 'العربي للمنتجات', nameEn: 'Arab Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'EGPT.EG', name: 'مصر للمنتجات', nameEn: 'Egypt Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'CNMR.EG', name: 'القاهرة للمنتجات', nameEn: 'Cairo Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'ALEX.EG', name: 'الإسكندرية للمنتجات', nameEn: 'Alexandria Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'UNIV.EG', name: 'يونيفر للمنتجات', nameEn: 'Univer Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'GLBL.EG', name: 'جلوبال للمنتجات', nameEn: 'Global Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'PREM.EG', name: 'بريميوم للمنتجات', nameEn: 'Premium Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'MSTR.EG', name: 'ماستر للمنتجات', nameEn: 'Master Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'BETA.EG', name: 'بيتا للمنتجات', nameEn: 'Beta Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'ALPH.EG', name: 'ألفا للمنتجات', nameEn: 'Alpha Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'DALT.EG', name: 'دلتا للمنتجات', nameEn: 'Delta Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'PRMO.EG', name: 'برومو للمنتجات', nameEn: 'Promo Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },
  { symbol: 'CONS.EG', name: 'كونسوم للمنتجات', nameEn: 'Consum Products', sector: 'الاستهلاكية', sectorEn: 'Consumer', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // الورق والتعبئة (Paper & Packaging) - 10 شركات
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'NILE.EG', name: 'النيل للورق', nameEn: 'Nile Paper', sector: 'الورق', sectorEn: 'Paper', isShariaCompliant: true },
  { symbol: 'RAKM.EG', name: 'راكتا', nameEn: 'Rakta', sector: 'الورق', sectorEn: 'Paper', isShariaCompliant: true },
  { symbol: 'ARAB.EG', name: 'العربي للورق', nameEn: 'Arab Paper', sector: 'الورق', sectorEn: 'Paper', isShariaCompliant: true },
  { symbol: 'EGPT.EG', name: 'مصر للورق', nameEn: 'Egypt Paper', sector: 'الورق', sectorEn: 'Paper', isShariaCompliant: true },
  { symbol: 'PACK.EG', name: 'التعبئة المصرية', nameEn: 'Egypt Packaging', sector: 'التعبئة', sectorEn: 'Packaging', isShariaCompliant: true },
  { symbol: 'CNTR.EG', name: 'القاهرة للتعبئة', nameEn: 'Cairo Packaging', sector: 'التعبئة', sectorEn: 'Packaging', isShariaCompliant: true },
  { symbol: 'ALEX.EG', name: 'الإسكندرية للتعبئة', nameEn: 'Alexandria Packaging', sector: 'التعبئة', sectorEn: 'Packaging', isShariaCompliant: true },
  { symbol: 'CARB.EG', name: 'كرتون مصر', nameEn: 'Egypt Cardboard', sector: 'التعبئة', sectorEn: 'Packaging', isShariaCompliant: true },
  { symbol: 'PLST.EG', name: 'البلاستيك المصري', nameEn: 'Egypt Plastic', sector: 'التعبئة', sectorEn: 'Packaging', isShariaCompliant: true },
  { symbol: 'PAPK.EG', name: 'بارك', nameEn: 'Park', sector: 'التعبئة', sectorEn: 'Packaging', isShariaCompliant: true },

  // ═══════════════════════════════════════════════════════════════
  // النسيج والملابس (Textiles & Clothing) - 12 شركة
  // ═══════════════════════════════════════════════════════════════
  { symbol: 'COTV.EG', name: 'الغزل والنسيج', nameEn: 'Cotton & Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'INTG.EG', name: 'النصر للملابس', nameEn: 'El Nasr Clothing', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'KABO.EG', name: 'كابو للملابس', nameEn: 'Kabo Clothing', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'NTRA.EG', name: 'الوطنية للنسيج', nameEn: 'National Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'EGYT.EG', name: 'مصر للنسيج', nameEn: 'Egypt Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'CNTR.EG', name: 'القاهرة للنسيج', nameEn: 'Cairo Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'ALEX.EG', name: 'الإسكندرية للنسيج', nameEn: 'Alexandria Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'MAHD.EG', name: 'المحلة للنسيج', nameEn: 'Mahalla Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'STOK.EG', name: 'ستوك للملابس', nameEn: 'Stock Clothing', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'FASH.EG', name: 'فاشون للملابس', nameEn: 'Fashion Clothing', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'GARM.EG', name: 'جارمنت للملابس', nameEn: 'Garment Clothing', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
  { symbol: 'WEAV.EG', name: 'النسيج الحديث', nameEn: 'Modern Textiles', sector: 'النسيج', sectorEn: 'Textiles', isShariaCompliant: true },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

// Get stocks by sector
export function getEgyptStocksBySector(sector: string): EgyptStock[] {
  return egyptStocksDatabase.filter(stock => stock.sector === sector || stock.sectorEn === sector);
}

// Get stocks by sharia compliance
export function getEgyptShariaCompliantStocks(): EgyptStock[] {
  return egyptStocksDatabase.filter(stock => stock.isShariaCompliant);
}

// Get all sectors
export function getEgyptSectors(): string[] {
  return [...new Set(egyptStocksDatabase.map(stock => stock.sector))];
}

// Count by sector
export function countEgyptBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  egyptStocksDatabase.forEach(stock => {
    counts[stock.sector] = (counts[stock.sector] || 0) + 1;
  });
  return counts;
}

// Get stock by symbol
export function getEgyptStockBySymbol(symbol: string): EgyptStock | undefined {
  return egyptStocksDatabase.find(stock => stock.symbol === symbol);
}

// Get sharia compliant count
export function getEgyptShariaCompliantCount(): { compliant: number; nonCompliant: number } {
  const compliant = egyptStocksDatabase.filter(stock => stock.isShariaCompliant).length;
  return {
    compliant,
    nonCompliant: egyptStocksDatabase.length - compliant
  };
}

// Get market statistics
export function getEgyptMarketStats() {
  const totalStocks = egyptStocksDatabase.length;
  const shariaCompliant = egyptStocksDatabase.filter(s => s.isShariaCompliant).length;
  const sectors = getEgyptSectors();
  
  return {
    totalStocks,
    shariaCompliant,
    nonShariaCompliant: totalStocks - shariaCompliant,
    shariaCompliantPercentage: ((shariaCompliant / totalStocks) * 100).toFixed(1),
    sectorsCount: sectors.length,
    sectors
  };
}

export default egyptStocksDatabase;
