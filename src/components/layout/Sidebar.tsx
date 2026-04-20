'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Briefcase,
  Bell,
  Settings,
  Database,
  PieChart,
  BarChart3,
  LineChart,
  Brain,
  Calculator,
  BookOpen,
  Newspaper,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
  Bitcoin,
  Coins,
  DollarSign,
  User,
  Target,
  Star,
  Wallet,
  HardDriveDownload,
  History,
  ShieldCheck,
  CalendarClock,
  Layers,
  Network,
  X,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAccessControl } from '@/hooks/use-access-control';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: 'stocks' | 'bonds' | 'funds' | 'watchlist';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: '\u{1F3E0} الرئيسية',
    items: [
      { title: 'لوحة المعلومات', href: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{1F4C8} الأسواق',
    items: [
      { title: 'جميع الأسواق', href: '/markets', icon: <Globe className="h-4 w-4" /> },
      { title: 'فلتر الأسهم', href: '/screener', icon: <Search className="h-4 w-4" /> },
      { title: 'الخريطة الحرارية', href: '/heatmap', icon: <PieChart className="h-4 w-4" /> },
      { title: 'مقارنة الأسهم', href: '/compare', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{1F4B1} الأسواق المالية',
    items: [
      { title: 'سوق العملات', href: '/forex', icon: <DollarSign className="h-4 w-4" /> },
      { title: 'السلع والمعادن', href: '/commodities', icon: <Coins className="h-4 w-4" /> },
      { title: 'العملات المشفرة', href: '/crypto', icon: <Bitcoin className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{1F4BC} المحفظة',
    items: [
      { title: 'إدارة المحافظ', href: '/portfolios', icon: <Briefcase className="h-4 w-4" /> },
      { title: 'تجميع المحافظ', href: '/consolidated-portfolio', icon: <Layers className="h-4 w-4" /> },
      { title: 'الأسهم', href: '/stocks', icon: <TrendingUp className="h-4 w-4" />, badgeKey: 'stocks' },
      { title: 'السندات والصكوك', href: '/bonds', icon: <FileText className="h-4 w-4" />, badgeKey: 'bonds' },
      { title: 'الصناديق', href: '/funds', icon: <Briefcase className="h-4 w-4" />, badgeKey: 'funds' },
      { title: 'قائمة المتابعة', href: '/watchlist', icon: <Star className="h-4 w-4" />, badgeKey: 'watchlist' },
      { title: 'التنبيهات', href: '/alerts', icon: <Bell className="h-4 w-4" /> },
      { title: 'التوزيعات', href: '/dividends', icon: <Wallet className="h-4 w-4" /> },
      { title: 'تقويم توزيع الأرباح', href: '/dividend-calendar', icon: <CalendarDays className="h-4 w-4" /> },
      { title: 'أداء وتحليل المحفظة', href: '/performance', icon: <BarChart3 className="h-4 w-4" /> },
      { title: 'سجل الشراء والبيع', href: '/sell-history', icon: <History className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{1F916} تحليل ذكي',
    items: [
      { title: 'تحليل AI', href: '/ai-analysis', icon: <Brain className="h-4 w-4" /> },
      { title: 'التحليل الفني', href: '/technical-analysis', icon: <LineChart className="h-4 w-4" /> },
      { title: 'تحليل المخاطر', href: '/risk-analysis', icon: <ShieldCheck className="h-4 w-4" /> },
      { title: 'الحاسبة', href: '/calculator', icon: <Calculator className="h-4 w-4" /> },
      { title: 'الشموع اليابانية', href: '/candlestick', icon: <LineChart className="h-4 w-4" /> },
      { title: 'التحليل الأساسي', href: '/fundamental-analysis', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{1F4F0} الأخبار والمعلومات',
    items: [
      { title: 'أخبار الأسواق', href: '/news', icon: <Newspaper className="h-4 w-4" /> },
      { title: 'الإجراءات المؤسسية والأرباح', href: '/corporate-actions', icon: <CalendarClock className="h-4 w-4" /> },
      { title: 'القاموس المالي', href: '/dictionary', icon: <BookOpen className="h-4 w-4" /> },
      { title: 'المصادر والروابط', href: '/resources', icon: <Globe className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{1F393} التعلم والتطوير',
    items: [
      { title: 'معالج البداية', href: '/onboarding', icon: <User className="h-4 w-4" /> },
      { title: 'خريطة المضاربة', href: '/trading-roadmap', icon: <Target className="h-4 w-4" /> },
    ],
  },
  {
    title: '\u{2699}\u{FE0F} الإدارة',
    items: [
      { title: 'النسخ الاحتياطي', href: '/backup', icon: <HardDriveDownload className="h-4 w-4" /> },
      { title: 'لوحة الإدارة', href: '/admin', icon: <ShieldCheck className="h-4 w-4" /> },
      { title: 'سجل APIs الموحّد', href: '/api-registry', icon: <Network className="h-4 w-4" /> },
      { title: 'قاعدة البيانات', href: '/database', icon: <Database className="h-4 w-4" /> },
      { title: 'قاعدة الأسهم والصناديق', href: '/stocks-database', icon: <Database className="h-4 w-4" /> },
      { title: 'الملف الشخصي والاعدادات', href: '/profile', icon: <User className="h-4 w-4" /> },
      { title: 'الإعدادات', href: '/settings', icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

function readCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('portfolio_counts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateSidebarCounts(counts: { stocks?: number; bonds?: number; funds?: number; watchlist?: number }) {
  if (typeof window === 'undefined') return;
  const prev = readCounts();
  const next = { ...prev, ...counts };
  localStorage.setItem('portfolio_counts', JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('sidebar-counts-update'));
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>(() => readCounts());
  const { user } = useAuth();
  const { loading: accessLoading, canAccessPath } = useAccessControl();

  useEffect(() => {
    const handler = () => setCounts(readCounts());
    const toggleMobile = () => setMobileOpen(v => !v);
    window.addEventListener('sidebar-counts-update', handler);
    window.addEventListener('storage', handler);
    window.addEventListener('toggle-mobile-sidebar', toggleMobile);
    return () => {
      window.removeEventListener('sidebar-counts-update', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('toggle-mobile-sidebar', toggleMobile);
    };
  }, []);

  const visibleNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (
          (item.href === '/admin' || item.href === '/api-registry') &&
          user?.role !== 'admin'
        ) {
          return false;
        }
        if (accessLoading) return true;
        return canAccessPath(item.href);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen border-l bg-sidebar transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'max-lg:translate-x-full max-lg:w-64',
          mobileOpen && 'max-lg:translate-x-0'
        )}
        dir="rtl"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold">Portfolio Pro</h1>
                <p className="text-[10px] text-muted-foreground">إدارة الاستثمار</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-8 w-8 lg:flex"
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex h-8 w-8 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <nav className="space-y-2 px-2">
            {visibleNavigation.map((section) => (
              <div key={section.title}>
                {(!collapsed || mobileOpen) && (
                  <h2 className="mb-1 px-3 text-xs font-semibold text-muted-foreground">
                    {section.title}
                  </h2>
                )}
                <div className="space-y-1 mb-2">
                  {section.items.map((item, index) => {
                    const badgeCount = item.badgeKey ? counts[item.badgeKey] : undefined;
                    return (
                      <Link
                        key={`${section.title}-${item.href}-${item.title}-${index}`}
                        href={item.href}
                        onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                          (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground',
                          (collapsed && !mobileOpen) && 'justify-center px-2'
                        )}
                      >
                        <span className={cn((pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && 'text-primary')}>
                          {item.icon}
                        </span>
                        {(!collapsed || mobileOpen) && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {badgeCount !== undefined && badgeCount > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                {badgeCount}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Section */}
        {(!collapsed || mobileOpen) && (
          <div className="absolute bottom-0 right-0 left-0 border-t bg-sidebar p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">المستخدم</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || 'user@portfolio.sa'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
