'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { demoStocks, type Stock } from '@/data/demo';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/helpers';
import { MoreHorizontal, TrendingUp, TrendingDown, Eye, Edit, Trash2, ShoppingCart } from 'lucide-react';

interface StockTableProps {
  stocks?: Stock[];
  showActions?: boolean;
  compact?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (stock: Stock) => void;
}

export function StockTable({ stocks = demoStocks, showActions = true, compact = false, onDelete, onEdit }: StockTableProps) {
  return (
    <Card>
      <CardHeader className={compact ? 'py-3' : undefined}>
        <CardTitle className={`flex items-center justify-between ${compact ? 'text-base' : 'text-lg'}`}>
          <span>📊 الأسهم ({stocks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'p-0' : undefined}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الرمز</TableHead>
                <TableHead className="text-right">الشركة</TableHead>
                {!compact && <TableHead className="text-right">القطاع</TableHead>}
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">سعر الشراء</TableHead>
                <TableHead className="text-right">السعر الحالي</TableHead>
                <TableHead className="text-right">التغيير</TableHead>
                <TableHead className="text-right">التكلفة</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right">الربح/الخسارة</TableHead>
                {showActions && <TableHead className="text-center"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id} className="group hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{stock.symbol}</span>
                      {stock.isShariaCompliant && (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          شرعي
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{stock.name}</TableCell>
                  {!compact && <TableCell className="text-muted-foreground">{stock.sector}</TableCell>}
                  <TableCell>{formatNumber(stock.qty, 0)}</TableCell>
                  <TableCell>{formatCurrency(stock.buyPrice)}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{formatCurrency(stock.currentPrice || stock.buyPrice)}</span>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`flex items-center gap-1 font-medium ${
                        (stock.changePct || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {(stock.changePct || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatPercent(stock.changePct || 0)}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(stock.totalCost)}</TableCell>
                  <TableCell>{formatCurrency(stock.currentValue)}</TableCell>
                  <TableCell>
                    <div
                      className={`font-semibold ${
                        stock.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stock.profitLoss >= 0 ? '+' : ''}
                      {formatCurrency(stock.profitLoss)}
                      <span className="text-xs block">
                        ({formatPercent(stock.profitLossPct)})
                      </span>
                    </div>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(stock)}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => onDelete?.(stock.id)}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Mini stock card for dashboard
interface StockMiniCardProps {
  stock: Stock;
  onDelete?: () => void;
}

export function StockMiniCard({ stock, onDelete }: StockMiniCardProps) {
  const isPositive = (stock.changePct || 0) >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{stock.symbol}</span>
              {stock.isShariaCompliant && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  شرعي
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-xs font-medium px-2 py-1 rounded ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? '+' : ''}{formatPercent(stock.changePct || 0)}
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold">{formatCurrency(stock.currentPrice || stock.buyPrice)}</p>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-muted-foreground">القيمة:</span>
            <span className={stock.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(stock.currentValue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
