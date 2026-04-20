'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Search,
  Sun,
  Moon,
  RefreshCw,
  Download,
  User,
  Settings,
  LogOut,
  FileDown,
  FileSpreadsheet,
  ClipboardCopy,
  Keyboard,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ShortcutsHelp } from '@/components/layout/ShortcutsHelp';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import {
  copyPortfolioSummary,
  fetchPortfolioSnapshot,
  exportPortfolioExcel,
  exportPortfolioJSON,
  printPortfolioReport,
} from '@/lib/export-utils';
import { notifySuccess, notifyError } from '@/hooks/use-notifications';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TopBar({ title = 'لوحة التحكم', subtitle, onRefresh, isRefreshing }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const runRefresh = () => {
    onRefresh?.();
    toast({
      title: 'تم تحديث البيانات',
      description: 'تم تشغيل التحديث اللحظي للأسعار.',
    });
  };

  const runExportExcel = async () => {
    const { snapshot } = await fetchPortfolioSnapshot();
    exportPortfolioExcel(snapshot);
    toast({
      title: 'تم تصدير Excel',
      description: 'تم إنشاء ملف Excel للمحفظة بنجاح.',
    });
    notifySuccess('تصدير بيانات', 'تم تصدير المحفظة بصيغة Excel', { source: 'التصدير' });
  };

  const runPrintReport = async () => {
    const { snapshot } = await fetchPortfolioSnapshot();
    printPortfolioReport();
    toast({
      title: 'تم إنشاء التقرير',
      description: 'اختر طباعة أو حفظ بصيغة PDF من نافذة التقرير.',
    });
  };

  const runExportJson = async () => {
    const { snapshot } = await fetchPortfolioSnapshot();
    exportPortfolioJSON(snapshot);
    toast({
      title: 'تم تصدير النسخة الاحتياطية',
      description: 'تم تنزيل ملف JSON بنجاح.',
    });
  };

  const runCopySummary = async () => {
    try {
      const snapshot = await fetchPortfolioSnapshot();
      await copyPortfolioSummary(snapshot.snapshot);
      toast({
        title: 'تم نسخ الملخص',
        description: 'تم نسخ تقرير المحفظة إلى الحافظة.',
      });
    } catch {
      toast({
        title: 'تعذر النسخ',
        description: 'المتصفح منع الوصول إلى الحافظة.',
        variant: 'destructive',
      });
    }
  };

  useKeyboardShortcuts({
    onNavigate: (href) => router.push(href),
    onAction: (action) => {
      if (action === 'toggleCommandPalette') setCommandOpen((v) => !v);
      if (action === 'toggleShortcutsHelp') setShortcutsOpen((v) => !v);
      if (action === 'refresh') runRefresh();
      if (action === 'exportExcel') runExportExcel();
    },
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => window.dispatchEvent(new Event('toggle-mobile-sidebar'))}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Badge variant="outline" className="gap-1 bg-primary/5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            المحفظة الرئيسية
          </Badge>
        </div>

        {/* Center Section - Search */}
        <div className="mx-8 hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="بحث برمز أو اسم..."
              className="w-full bg-muted/50 pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setCommandOpen(true)}
            />
          </div>
        </div>

        {/* Left Section */}
        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <Badge variant="outline" className="gap-1 border-green-200 bg-green-500/10 text-green-600 dark:border-green-800 dark:text-green-400">
            <span className="text-xs">☁️</span>
            <span className="text-xs font-medium">مزامن</span>
          </Badge>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={runRefresh}
            disabled={isRefreshing}
            title="تحديث الأسعار"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Command Palette */}
          <Button
            variant="ghost"
            size="icon"
            title="لوحة الأوامر (Ctrl/Cmd + K)"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Shortcuts Help */}
          <Button
            variant="ghost"
            size="icon"
            title="اختصارات لوحة المفاتيح (?)"
            onClick={() => setShortcutsOpen(true)}
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="تصدير">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>تصدير البيانات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={runPrintReport}>
                <FileDown className="ml-2 h-4 w-4" />
                تقرير للطباعة / PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={runExportExcel}>
                <FileSpreadsheet className="ml-2 h-4 w-4" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={runExportJson}>
                <FileDown className="ml-2 h-4 w-4" />
                نسخة احتياطية JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={runCopySummary}>
                <ClipboardCopy className="ml-2 h-4 w-4" />
                نسخ ملخص سريع
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="تغيير الثيم"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  A
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="ml-2 h-4 w-4" />
                  الملف الشخصي والاعدادات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="ml-2 h-4 w-4" />
                  الإعدادات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  localStorage.removeItem('selected_portfolio_id');
                  localStorage.removeItem('portfolio_counts');
                  window.location.href = '/login';
                }
              }}>
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onRefresh={runRefresh}
        onExportExcel={runExportExcel}
        onExportReport={runPrintReport}
      />
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
