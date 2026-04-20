'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        جاري التحويل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="⚙️ الإعدادات" />
        <main className="p-6">
          <Card className="max-w-3xl mx-auto border-slate-300/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                تم نقل الإعدادات الإدارية
              </CardTitle>
              <CardDescription>
                تم نقل جميع صفحات الإعدادات الإدارية إلى لوحة الإدارة. يمكنك متابعة الإدارة من هناك.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4" />
                الذهاب إلى لوحة الإدارة
              </Button>
              <Button variant="outline" onClick={() => router.push('/profile')}>
                الذهاب إلى الملف الشخصي والإعدادات
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
