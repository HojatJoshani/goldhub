"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">خطایی رخ داد</h1>
          <p className="text-sm text-muted-foreground">
            متأسفانه خطایی در برنامه رخ داد. لطفاً دوباره تلاش کنید.
          </p>
          {error?.message && (
            <details className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg" dir="ltr">
              <summary className="cursor-pointer">جزئیات خطا</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    </div>
  );
}
