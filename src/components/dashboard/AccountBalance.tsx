'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatCurrency } from '@/lib/helpers';
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  Lock,
  Clock,
  Building2,
  CheckCircle2,
  Zap,
  Trophy,
  PiggyBank,
  Landmark,
  Shield,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface BalanceItem {
  label: string;
  value: number;
  change?: number;
  changePct?: number;
  icon: React.ReactNode;
}

interface AccountBalanceCardProps {
  title: string;
  count?: number;
  items: BalanceItem[];
  variant?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  footer?: {
    label: string;
    value: number;
    change: number;
    changePct: number;
  };
}

const variantStyles = {
  primary: {
    card: 'bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white border-0 shadow-xl shadow-green-500/20',
    header: 'text-white/90',
    item: 'bg-white/10 hover:bg-white/15 border-white/20',
    value: 'text-white',
    change: 'bg-white/20 text-white',
    footer: 'bg-white/15 border-white/20'
  },
  secondary: {
    card: 'bg-gradient-to-br from-amber-700 via-orange-700 to-yellow-700 text-white border-0 shadow-xl shadow-amber-500/20',
    header: 'text-white/90',
    item: 'bg-white/10 hover:bg-white/15 border-white/20',
    value: 'text-white',
    change: 'bg-white/20 text-white',
    footer: 'bg-white/15 border-white/20'
  },
  tertiary: {
    card: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 text-white border-0 shadow-xl shadow-blue-500/20',
    header: 'text-white/90',
    item: 'bg-white/10 hover:bg-white/15 border-white/20',
    value: 'text-white',
    change: 'bg-white/20 text-white',
    footer: 'bg-white/15 border-white/20'
  },
  quaternary: {
    card: 'bg-gradient-to-br from-rose-700 via-pink-700 to-red-700 text-white border-0 shadow-xl shadow-rose-500/20',
    header: 'text-white/90',
    item: 'bg-white/10 hover:bg-white/15 border-white/20',
    value: 'text-white',
    change: 'bg-white/20 text-white',
    footer: 'bg-white/15 border-white/20'
  }
};

export function AccountBalanceCard({ title, count, items, variant = 'primary', footer }: AccountBalanceCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className={`${styles.card} transition-all duration-300 hover:scale-[1.02]`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {count !== undefined && (
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
              {count}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-3 rounded-xl ${styles.item} border transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                {item.icon}
              </div>
              <span className="text-sm font-medium opacity-90">{item.label}</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">{formatCurrency(item.value)}</p>
              {item.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${item.change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {item.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{item.change >= 0 ? '+' : ''}{formatNumber(item.changePct || 0, 2)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {footer && (
          <div className={`flex items-center justify-between p-3 rounded-xl ${styles.footer} border mt-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{footer.label}</span>
            </div>
            <div className="text-left flex items-center gap-2">
              <span className="font-bold">{formatCurrency(footer.value)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${footer.changePct >= 0 ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'}`}>
                {footer.changePct >= 0 ? '+' : ''}{formatNumber(footer.changePct, 2)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// All Accounts Summary Card
export function AllAccountsCard() {
  const items: BalanceItem[] = [
    { label: 'الرصيد الإجمالي', value: 50170, icon: <Wallet className="h-4 w-4" />, change: 1700, changePct: 3.51 },
    { label: 'الرصيد المتاح', value: 35250, icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'الرصيد المحجوز', value: 14920, icon: <Lock className="h-4 w-4" /> },
    { label: 'الرصيد المؤمن عليه', value: 8500, icon: <Shield className="h-4 w-4" /> },
    { label: 'الرصيد المتأخر', value: 0, icon: <Clock className="h-4 w-4" /> },
    { label: 'الرصيد المستحق', value: 2500, icon: <Building2 className="h-4 w-4" /> },
  ];

  return (
    <AccountBalanceCard
      title="كل الحسابات"
      count={3}
      items={items}
      variant="primary"
      footer={{
        label: 'الرصيد المتأخر/المستحق',
        value: 2500,
        change: 2500,
        changePct: 5.0
      }}
    />
  );
}

// Total Balance Card
export function TotalBalanceCard() {
  const items: BalanceItem[] = [
    { label: 'الرصيد الإجمالي', value: 50170, icon: <Wallet className="h-4 w-4" /> },
    { label: 'الرصيد المتاح', value: 35250, icon: <PiggyBank className="h-4 w-4" /> },
    { label: 'الرصيد المحجوز', value: 14920, icon: <Lock className="h-4 w-4" /> },
    { label: 'الرصيد المؤمن', value: 8500, icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <AccountBalanceCard
      title="الرصيد الإجمالي"
      count={0}
      items={items}
      variant="secondary"
      footer={{
        label: 'التغير',
        value: 1700,
        change: 1700,
        changePct: 3.51
      }}
    />
  );
}

// Available Balance Card
export function AvailableBalanceCard() {
  const items: BalanceItem[] = [
    { label: 'الرصيد المتاح', value: 35250, icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'للاستثمار', value: 25000, icon: <Landmark className="h-4 w-4" /> },
    { label: 'للسحب', value: 10250, icon: <Wallet className="h-4 w-4" /> },
  ];

  return (
    <AccountBalanceCard
      title="الرصيد المتاح"
      count={0}
      items={items}
      variant="tertiary"
      footer={{
        label: 'نسبة السيولة',
        value: 70,
        change: 5,
        changePct: 7.14
      }}
    />
  );
}

// Reserved Balance Card
export function ReservedBalanceCard() {
  const items: BalanceItem[] = [
    { label: 'الرصيد المحجوز', value: 14920, icon: <Lock className="h-4 w-4" /> },
    { label: 'للصفقات', value: 10000, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'للضمانات', value: 4920, icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <AccountBalanceCard
      title="الرصيد المحجوز"
      count={0}
      items={items}
      variant="quaternary"
      footer={{
        label: 'نسبة التحفظ',
        value: 14920,
        change: -500,
        changePct: -3.24
      }}
    />
  );
}

// Account Balance Grid
export function AccountBalanceGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <AllAccountsCard />
      <TotalBalanceCard />
      <AvailableBalanceCard />
      <ReservedBalanceCard />
    </div>
  );
}
