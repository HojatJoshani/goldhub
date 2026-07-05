import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-bold gold-text">۴۰۴</div>
        <h1 className="text-2xl font-bold text-foreground">صفحه یافت نشد</h1>
        <p className="text-sm text-muted-foreground">
          صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
