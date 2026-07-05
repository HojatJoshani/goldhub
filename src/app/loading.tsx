export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-amber-200 dark:border-amber-900" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">در حال بارگذاری گلد هاب...</p>
      </div>
    </div>
  );
}
