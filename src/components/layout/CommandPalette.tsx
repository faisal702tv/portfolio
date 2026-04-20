'use client';

import {
  Brain,
  Calculator,
  Database,
  FileDown,
  FileSpreadsheet,
  Gauge,
  LineChart,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onExportReport?: () => void;
}

const PAGES = [
  { href: '/', label: 'لوحة المعلومات', icon: Gauge, shortcut: 'Alt+1' },
  { href: '/stocks', label: 'الأسهم', icon: TrendingUp, shortcut: 'Alt+2' },
  { href: '/market', label: 'السوق اليومي', icon: LineChart, shortcut: 'Alt+3' },
  { href: '/watchlist', label: 'قائمة المتابعة', icon: Star, shortcut: 'Alt+W' },
  { href: '/alerts', label: 'التنبيهات', icon: Shield, shortcut: 'Alt+A' },
  { href: '/screener', label: 'سكرينر الأسهم', icon: Search },
  { href: '/ai-assistant', label: 'مساعد الاستثمار', icon: Brain },
  { href: '/calculator', label: 'الحاسبة', icon: Calculator },
  { href: '/database', label: 'قاعدة البيانات', icon: Database },
  { href: '/crypto', label: 'العملات المشفرة', icon: TrendingUp },
  { href: '/crypto-buy', label: 'شراء العملات المشفرة', icon: FileDown },
  { href: '/commodities', label: 'السلع والمعادن', icon: TrendingUp },
  { href: '/commodities-buy', label: 'شراء السلع والمعادن', icon: FileDown },
  { href: '/forex', label: 'سوق العملات', icon: TrendingUp },
  { href: '/backup', label: 'النسخ الاحتياطي', icon: FileDown, shortcut: 'Alt+B' },
  { href: '/settings', label: 'الإعدادات', icon: Settings, shortcut: 'Alt+S' },
];

export function CommandPalette({
  open,
  onOpenChange,
  onRefresh,
  onExportExcel,
  onExportReport,
}: CommandPaletteProps) {
  const router = useRouter();

  const actions = useMemo(
    () => [
      { id: 'refresh', label: 'تحديث الأسعار', icon: TrendingUp, shortcut: 'Alt+R', onSelect: onRefresh },
      { id: 'export-excel', label: 'تصدير Excel', icon: FileSpreadsheet, shortcut: 'Alt+E', onSelect: onExportExcel },
      { id: 'export-report', label: 'تقرير للطباعة (PDF)', icon: FileDown, onSelect: onExportReport },
    ],
    [onExportExcel, onExportReport, onRefresh]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="لوحة الأوامر"
      description="بحث سريع بين الصفحات والإجراءات"
      className="max-w-2xl"
    >
      <CommandInput placeholder="اكتب اسم الصفحة أو الأمر..." />
      <CommandList>
        <CommandEmpty>لا توجد نتائج مطابقة</CommandEmpty>

        <CommandGroup heading="الصفحات">
          {PAGES.map((page) => (
            <CommandItem
              key={page.href}
              value={`${page.label} ${page.href}`}
              onSelect={() => {
                router.push(page.href);
                onOpenChange(false);
              }}
            >
              <page.icon className="h-4 w-4" />
              <span>{page.label}</span>
              {page.shortcut ? <CommandShortcut>{page.shortcut}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="الإجراءات">
          {actions.map((action) => (
            <CommandItem
              key={action.id}
              value={action.label}
              onSelect={() => {
                action.onSelect?.();
                onOpenChange(false);
              }}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.label}</span>
              {action.shortcut ? <CommandShortcut>{action.shortcut}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
