'use client';

/**
 * API Registry Page — /api-registry
 *
 * صفحة موحّدة تعرض جميع نقاط الربط (Endpoints) في المشروع مع الصفحات
 * المستهلكة لها ومصادر البيانات الثابتة. تعتمد كلياً على:
 *   - `@/lib/market-hub` (نطاقات بيانات السوق)
 *   - `@/lib/market-hub/account-registry` (نطاقات الحساب والمنصّة)
 *
 * أي صفحة أو API يُضاف إلى أي من السجلّين سيظهر هنا تلقائياً.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import {
  MARKET_DOMAINS,
  ACCOUNT_DOMAINS,
  EXTERNAL_SOURCES,
  SOURCE_CATEGORIES,
  PAGES,
  PAGE_CATEGORIES,
  type DomainRegistryEntry,
  type AccountRegistryEntry,
  type ExternalSource,
  type SourceCategory,
  type PageEntry,
  type PageCategory,
} from '@/lib/market-hub';
import {
  Search,
  ExternalLink,
  Database,
  Network,
  Layers,
  Link as LinkIcon,
  RefreshCw,
  Lock,
  LockOpen,
  FileCode,
  FileText,
  Globe,
  ShieldCheck,
  Key,
  Star,
  Newspaper,
  Building2,
  Bitcoin,
  BarChart3,
  BookOpen,
} from 'lucide-react';

type MarketEntry = DomainRegistryEntry;
type AccountEntry = AccountRegistryEntry;

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function categoryIcon(cat: SourceCategory) {
  const cls = 'h-4 w-4 text-primary';
  switch (cat) {
    case 'quote_provider': return <BarChart3 className={cls} />;
    case 'crypto_provider': return <Bitcoin className={cls} />;
    case 'official_exchange': return <Building2 className={cls} />;
    case 'index_provider': return <BarChart3 className={cls} />;
    case 'news': return <Newspaper className={cls} />;
    case 'regulator': return <ShieldCheck className={cls} />;
    case 'reference': return <BookOpen className={cls} />;
  }
}

function formatRefresh(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} ث`;
  if (ms < 60 * 60_000) return `${Math.round(ms / 60_000)} د`;
  return `${Math.round(ms / (60 * 60_000))} س`;
}

export default function ApiRegistryPage() {
  const { user, isLoading } = useAuth();
  const [query, setQuery] = useState('');

  const marketList = useMemo<MarketEntry[]>(
    () =>
      Object.values(MARKET_DOMAINS).filter((d) =>
        matches(query, d.id, d.labelAr, d.labelEn, d.sourceEndpoint, d.description, ...d.pages),
      ),
    [query],
  );

  const accountList = useMemo<AccountEntry[]>(
    () =>
      Object.values(ACCOUNT_DOMAINS).filter((d) =>
        matches(query, d.id, d.labelAr, d.labelEn, d.endpoint, d.description, ...d.pages),
      ),
    [query],
  );

  const sourcesList = useMemo<ExternalSource[]>(
    () =>
      EXTERNAL_SOURCES.filter((s) =>
        matches(query, s.id, s.labelAr, s.labelEn, s.url, s.notes, s.category, ...s.domains),
      ),
    [query],
  );

  const pagesList = useMemo<PageEntry[]>(
    () =>
      PAGES.filter((p) =>
        matches(
          query,
          p.path,
          p.labelAr,
          p.labelEn,
          p.description,
          p.category,
          ...(p.marketDomains ?? []),
          ...(p.accountDomains ?? []),
        ),
      ),
    [query],
  );

  const pagesByCategory = useMemo(() => {
    const grouped = new Map<PageCategory, PageEntry[]>();
    for (const p of pagesList) {
      const arr = grouped.get(p.category) ?? [];
      arr.push(p);
      grouped.set(p.category, arr);
    }
    return grouped;
  }, [pagesList]);

  const sourcesByCategory = useMemo(() => {
    const grouped = new Map<SourceCategory, ExternalSource[]>();
    for (const s of sourcesList) {
      const arr = grouped.get(s.category) ?? [];
      arr.push(s);
      grouped.set(s.category, arr);
    }
    return grouped;
  }, [sourcesList]);

  const stats = useMemo(() => {
    const mdCount = Object.keys(MARKET_DOMAINS).length;
    const acCount = Object.keys(ACCOUNT_DOMAINS).length;
    const pagesSet = new Set<string>();
    for (const d of Object.values(MARKET_DOMAINS)) d.pages.forEach((p) => pagesSet.add(p));
    for (const d of Object.values(ACCOUNT_DOMAINS)) d.pages.forEach((p) => pagesSet.add(p));
    const endpointsSet = new Set<string>();
    for (const d of Object.values(MARKET_DOMAINS)) endpointsSet.add(d.sourceEndpoint);
    for (const d of Object.values(ACCOUNT_DOMAINS)) endpointsSet.add(d.endpoint);
    return {
      marketDomains: mdCount,
      accountDomains: acCount,
      totalPages: pagesSet.size,
      totalEndpoints: endpointsSet.size,
      externalSources: EXTERNAL_SOURCES.length,
      totalRegistered: PAGES.length,
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />
        <div className="mr-16 lg:mr-64 p-6">جارٍ التحقق من الصلاحيات…</div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />
        <div className="mr-16 lg:mr-64 p-6">
          <Card>
            <CardContent className="py-10 text-center">
              <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">صفحة خاصة بالإدارة</h2>
              <p className="text-muted-foreground">
                هذه الصفحة متاحة لحسابات المشرفين فقط.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="سجل APIs الموحّد" />
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Network className="h-6 w-6 text-primary" />
                السجل الموحّد لنقاط الربط
              </h1>
              <p className="text-muted-foreground mt-1 max-w-3xl">
                مصدر الحقيقة الوحيد (Single Source of Truth) لكل APIs المشروع — بيانات
                السوق وبيانات الحساب. أي صفحة جديدة أو endpoint جديد يُضاف إلى السجلّين
                في <code className="px-1 py-0.5 rounded bg-muted text-[11px]">src/lib/market-hub/</code> يظهر هنا تلقائياً.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/api/market-hub?domain=all" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 ml-2" />
                اختبار /api/market-hub
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">نطاقات بيانات السوق</p>
                <p className="text-2xl font-bold">{stats.marketDomains}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">نطاقات الحساب والمنصّة</p>
                <p className="text-2xl font-bold">{stats.accountDomains}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Endpoints فريدة</p>
                <p className="text-2xl font-bold">{stats.totalEndpoints}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">صفحات مرتبطة</p>
                <p className="text-2xl font-bold">{stats.totalPages}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">مصادر خارجية موثوقة</p>
                <p className="text-2xl font-bold">{stats.externalSources}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">صفحات مسجّلة</p>
                <p className="text-2xl font-bold">{stats.totalRegistered}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="py-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث باسم النطاق، endpoint، صفحة…"
                  className="pr-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="pages" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="pages" className="gap-2">
                <FileText className="h-4 w-4" />
                جميع صفحات المشروع ({pagesList.length})
              </TabsTrigger>
              <TabsTrigger value="market" className="gap-2">
                <Database className="h-4 w-4" />
                بيانات السوق ({marketList.length})
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <Layers className="h-4 w-4" />
                الحساب والمنصّة ({accountList.length})
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-2">
                <Globe className="h-4 w-4" />
                المصادر الخارجية ({sourcesList.length})
              </TabsTrigger>
            </TabsList>

            {/* All Project Pages — bi-directional link: page → APIs */}
            <TabsContent value="pages" className="space-y-6">
              {pagesList.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    لا توجد صفحات مطابقة.
                  </CardContent>
                </Card>
              )}
              {Array.from(pagesByCategory.entries()).map(([cat, pages]) => (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{PAGE_CATEGORIES[cat].labelAr}</h2>
                    <Badge variant="outline" className="text-[10px]">{pages.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pages.map((p) => (
                      <Card key={p.path} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                              <CardTitle className="text-sm">{p.labelAr}</CardTitle>
                              <code className="text-[11px] text-muted-foreground" dir="ltr">
                                {p.path}
                              </code>
                            </div>
                            <div className="flex items-center gap-1">
                              {p.requiredRole === 'admin' && (
                                <Badge variant="default" className="text-[10px] gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  admin
                                </Badge>
                              )}
                              {p.dynamic && (
                                <Badge variant="outline" className="text-[10px]">dynamic</Badge>
                              )}
                              {!p.dynamic && (
                                <Link href={p.path}>
                                  <Badge variant="secondary" className="text-[10px] gap-1 hover:bg-primary/20 cursor-pointer">
                                    <ExternalLink className="h-3 w-3" />
                                    زيارة
                                  </Badge>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <p className="text-muted-foreground leading-relaxed">{p.description}</p>

                          {p.marketDomains && p.marketDomains.length > 0 && (
                            <div className="flex items-start gap-1 flex-wrap">
                              <span className="text-muted-foreground min-w-fit pt-0.5">بيانات سوق:</span>
                              {p.marketDomains.map((d) => (
                                <Badge key={d} variant="outline" className="text-[10px]">
                                  {MARKET_DOMAINS[d]?.labelAr ?? d}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {p.accountDomains && p.accountDomains.length > 0 && (
                            <div className="flex items-start gap-1 flex-wrap">
                              <span className="text-muted-foreground min-w-fit pt-0.5">APIs حساب:</span>
                              {p.accountDomains.map((a) => (
                                <Badge key={a} variant="secondary" className="text-[10px]" dir="ltr">
                                  {ACCOUNT_DOMAINS[a]?.endpoint ?? a}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {(!p.marketDomains || p.marketDomains.length === 0) &&
                            (!p.accountDomains || p.accountDomains.length === 0) && (
                              <p className="text-[10px] text-muted-foreground italic">
                                صفحة عرض ثابتة — لا تستهلك APIs مباشرة.
                              </p>
                            )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Market domains */}
            <TabsContent value="market" className="space-y-3">
              {marketList.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    لا توجد نطاقات مطابقة.
                  </CardContent>
                </Card>
              )}
              {marketList.map((d) => (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {d.labelAr}
                          <Badge variant="outline" className="text-[10px]">{d.id}</Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {formatRefresh(d.refreshMs)}
                        </Badge>
                        <a
                          href={`/api/market-hub?domain=${d.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          اختبار <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground text-xs">المصدر الخلفي:</span>
                      <code className="px-2 py-0.5 rounded bg-muted text-xs" dir="ltr">
                        {d.sourceEndpoint}
                      </code>
                      {d.pricesCategory && (
                        <Badge variant="outline" className="text-[10px]">
                          category={d.pricesCategory}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-muted-foreground text-xs min-w-fit pt-0.5">الصفحات:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {d.pages.map((p) => {
                          const isDynamic = p.includes('[');
                          return isDynamic ? (
                            <Badge key={p} variant="outline" className="text-[10px] gap-1">
                              <LinkIcon className="h-3 w-3" />
                              {p}
                            </Badge>
                          ) : (
                            <Link key={p} href={p}>
                              <Badge variant="outline" className="text-[10px] gap-1 hover:bg-primary/10 cursor-pointer">
                                <LinkIcon className="h-3 w-3" />
                                {p}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {d.components && d.components.length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-muted-foreground text-xs min-w-fit pt-0.5">المكوّنات:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {d.components.map((c) => (
                            <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {d.staticData && d.staticData.length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-muted-foreground text-xs min-w-fit pt-0.5">بيانات ثابتة:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {d.staticData.map((f) => (
                            <Badge key={f} variant="outline" className="text-[10px] gap-1" dir="ltr">
                              <FileCode className="h-3 w-3" />
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <code className="text-[11px] text-muted-foreground" dir="ltr">
                        useMarketHub({'{'} domain: &apos;{d.id}&apos; {'}'})
                      </code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Account domains */}
            <TabsContent value="account" className="space-y-3">
              {accountList.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    لا توجد نطاقات مطابقة.
                  </CardContent>
                </Card>
              )}
              {accountList.map((d) => (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {d.labelAr}
                          <Badge variant="outline" className="text-[10px]">{d.id}</Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                      </div>
                      <Badge
                        variant={d.requiresAuth ? 'default' : 'secondary'}
                        className="gap-1 text-[10px]"
                      >
                        {d.requiresAuth ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                        {d.requiresAuth ? 'يتطلب تسجيل دخول' : 'عام'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground text-xs">Endpoint:</span>
                      <code className="px-2 py-0.5 rounded bg-muted text-xs" dir="ltr">
                        {d.endpoint}
                      </code>
                      <div className="flex gap-1">
                        {d.methods.map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px]" dir="ltr">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-muted-foreground text-xs min-w-fit pt-0.5">الصفحات:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {d.pages.map((p) => (
                          <Link key={p} href={p}>
                            <Badge variant="outline" className="text-[10px] gap-1 hover:bg-primary/10 cursor-pointer">
                              <LinkIcon className="h-3 w-3" />
                              {p}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <code className="text-[11px] text-muted-foreground" dir="ltr">
                        getAccountDomain(&apos;{d.id}&apos;).endpoint
                      </code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* External sources */}
            <TabsContent value="sources" className="space-y-6">
              {sourcesList.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    لا توجد مصادر مطابقة.
                  </CardContent>
                </Card>
              )}
              {Array.from(sourcesByCategory.entries()).map(([category, sources]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {categoryIcon(category)}
                    <h2 className="text-lg font-semibold">
                      {SOURCE_CATEGORIES[category].labelAr}
                    </h2>
                    <Badge variant="outline" className="text-[10px]">{sources.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {sources.map((s) => (
                      <Card key={s.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-sm flex items-center gap-1.5">
                                {s.labelAr}
                              </CardTitle>
                              <p className="text-[11px] text-muted-foreground" dir="ltr">{s.labelEn}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: s.reliability }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline break-all"
                            dir="ltr"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {s.url.replace(/^https?:\/\//, '')}
                          </a>

                          <div className="flex flex-wrap items-center gap-1">
                            <Badge
                              variant={s.requiresApiKey ? 'default' : 'secondary'}
                              className="gap-1 text-[10px]"
                            >
                              {s.requiresApiKey ? <Key className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                              {s.requiresApiKey ? 'يحتاج API key' : 'وصول عام'}
                            </Badge>
                          </div>

                          <div className="flex items-start gap-1 flex-wrap">
                            <span className="text-muted-foreground">يغذّي:</span>
                            {s.domains.map((d) => (
                              <Badge key={d} variant="outline" className="text-[10px]">
                                {MARKET_DOMAINS[d]?.labelAr ?? d}
                              </Badge>
                            ))}
                          </div>

                          {s.notes && (
                            <p className="text-muted-foreground border-t pt-2 leading-relaxed">
                              {s.notes}
                            </p>
                          )}

                          {s.termsUrl && (
                            <a
                              href={s.termsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                            >
                              شروط الاستخدام <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
