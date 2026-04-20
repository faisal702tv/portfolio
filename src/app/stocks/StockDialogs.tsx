import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
      Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
      Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
      AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { calcTradeFees, getTaxDefaults } from '@/lib/tax-settings';
import { fmtN } from '@/lib/helpers';
import type { SnapshotStock } from '@/lib/export-utils';

// 1. نافذة التعديل (Edit Dialog)
export function StockEditDialog({
      open, onOpenChange, stock, onChange, onSave, saving, defaultCurrency
}: {
      open: boolean; onOpenChange: (open: boolean) => void;
      stock: SnapshotStock | null; onChange: (stock: SnapshotStock) => void;
      onSave: () => void; saving: boolean; defaultCurrency: string;
}) {
      if (!stock) return null;

      const editTax = getTaxDefaults({ currency: stock.currency, symbol: stock.symbol, exchange: stock.exchange });
      const editGross = stock.qty * stock.buyPrice;
      const editFees = calcTradeFees({
            grossAmount: editGross, brokeragePct: editTax.brokeragePct, vatPct: editTax.vatPct,
            customBrokerageAmount: stock.customBrok != null && stock.customBrok !== '' ? Number(stock.customBrok) : undefined,
            customVatAmount: stock.customVat != null && stock.customVat !== '' ? Number(stock.customVat) : undefined,
      });

      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                              <DialogTitle>تعديل {stock.symbol}</DialogTitle>
                              <DialogDescription>عدّل بيانات السهم</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                    <div><Label>الرمز</Label><Input value={stock.symbol} onChange={(e) => onChange({ ...stock, symbol: e.target.value })} /></div>
                                    <div><Label>الاسم</Label><Input value={stock.name} onChange={(e) => onChange({ ...stock, name: e.target.value })} /></div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                    <div><Label>الكمية</Label><Input type="number" value={stock.qty} onChange={(e) => onChange({ ...stock, qty: Number(e.target.value) })} /></div>
                                    <div><Label>سعر الشراء</Label><Input type="number" value={stock.buyPrice} onChange={(e) => onChange({ ...stock, buyPrice: Number(e.target.value) })} /></div>
                                    <div><Label>تاريخ الشراء</Label><Input type="date" value={stock.buyDate || ''} onChange={(e) => onChange({ ...stock, buyDate: e.target.value })} /></div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                    <div><Label>البورصة</Label><Input value={stock.exchange || ''} onChange={(e) => onChange({ ...stock, exchange: e.target.value })} /></div>
                                    <div><Label>القطاع</Label><Input value={stock.sector || ''} onChange={(e) => onChange({ ...stock, sector: e.target.value })} /></div>
                                    <div><Label>النوع</Label><Input value={stock.type || ''} onChange={(e) => onChange({ ...stock, type: e.target.value })} /></div>
                              </div>
                              <div className="rounded-lg border bg-muted/20 p-3">
                                    <p className="mb-2 text-xs font-semibold text-primary">التصنيف الشرعي</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                          {([['shariaStatus', 'الحالة'], ['shariaBilad', 'البلاد'], ['shariaRajhi', 'الراجحي'], ['shariaMaqasid', 'المقاصد']] as const).map(([key, label]) => (
                                                <div key={key}>
                                                      <Label className="text-xs">{label}</Label>
                                                      <Select value={(stock as unknown as Record<string, string>)[key] || ''} onValueChange={(v) => onChange({ ...stock, [key]: v } as SnapshotStock)}>
                                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                                            <SelectContent>
                                                                  <SelectItem value="حلال">حلال</SelectItem>
                                                                  <SelectItem value="نقي">نقي</SelectItem>
                                                                  <SelectItem value="مختلط">مختلط</SelectItem>
                                                                  <SelectItem value="غير متوافق">غير متوافق</SelectItem>
                                                            </SelectContent>
                                                      </Select>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                              <div className="rounded-lg border bg-muted/20 p-3">
                                    <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
                                    <p className="mb-3 text-xs text-muted-foreground">إعدادات السوق: {editTax.marketKey.toUpperCase()} • عمولة {editTax.brokeragePct}% • ضريبة عمولة {editTax.vatPct}%</p>
                                    <div className="grid grid-cols-2 gap-3">
                                          <div><Label>عمولة السمسرة ({stock.currency || defaultCurrency})</Label><Input type="number" value={(stock as unknown as Record<string, unknown>).customBrok as string ?? ''} placeholder={editGross > 0 ? `تلقائي ${(editGross * (editTax.brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => onChange({ ...stock, customBrok: e.target.value } as SnapshotStock)} /></div>
                                          <div><Label>ضريبة القيمة المضافة ({stock.currency || defaultCurrency})</Label><Input type="number" value={(stock as unknown as Record<string, unknown>).customVat as string ?? ''} placeholder={editFees.brokerage > 0 ? `تلقائي ${(editFees.brokerage * (editTax.vatPct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => onChange({ ...stock, customVat: e.target.value } as SnapshotStock)} /></div>
                                    </div>
                                    <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                                          <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي الشراء</span><span>{fmtN(editGross)}</span></div>
                                          <div className="flex items-center justify-between"><span className="text-muted-foreground">العمولة</span><span>{fmtN(editFees.brokerage)}</span></div>
                                          <div className="flex items-center justify-between"><span className="text-muted-foreground">الضريبة</span><span>{fmtN(editFees.vat)}</span></div>
                                          <div className="mt-1 flex items-center justify-between font-bold"><span>التكلفة الفعلية</span><span>{fmtN(editFees.total)} {stock.currency || defaultCurrency}</span></div>
                                    </div>
                              </div>
                        </div>
                        <DialogFooter>
                              <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                              <Button onClick={onSave} disabled={saving}>حفظ التعديل</Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog>
      );
}

// 2. نافذة النقل لمحفظة أخرى (Move Dialog)
export function StockMoveDialog({
      open, onOpenChange, itemName, targetPortfolioId, onTargetChange, portfolios, sourcePortfolioId, onMove, saving
}: {
      open: boolean; onOpenChange: (open: boolean) => void;
      itemName?: string; targetPortfolioId: string; onTargetChange: (id: string) => void;
      portfolios: any[]; sourcePortfolioId: string; onMove: () => void; saving: boolean;
}) {
      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent dir="rtl">
                        <DialogHeader>
                              <DialogTitle>نقل {itemName} إلى محفظة أخرى</DialogTitle>
                              <DialogDescription>اختر المحفظة المراد النقل إليها</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3">
                              <Select value={targetPortfolioId} onValueChange={onTargetChange}>
                                    <SelectTrigger><SelectValue placeholder="اختر المحفظة" /></SelectTrigger>
                                    <SelectContent>
                                          {portfolios.filter(p => p.id !== sourcePortfolioId).map((p) => (
                                                <SelectItem key={p.id} value={p.id}>📁 {p.name}</SelectItem>
                                          ))}
                                    </SelectContent>
                              </Select>
                        </div>
                        <DialogFooter>
                              <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                              <Button onClick={onMove} disabled={!targetPortfolioId || saving} className="bg-purple-600 hover:bg-purple-700">نقل</Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog>
      );
}

// 3. نافذة تأكيد الحذف (Delete Confirmation Dialog)
export function StockDeleteDialog({
      id, onOpenChange, onConfirm
}: {
      id: string | null; onOpenChange: (open: boolean) => void; onConfirm: () => void;
}) {
      return (
            <AlertDialog open={!!id} onOpenChange={onOpenChange}>
                  <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>هل أنت متأكد من حذف هذا الأصل؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
      );
}