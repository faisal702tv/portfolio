/**
 * Pages Registry — Single Source of Truth لكل صفحات المشروع
 *
 * يربط كل صفحة (route) بـ:
 *   - نطاقات بيانات السوق التي تستهلكها (MarketDomain[])
 *   - نطاقات APIs الحساب/المنصّة (AccountDomain[])
 *   - مصنّفها، أيقونتها، صلاحيات الوصول إليها.
 *
 * الفائدة:
 *   - صفحة `/api-registry` تعرض ربطاً ثنائي الاتجاه (من/إلى الـ API).
 *   - عند إضافة صفحة جديدة → تُضاف مدخلة واحدة هنا، فترث البحث والربط
 *     مع المصادر تلقائياً.
 *   - يمكن بناء تنقّل ذكي، خريطة الموقع، وتقارير الاعتماديات من هنا.
 */

import type { MarketDomain } from './types';
import type { AccountDomain } from './account-registry';

export type PageCategory =
  | 'dashboard'
  | 'markets'
  | 'portfolio'
  | 'analysis'
  | 'tools'
  | 'education'
  | 'account'
  | 'admin'
  | 'auth';

export interface PageEntry {
  /** المسار الحرفي (قد يحتوي على [param]). */
  path: string;
  labelAr: string;
  labelEn: string;
  category: PageCategory;
  description: string;
  /** نطاقات بيانات السوق التي تستهلكها هذه الصفحة. */
  marketDomains?: readonly MarketDomain[];
  /** نطاقات الحساب / المنصّة التي تستهلكها. */
  accountDomains?: readonly AccountDomain[];
  /** هل الصفحة مقتصرة على دور معيّن. */
  requiredRole?: 'admin' | 'user' | 'guest';
  /** ديناميكية (تحتوي [param]). */
  dynamic?: boolean;
}

export const PAGES: PageEntry[] = [
  // ============================================================
  // Auth / Onboarding
  // ============================================================
  {
    path: '/login',
    labelAr: 'تسجيل الدخول',
    labelEn: 'Login',
    category: 'auth',
    description: 'تسجيل الدخول / إنشاء حساب.',
    accountDomains: ['auth'],
    requiredRole: 'guest',
  },
  {
    path: '/onboarding',
    labelAr: 'الإعداد الأولي',
    labelEn: 'Onboarding',
    category: 'auth',
    description: 'إعداد الملف الشخصي ومحفظة البداية.',
    accountDomains: ['auth', 'profile', 'settings', 'portfolios'],
  },

  // ============================================================
  // Dashboard
  // ============================================================
  {
    path: '/',
    labelAr: 'لوحة التحكم الرئيسية',
    labelEn: 'Dashboard',
    category: 'dashboard',
    description: 'نظرة عامة موحّدة على المحفظة والأسواق والأخبار.',
    marketDomains: ['indices', 'stocks', 'crypto', 'forex', 'commodities'],
    accountDomains: ['portfolios', 'news', 'alerts'],
  },
  {
    path: '/performance',
    labelAr: 'الأداء',
    labelEn: 'Performance',
    category: 'dashboard',
    description: 'تحليل أداء المحفظة عبر الزمن.',
    marketDomains: ['stocks', 'crypto', 'forex', 'funds'],
    accountDomains: ['portfolios'],
  },

  // ============================================================
  // Markets
  // ============================================================
  {
    path: '/markets',
    labelAr: 'جميع الأسواق',
    labelEn: 'All Markets',
    category: 'markets',
    description: 'لوحة موحّدة لكل الأسواق العالمية.',
    marketDomains: ['stocks', 'indices', 'crypto', 'forex', 'commodities', 'metals', 'energy'],
  },
  {
    path: '/markets/[market]',
    labelAr: 'سوق فردي',
    labelEn: 'Single Market',
    category: 'markets',
    description: 'تفاصيل سوق واحد (TASI, NYSE, ...).',
    marketDomains: ['stocks', 'indices'],
    dynamic: true,
  },
  {
    path: '/market',
    labelAr: 'السوق',
    labelEn: 'Market',
    category: 'markets',
    description: 'صفحة السوق الرئيسية.',
    marketDomains: ['stocks', 'indices'],
  },
  {
    path: '/market-actions',
    labelAr: 'إجراءات السوق',
    labelEn: 'Market Actions',
    category: 'markets',
    description: 'الإجراءات والأحداث السوقية.',
    accountDomains: ['chart'],
  },
  {
    path: '/us-market',
    labelAr: 'السوق الأمريكي',
    labelEn: 'US Market',
    category: 'markets',
    description: 'الأسهم والمؤشرات الأمريكية.',
    marketDomains: ['stocks', 'indices'],
  },
  {
    path: '/heatmap',
    labelAr: 'الخريطة الحرارية',
    labelEn: 'Heatmap',
    category: 'markets',
    description: 'خريطة حرارية لأداء الأسواق مع الفحص الشرعي.',
    marketDomains: ['stocks', 'saudi'],
    accountDomains: ['watchlists', 'sharia_lookup'],
  },
  {
    path: '/stocks',
    labelAr: 'الأسهم',
    labelEn: 'Stocks',
    category: 'markets',
    description: 'الأسهم في المحفظة + أسعار مباشرة.',
    marketDomains: ['stocks'],
    accountDomains: ['portfolios', 'watchlists', 'chart'],
  },
  {
    path: '/crypto',
    labelAr: 'العملات المشفرة',
    labelEn: 'Crypto',
    category: 'markets',
    description: 'العملات المشفرة في المحفظة + أسعار CoinGecko.',
    marketDomains: ['crypto'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/crypto-buy',
    labelAr: 'شراء عملات مشفرة',
    labelEn: 'Buy Crypto',
    category: 'markets',
    description: 'إضافة عملات مشفرة إلى المحفظة.',
    marketDomains: ['crypto'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/forex',
    labelAr: 'العملات الأجنبية',
    labelEn: 'Forex',
    category: 'markets',
    description: 'أزواج العملات.',
    marketDomains: ['forex'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/commodities',
    labelAr: 'السلع',
    labelEn: 'Commodities',
    category: 'markets',
    description: 'السلع والمعادن والطاقة.',
    marketDomains: ['commodities', 'metals', 'energy'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/commodities-buy',
    labelAr: 'شراء سلع',
    labelEn: 'Buy Commodities',
    category: 'markets',
    description: 'إضافة سلع إلى المحفظة.',
    marketDomains: ['commodities', 'metals'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/bonds',
    labelAr: 'السندات والصكوك',
    labelEn: 'Bonds & Sukuk',
    category: 'markets',
    description: 'السندات السيادية والصكوك الإسلامية.',
    marketDomains: ['bonds', 'sukuk'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/funds',
    labelAr: 'الصناديق',
    labelEn: 'Funds',
    category: 'markets',
    description: 'الصناديق الاستثمارية، ETFs، REITs.',
    marketDomains: ['funds', 'etfs', 'reits'],
    accountDomains: ['portfolios'],
  },

  // ============================================================
  // Portfolio
  // ============================================================
  {
    path: '/portfolios',
    labelAr: 'إدارة المحافظ',
    labelEn: 'Portfolios',
    category: 'portfolio',
    description: 'إنشاء وإدارة محافظ متعددة.',
    accountDomains: ['portfolios'],
  },
  {
    path: '/consolidated-portfolio',
    labelAr: 'تجميع المحافظ',
    labelEn: 'Consolidated Portfolio',
    category: 'portfolio',
    description: 'عرض موحّد لكل المحافظ.',
    marketDomains: ['stocks', 'crypto', 'forex', 'funds', 'bonds', 'sukuk', 'commodities'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/watchlist',
    labelAr: 'قوائم المراقبة',
    labelEn: 'Watchlist',
    category: 'portfolio',
    description: 'قوائم المراقبة الشخصية.',
    marketDomains: ['stocks', 'crypto'],
    accountDomains: ['watchlists'],
  },
  {
    path: '/sell-history',
    labelAr: 'سجل البيع',
    labelEn: 'Sell History',
    category: 'portfolio',
    description: 'تاريخ عمليات البيع والأرباح المحققة.',
    accountDomains: ['portfolios'],
  },
  {
    path: '/dividends',
    labelAr: 'توزيعات الأرباح',
    labelEn: 'Dividends',
    category: 'portfolio',
    description: 'سجل توزيعات الأرباح والعائد.',
    marketDomains: ['stocks'],
    accountDomains: ['portfolios'],
  },

  // ============================================================
  // Analysis
  // ============================================================
  {
    path: '/technical-analysis',
    labelAr: 'التحليل الفنّي',
    labelEn: 'Technical Analysis',
    category: 'analysis',
    description: 'مؤشرات فنية، شموع، أنماط.',
    marketDomains: ['stocks', 'indices', 'crypto', 'forex'],
    accountDomains: ['chart'],
  },
  {
    path: '/technical-schools',
    labelAr: 'المدارس الفنية',
    labelEn: 'Technical Schools',
    category: 'analysis',
    description: 'استراتيجية AI تجمع إليوت ووايكوف والهارمونيك والكلاسيكي مع الشارت والمؤشرات.',
    marketDomains: ['stocks', 'indices', 'crypto', 'forex', 'commodities', 'funds'],
    accountDomains: ['ai', 'chart', 'portfolios'],
  },
  {
    path: '/fundamental-analysis',
    labelAr: 'التحليل الأساسي',
    labelEn: 'Fundamental Analysis',
    category: 'analysis',
    description: 'تحليل مالي، ميزانيات، نِسب.',
    marketDomains: ['stocks'],
    accountDomains: ['chart'],
  },
  {
    path: '/risk-analysis',
    labelAr: 'تحليل المخاطر',
    labelEn: 'Risk Analysis',
    category: 'analysis',
    description: 'مقاييس المخاطر، VaR، Sharpe.',
    marketDomains: ['stocks', 'crypto', 'forex', 'funds'],
    accountDomains: ['portfolios'],
  },
  {
    path: '/candlestick',
    labelAr: 'الشموع اليابانية',
    labelEn: 'Candlestick',
    category: 'analysis',
    description: 'رسوم الشموع التفاعلية.',
    marketDomains: ['stocks', 'crypto', 'forex'],
    accountDomains: ['chart'],
  },
  {
    path: '/corporate-actions',
    labelAr: 'إجراءات الشركات',
    labelEn: 'Corporate Actions',
    category: 'analysis',
    description: 'تجزئة، دمج، أرباح، رأسمال.',
    marketDomains: ['stocks'],
  },
  {
    path: '/earnings',
    labelAr: 'الأرباح الفصلية',
    labelEn: 'Earnings',
    category: 'analysis',
    description: 'تقارير أرباح الشركات.',
    marketDomains: ['stocks'],
  },
  {
    path: '/compare',
    labelAr: 'مقارنة',
    labelEn: 'Compare',
    category: 'analysis',
    description: 'مقارنة أصول جنباً إلى جنب.',
    marketDomains: ['stocks', 'crypto', 'forex', 'funds'],
  },
  {
    path: '/screener',
    labelAr: 'المرشّح',
    labelEn: 'Screener',
    category: 'analysis',
    description: 'فلترة الأسهم حسب معايير.',
    marketDomains: ['stocks'],
    accountDomains: ['screener', 'sharia_lookup'],
  },

  // ============================================================
  // AI
  // ============================================================
  {
    path: '/ai-analysis',
    labelAr: 'التحليل الذكي',
    labelEn: 'AI Analysis',
    category: 'analysis',
    description: 'تحليل مدعوم بالذكاء الاصطناعي.',
    accountDomains: ['ai'],
  },
  {
    path: '/ai-assistant',
    labelAr: 'المساعد الذكي',
    labelEn: 'AI Assistant',
    category: 'analysis',
    description: 'مساعد ذكي للاستفسارات المالية.',
    accountDomains: ['ai'],
  },
  {
    path: '/ai-chatbot',
    labelAr: 'روبوت محادثة',
    labelEn: 'AI Chatbot',
    category: 'analysis',
    description: 'محادثة تفاعلية.',
    accountDomains: ['ai'],
  },
  {
    path: '/portfolio-ai',
    labelAr: 'المحفظة الذكية',
    labelEn: 'Portfolio AI',
    category: 'analysis',
    description: 'توصيات ذكية للمحفظة.',
    accountDomains: ['ai', 'portfolios'],
  },

  // ============================================================
  // Tools / Alerts / Reports
  // ============================================================
  {
    path: '/alerts',
    labelAr: 'التنبيهات',
    labelEn: 'Alerts',
    category: 'tools',
    description: 'تنبيهات الأسعار والأحداث.',
    accountDomains: ['alerts', 'monitoring'],
  },
  {
    path: '/smart-alerts',
    labelAr: 'التنبيهات الذكية',
    labelEn: 'Smart Alerts',
    category: 'tools',
    description: 'تنبيهات مدعومة بالذكاء الاصطناعي.',
    accountDomains: ['alerts', 'ai'],
  },
  {
    path: '/smart-reports',
    labelAr: 'التقارير الذكية',
    labelEn: 'Smart Reports',
    category: 'tools',
    description: 'تقارير مالية آلية.',
    accountDomains: ['portfolios', 'ai'],
  },
  {
    path: '/calculator',
    labelAr: 'الحاسبة',
    labelEn: 'Calculator',
    category: 'tools',
    description: 'حاسبات مالية متعددة.',
  },
  {
    path: '/news',
    labelAr: 'الأخبار',
    labelEn: 'News',
    category: 'tools',
    description: 'موجز الأخبار المالية.',
    accountDomains: ['news'],
  },

  // ============================================================
  // Education / Resources
  // ============================================================
  {
    path: '/resources',
    labelAr: 'المصادر التعليمية',
    labelEn: 'Resources',
    category: 'education',
    description: 'مكتبة مصادر الاستثمار.',
  },
  {
    path: '/dictionary',
    labelAr: 'القاموس المالي',
    labelEn: 'Dictionary',
    category: 'education',
    description: 'قاموس المصطلحات المالية.',
  },
  {
    path: '/trading-roadmap',
    labelAr: 'خارطة التداول',
    labelEn: 'Trading Roadmap',
    category: 'education',
    description: 'خطة تعلم التداول المتدرجة.',
  },

  // ============================================================
  // Account
  // ============================================================
  {
    path: '/profile',
    labelAr: 'الملف الشخصي والاعدادات',
    labelEn: 'Profile & Settings',
    category: 'account',
    description: 'بيانات المستخدم والتفضيلات الشخصية.',
    accountDomains: ['profile', 'profile_password', 'settings', 'alerts', 'purification'],
  },
  {
    path: '/settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    category: 'account',
    description: 'تفضيلات النظام والعرض والإشعارات.',
    accountDomains: ['settings', 'access'],
  },

  // ============================================================
  // Admin
  // ============================================================
  {
    path: '/admin',
    labelAr: 'لوحة الإدارة',
    labelEn: 'Admin Panel',
    category: 'admin',
    description: 'إدارة المستخدمين والصلاحيات والنظام.',
    requiredRole: 'admin',
    accountDomains: ['admin', 'access', 'monitoring'],
  },
  {
    path: '/api-registry',
    labelAr: 'سجل APIs الموحّد',
    labelEn: 'API Registry',
    category: 'admin',
    description: 'السجل المركزي لكل APIs والصفحات والمصادر.',
    requiredRole: 'admin',
  },
  {
    path: '/backup',
    labelAr: 'النسخ الاحتياطي',
    labelEn: 'Backup',
    category: 'admin',
    description: 'نسخ احتياطي للبيانات واستعادتها.',
    requiredRole: 'admin',
    accountDomains: ['admin'],
  },
  {
    path: '/database',
    labelAr: 'قاعدة البيانات',
    labelEn: 'Database',
    category: 'admin',
    description: 'عرض قاعدة البيانات الرئيسية.',
    requiredRole: 'admin',
    accountDomains: ['admin'],
  },
  {
    path: '/stocks-database',
    labelAr: 'قاعدة الأسهم والصناديق',
    labelEn: 'Stocks & Funds Database',
    category: 'admin',
    description: 'قاعدة بيانات مرجعية للأسهم والصناديق.',
    accountDomains: ['admin'],
  },
];

export const PAGE_CATEGORIES: Record<PageCategory, { labelAr: string; labelEn: string }> = {
  dashboard: { labelAr: 'لوحة التحكم', labelEn: 'Dashboard' },
  markets: { labelAr: 'الأسواق', labelEn: 'Markets' },
  portfolio: { labelAr: 'المحفظة', labelEn: 'Portfolio' },
  analysis: { labelAr: 'التحليل', labelEn: 'Analysis' },
  tools: { labelAr: 'الأدوات', labelEn: 'Tools' },
  education: { labelAr: 'التعلّم', labelEn: 'Education' },
  account: { labelAr: 'الحساب', labelEn: 'Account' },
  admin: { labelAr: 'الإدارة', labelEn: 'Admin' },
  auth: { labelAr: 'المصادقة', labelEn: 'Auth' },
};

export function getPagesByCategory(category: PageCategory): PageEntry[] {
  return PAGES.filter((p) => p.category === category);
}

export function getPage(path: string): PageEntry | undefined {
  return PAGES.find((p) => p.path === path);
}
