/**
 * Account & Platform API Registry
 *
 * مكمّل للـ Market Hub — يخصّ النطاقات غير السوقية:
 *   - الملف الشخصي، الإعدادات، كلمة المرور، المصادقة.
 *   - قوائم المراقبة، التنبيهات، المحافظ، الأخبار، الذكاء الاصطناعي.
 *   - الأدوات الإدارية (admin, access, purification, screener ...).
 *
 * نفس الفلسفة: مصدر حقيقة واحد لربط الصفحات بـ APIs الخاصة بها، بحيث أي
 * تغيير في endpoint يتم في مكان واحد، وأي صفحة جديدة تستهلك السجل مباشرة.
 */

export type AccountDomain =
  | 'profile'
  | 'profile_password'
  | 'settings'
  | 'auth'
  | 'watchlists'
  | 'alerts'
  | 'notifications'
  | 'portfolios'
  | 'news'
  | 'ai'
  | 'screener'
  | 'purification'
  | 'monitoring'
  | 'admin'
  | 'access'
  | 'chart'
  | 'sharia_lookup';

export interface AccountRegistryEntry {
  id: AccountDomain;
  labelAr: string;
  labelEn: string;
  endpoint: string;
  /** الطرق المدعومة. */
  methods: readonly ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  /** هل تحتاج صلاحية RBAC معيّنة. */
  requiresAuth: boolean;
  /** الصفحات التي تستهلك هذا الـ endpoint. */
  pages: readonly string[];
  description: string;
}

export const ACCOUNT_DOMAINS: Record<AccountDomain, AccountRegistryEntry> = {
  profile: {
    id: 'profile',
    labelAr: 'الملف الشخصي',
    labelEn: 'Profile',
    endpoint: '/api/profile',
    methods: ['GET', 'PUT', 'PATCH'],
    requiresAuth: true,
    pages: ['/profile'],
    description: 'بيانات المستخدم الشخصية، الصورة، اللغة، المنطقة الزمنية.',
  },
  profile_password: {
    id: 'profile_password',
    labelAr: 'كلمة المرور',
    labelEn: 'Password',
    endpoint: '/api/profile/password',
    methods: ['POST', 'PUT'],
    requiresAuth: true,
    pages: ['/profile'],
    description: 'تغيير كلمة المرور.',
  },
  settings: {
    id: 'settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    endpoint: '/api/settings',
    methods: ['GET', 'PUT'],
    requiresAuth: true,
    pages: ['/settings', '/profile'],
    description: 'تفضيلات المستخدم، الإشعارات، العرض، الضرائب، السياسات.',
  },
  auth: {
    id: 'auth',
    labelAr: 'المصادقة',
    labelEn: 'Auth',
    endpoint: '/api/auth',
    methods: ['POST', 'GET'],
    requiresAuth: false,
    pages: ['/login', '/register', '/logout'],
    description: 'تسجيل الدخول/الخروج/التسجيل/تحديث الجلسة.',
  },
  watchlists: {
    id: 'watchlists',
    labelAr: 'قوائم المراقبة',
    labelEn: 'Watchlists',
    endpoint: '/api/watchlists',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    pages: ['/watchlist', '/heatmap', '/stocks'],
    description: 'قوائم المراقبة الشخصية وإضافة/حذف الرموز.',
  },
  alerts: {
    id: 'alerts',
    labelAr: 'التنبيهات',
    labelEn: 'Alerts',
    endpoint: '/api/monitoring/alert-settings',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    pages: ['/alerts', '/profile'],
    description: 'تنبيهات الأسعار والأحداث.',
  },
  notifications: {
    id: 'notifications',
    labelAr: 'الإشعارات',
    labelEn: 'Notifications',
    endpoint: '/api/monitoring/metrics',
    methods: ['GET'],
    requiresAuth: true,
    pages: ['/notifications', '/profile'],
    description: 'سجل الإشعارات.',
  },
  portfolios: {
    id: 'portfolios',
    labelAr: 'المحافظ',
    labelEn: 'Portfolios',
    endpoint: '/api/portfolios',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    pages: ['/', '/portfolio', '/stocks', '/funds', '/crypto', '/forex', '/bonds'],
    description: 'محافظ المستخدم وحيازاته عبر كل فئات الأصول.',
  },
  news: {
    id: 'news',
    labelAr: 'الأخبار',
    labelEn: 'News',
    endpoint: '/api/news',
    methods: ['GET'],
    requiresAuth: false,
    pages: ['/news', '/'],
    description: 'موجز الأخبار المالية.',
  },
  ai: {
    id: 'ai',
    labelAr: 'المساعد الذكي',
    labelEn: 'AI Assistant',
    endpoint: '/api/ai',
    methods: ['POST'],
    requiresAuth: true,
    pages: ['/ai', '/analysis'],
    description: 'تحليل ذكي، توصيات، محادثة.',
  },
  screener: {
    id: 'screener',
    labelAr: 'المرشّح',
    labelEn: 'Screener',
    endpoint: '/api/screener',
    methods: ['GET', 'POST'],
    requiresAuth: true,
    pages: ['/screener'],
    description: 'مرشّح الأسهم والصناديق حسب معايير مخصّصة.',
  },
  purification: {
    id: 'purification',
    labelAr: 'تطهير الأرباح',
    labelEn: 'Purification',
    endpoint: '/api/purification',
    methods: ['GET', 'POST'],
    requiresAuth: true,
    pages: ['/purification', '/profile'],
    description: 'حساب مقدار التطهير الشرعي.',
  },
  monitoring: {
    id: 'monitoring',
    labelAr: 'المراقبة',
    labelEn: 'Monitoring',
    endpoint: '/api/monitoring/metrics',
    methods: ['GET'],
    requiresAuth: true,
    pages: ['/alerts', '/monitoring'],
    description: 'نظام مراقبة الأسعار والأحداث.',
  },
  admin: {
    id: 'admin',
    labelAr: 'الإدارة',
    labelEn: 'Admin',
    endpoint: '/api/admin/stats',
    methods: ['GET'],
    requiresAuth: true,
    pages: ['/admin'],
    description: 'أدوات المشرف — المستخدمون، السجلات، الصحة.',
  },
  access: {
    id: 'access',
    labelAr: 'الصلاحيات',
    labelEn: 'Access Control',
    endpoint: '/api/access',
    methods: ['GET', 'POST', 'PUT'],
    requiresAuth: true,
    pages: ['/admin', '/settings'],
    description: 'إدارة الأدوار والصلاحيات (RBAC).',
  },
  chart: {
    id: 'chart',
    labelAr: 'الرسوم البيانية',
    labelEn: 'Chart',
    endpoint: '/api/chart',
    methods: ['GET'],
    requiresAuth: false,
    pages: ['/chart', '/technical-analysis', '/stocks'],
    description: 'بيانات الشموع والرسوم البيانية التاريخية.',
  },
  sharia_lookup: {
    id: 'sharia_lookup',
    labelAr: 'الفحص الشرعي',
    labelEn: 'Sharia Lookup',
    endpoint: '/api/sharia-lookup',
    methods: ['GET'],
    requiresAuth: false,
    pages: ['/heatmap', '/stocks', '/screener'],
    description: 'البحث عن حكم شرعي لسهم معيّن.',
  },
};

export const ALL_ACCOUNT_DOMAINS: readonly AccountDomain[] = Object.keys(
  ACCOUNT_DOMAINS,
) as AccountDomain[];

export function getAccountDomain(id: AccountDomain): AccountRegistryEntry {
  return ACCOUNT_DOMAINS[id];
}

export function isKnownAccountDomain(value: string): value is AccountDomain {
  return value in ACCOUNT_DOMAINS;
}
