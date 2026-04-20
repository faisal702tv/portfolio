'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/helpers';

interface StatsCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  type?: 'currency' | 'number' | 'percent';
  className?: string;
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  type = 'currency',
  className,
  iconClassName,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  const formattedValue = type === 'currency' 
    ? formatCurrency(value) 
    : type === 'percent' 
      ? formatPercent(value) 
      : formatNumber(value);

  return (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-lg', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>
            {change !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  isPositive && 'text-green-600 dark:text-green-400',
                  isNegative && 'text-red-600 dark:text-red-400',
                  isNeutral && 'text-muted-foreground'
                )}
              >
                {isPositive && <TrendingUp className="h-4 w-4" />}
                {isNegative && <TrendingDown className="h-4 w-4" />}
                {isNeutral && <Minus className="h-4 w-4" />}
                <span>{formatPercent(change)}</span>
                {changeLabel && (
                  <span className="text-muted-foreground font-normal">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isPositive && 'bg-green-100 dark:bg-green-900/30',
                isNegative && 'bg-red-100 dark:bg-red-900/30',
                (!change || change === 0) && 'bg-primary/10',
                iconClassName
              )}
            >
              <span className={cn(
                isPositive && 'text-green-600 dark:text-green-400',
                isNegative && 'text-red-600 dark:text-red-400',
                (!change || change === 0) && 'text-primary'
              )}>
                {icon}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-primary/50 to-transparent" />
    </Card>
  );
}

// Group of stats cards
interface StatsGroupProps {
  stats: StatsCardProps[];
  columns?: 2 | 3 | 4;
}

export function StatsGroup({ stats, columns = 4 }: StatsGroupProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      )}
    >
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}
