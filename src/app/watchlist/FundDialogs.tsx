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
import type { SnapshotFund } from '@/lib/export-utils';

// 1. نافذة التعديل (Edit Dialog)
export function FundEditDialog({
      open, onOpenChange, fund, onChange, onSave, saving
}: {
      open: boolean; onOpenChange: (open: boolean) => void;
      fund: SnapshotFund | null; onChange: (fund: SnapshotFund) => void;
      onSave: () => void; saving: boolean;
}) {
      if (!fund) return null;

      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                              <DialogTitle>تعديل {fund.name}</DialogTitle>
                              <DialogDescription>عدّل بيانات الصندوق</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                    <div><Label>الرمز</Label><Input value={fund.symbol || ''} onChange={(e) => onChange({ ...fund, symbol: e.target.value })} /></div>
                                    <div><Label>الاسم</Label><Input value={fund.name} onChange={(e) => onChange({ ...fund, name: e.target.value })} /></div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                    <div><Label>الوحدات</Label><Input type="number" value={fund.units} onChange={(e) => onChange({ ...fund, units: Number(e.target.value) })} /></div>
                                    <div><Label>سعر الشراء</Label><Input type="number" value={fund.buyPrice} onChange={(e) => onChange({ ...fund, buyPrice: Number(e.target.value) })} /></div>
                                    <div><Label>تاريخ الشراء</Label><Input type="date" value={fund.buyDate || ''} onChange={(e) => onChange({ ...fund, buyDate: e.target.value })} /></div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                    <div><Label>النوع</Label><Input value={fund.fundType || ''} onChange={(e) => onChange({ ...fund, fundType: e.target.value })} /></div>
                                    <div><Label>البورصة</Label><Input value={fund.exchange || ''} onChange={(e) => onChange({ ...fund, exchange: e.target.value })} /></div>
                                    <div><Label>القطاع</Label><Input value={fund.sector || ''} onChange={(e) => onChange({ ...fund, sector: e.target.value })} /></div>
                              </div>
                              <div className="rounded-lg border bg-muted/20 p-3">
                                    <p className="mb-2 text-xs font-semibold text-primary">التصنيف الشرعي</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                          {([['shariaStatus', 'الحالة'], ['shariaBilad', 'البلاد'], ['shariaRajhi', 'الراجحي'], ['shariaMaqasid', 'المقاصد']] as const).map(([key, label]) => (
                                                <div key={key}>
                                                      <Label className="text-xs">{label}</Label>
                                                      <Select value={(fund as unknown as Record<string, string>)[key] || ''} onValueChange={(v) => onChange({ ...fund, [key]: v } as SnapshotFund)}>
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
                                    <p className="mb-2 text-xs font-semibold text-primary">عمولة السمسرة والضريبة</p>
                                    <div className="grid grid-cols-2 gap-3">
                                          <div><Label>عمولة السمسرة (مبلغ)</Label><Input type="number" value={(fund as unknown as Record<string, unknown>).customBrok as string ?? ''} placeholder="تلقائي" onChange={(e) => onChange({ ...fund, customBrok: e.target.value } as unknown as SnapshotFund)} /></div>
                                          <div><Label>ضريبة القيمة المضافة (مبلغ)</Label><Input type="number" value={(fund as unknown as Record<string, unknown>).customVat as string ?? ''} placeholder="تلقائي" onChange={(e) => onChange({ ...fund, customVat: e.target.value } as unknown as SnapshotFund)} /></div>
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
export function FundMoveDialog({
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
export function FundDeleteDialog({
      id, onOpenChange, onConfirm
}: {
      id: string | null; onOpenChange: (open: boolean) => void; onConfirm: () => void;
}) {
      return (
            <AlertDialog open={!!id} onOpenChange={onOpenChange}>
                  <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>هل أنت متأكد من حذف هذا الصندوق؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
            </AlertDialog>
      );
}