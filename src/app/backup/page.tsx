'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyError } from '@/hooks/use-notifications';
import {
  copyPortfolioSummary,
  exportPortfolioJSON,
  fetchPortfolioSnapshot,
  persistPortfolioSnapshot,
  PortfolioSnapshot,
} from '@/lib/export-utils';

function estimateSizeKB(data: unknown) {
  const bytes = new Blob([JSON.stringify(data)]).size;
  return (bytes / 1024).toFixed(1);
}

export default function BackupPage() {
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [syncCode, setSyncCode] = useState('');

  useEffect(() => {
    void (async () => {
      const data = await fetchPortfolioSnapshot();
      setSnapshot(data.snapshot);
    })();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'الأسهم', value: snapshot?.stocks.length ?? 0 },
      { label: 'السندات', value: snapshot?.bonds.length ?? 0 },
      { label: 'الصناديق', value: snapshot?.funds.length ?? 0 },
      { label: 'الحجم', value: `${estimateSizeKB(snapshot ?? {})} KB` },
    ],
    [snapshot]
  );

  const exportJson = () => {
    if (!snapshot) return;
    exportPortfolioJSON(snapshot);
    toast({ title: 'تم التصدير', description: 'تم تنزيل نسخة JSON بنجاح.' });
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as PortfolioSnapshot;
      if (!data.stocks || !data.bonds || !data.funds) {
        throw new Error('invalid');
      }
      setSnapshot(data);
      const persisted = await persistPortfolioSnapshot(data);
      toast({ title: 'تم الاستيراد', description: 'تم تحديث بيانات النسخة الاحتياطية.' });
      notifySuccess('استيراد ناجح', 'تم استيراد النسخة الاحتياطية بنجاح', { source: 'النسخ الاحتياطي' });
      if (persisted.ok) {
        toast({ title: 'تم الحفظ في الخادم', description: 'تمت مزامنة النسخة مع قاعدة البيانات.' });
      }
    } catch {
      toast({
        title: 'ملف غير صالح',
        description: 'تحقق من أن الملف نسخة JSON صحيحة.',
        variant: 'destructive',
      });
      notifyError('فشل الاستيراد', 'الملف غير صالح أو تالف', { source: 'النسخ الاحتياطي' });
    }
  };

  const copySyncCode = async () => {
    if (!snapshot) return;
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot))));
    await navigator.clipboard.writeText(code);
    setSyncCode(code);
    toast({ title: 'تم النسخ', description: 'تم نسخ كود المزامنة إلى الحافظة.' });
  };

  const pasteSyncCode = async () => {
    try {
      const text = syncCode.trim() || (await navigator.clipboard.readText());
      const decoded = decodeURIComponent(escape(atob(text)));
      const data = JSON.parse(decoded) as PortfolioSnapshot;
      if (!data.stocks || !data.bonds || !data.funds) throw new Error('invalid');
      setSnapshot(data);
      const persisted = await persistPortfolioSnapshot(data);
      toast({ title: 'تمت المزامنة', description: 'تم استيراد البيانات من كود المزامنة.' });
      if (persisted.ok) {
        toast({ title: 'تم الحفظ في الخادم', description: 'تمت مزامنة البيانات مع قاعدة البيانات.' });
      }
    } catch {
      toast({
        title: 'فشل المزامنة',
        description: 'تأكد من أن كود المزامنة كامل وصحيح.',
        variant: 'destructive',
      });
    }
  };

  const copySummary = async () => {
    if (!snapshot) return;
    await copyPortfolioSummary(snapshot);
    toast({ title: 'تم نسخ الملخص', description: 'نسخ ملخص المحفظة إلى الحافظة.' });
  };

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />
        <div className="mr-16 transition-all duration-300 lg:mr-64">
          <TopBar title="💾 النسخ الاحتياطي والمزامنة" />
          <main className="p-6">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">جاري تحميل بيانات المحفظة...</CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="💾 النسخ الاحتياطي والمزامنة" />

        <main className="space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>تصدير واستيراد</CardTitle>
                <CardDescription>حفظ نسخة كاملة من بياناتك أو استعادة نسخة سابقة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportJson} className="w-full">
                  تنزيل نسخة JSON
                </Button>

                <label className="block">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleImportFile(file);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>

                <Button variant="outline" className="w-full" onClick={copySummary}>
                  نسخ ملخص سريع
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مزامنة بين المتصفحات</CardTitle>
                <CardDescription>انقل البيانات بسرعة عبر كود مزامنة مشفر Base64.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={copySyncCode}>نسخ كود المزامنة</Button>
                  <Button variant="outline" onClick={pasteSyncCode}>
                    لصق واستيراد
                  </Button>
                </div>
                <Textarea
                  placeholder="الصق كود المزامنة هنا..."
                  value={syncCode}
                  onChange={(event) => setSyncCode(event.target.value)}
                  className="min-h-32 font-mono text-xs"
                  dir="ltr"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات النسخة الحالية</CardTitle>
              <CardDescription>
                آخر تحديث: {new Date(snapshot.exportedAt).toLocaleString('ar-SA-u-ca-gregory')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-lg border bg-muted/30 p-4 text-center">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
