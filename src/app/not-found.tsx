import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="text-8xl">🔍</div>
        <h1 className="text-4xl font-bold text-foreground">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
