'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAccessControl } from '@/hooks/use-access-control';

const PUBLIC_ROUTES = new Set<string>(['/login']);

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const { loading: accessLoading, canAccessPath } = useAccessControl();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = pathname ? PUBLIC_ROUTES.has(pathname) : false;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && pathname === '/login') {
      router.replace('/');
      return;
    }

    if (isAuthenticated && !isPublicRoute && pathname && !accessLoading && !canAccessPath(pathname)) {
      router.replace('/profile');
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname, router, accessLoading, canAccessPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        جاري التحقق من الجلسة...
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        تحويل إلى صفحة تسجيل الدخول...
      </div>
    );
  }

  if (isAuthenticated && pathname === '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        تحويل إلى الصفحة الرئيسية...
      </div>
    );
  }

  if (isAuthenticated && !isPublicRoute && accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (isAuthenticated && !isPublicRoute && pathname && !canAccessPath(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        لا تملك صلاحية الوصول لهذه الصفحة. جار التحويل...
      </div>
    );
  }

  return <>{children}</>;
}
