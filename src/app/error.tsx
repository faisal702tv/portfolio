'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-3xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="text-muted-foreground max-w-md">
          {process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'نعتذر عن هذا الخطأ. حاول تحديث الصفحة.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          إعادة المحاولة
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="block mx-auto text-muted-foreground hover:text-foreground underline"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
