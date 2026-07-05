"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Activity,
  History,
  DollarSign,
  Coins,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  formatNumber,
  formatToman,
  toPersianDigits,
  formatPersianDateTime,
  formatRelativeTime,
  karatLabel,
  KARAT_LABELS,
} from "@/lib/persian";

interface LivePrice {
  karat: string;
  label: string;
  pricePerGram: number;
  changePercent?: number;
  updatedAt: string;
  source: string;
}

interface HistoryItem {
  time: string;
  price: number;
  source: string;
}

interface HistoryStats {
  current: number;
  min: number;
  max: number;
  avg: number;
  change: number;
  changePercent: number;
  count: number;
}

const KARAT_OPTIONS = [
  { value: "750", label: "۱۸ عیار (۷۵۰)" },
  { value: "999", label: "۲۴ عیار (۹۹۹)" },
  { value: "916", label: "۲۲ عیار (۹۱۶)" },
  { value: "585", label: "۱۴ عیار (۵۸۵)" },
];

export function GoldPricePanel() {
  const [liveData, setLiveData] = React.useState<{
    prices: LivePrice[];
    coins?: { name: string; price: number }[];
    ounce?: { price: number };
    dollar?: { price: number };
    fetchedAt: string;
    source: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // History state
  const [history, setHistory] = React.useState<Record<string, HistoryItem[]>>({});
  const [stats, setStats] = React.useState<Record<string, HistoryStats>>({});
  const [selectedKarat, setSelectedKarat] = React.useState("750");
  const [historyDays, setHistoryDays] = React.useState("7");
  const [historyLoading, setHistoryLoading] = React.useState(true);

  const fetchLive = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/gold-prices/live");
      const json = await res.json();
      if (res.ok) {
        setLiveData(json);
      }
    } catch (error) {
      console.error("Error fetching live prices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = React.useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(
        `/api/gold-prices/history?days=${historyDays}`
      );
      const json = await res.json();
      if (res.ok) {
        setHistory(json.history || {});
        setStats(json.stats || {});
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyDays]);

  React.useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = async () => {
    await fetchLive();
    await fetchHistory();
  };

  const isLive = liveData?.source?.includes("web-search") || liveData?.source?.includes("mini-service");
  const prices = liveData?.prices || [];

  // Chart data for selected karat
  const chartData = (history[selectedKarat] || []).map((h) => ({
    time: new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(h.time)),
    قیمت: h.price,
    timestamp: h.time,
  }));

  const currentStats = stats[selectedKarat];

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                قیمت زنده طلا
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {isLive ? (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <Wifi className="w-3 h-3" />
                    متصل به منابع زنده - به‌روزرسانی هر ۵ دقیقه
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <WifiOff className="w-3 h-3" />
                    داده‌های محلی
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              به‌روزرسانی
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live" className="text-xs sm:text-sm">
            <Activity className="w-3.5 h-3.5 sm:ml-1" />
            <span className="hidden sm:inline">قیمت لحظه‌ای</span>
            <span className="sm:hidden">لحظه‌ای</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="w-3.5 h-3.5 sm:ml-1" />
            <span className="hidden sm:inline">نمودار تاریخچه</span>
            <span className="sm:hidden">تاریخچه</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">
            <Database className="w-3.5 h-3.5 sm:ml-1" />
            <span className="hidden sm:inline">جزئیات</span>
            <span className="sm:hidden">جزئیات</span>
          </TabsTrigger>
        </TabsList>

        {/* Live prices tab */}
        <TabsContent value="live" className="space-y-4 mt-4">
          {/* Price cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {prices.map((p) => (
              <Card key={p.karat} className="overflow-hidden border-amber-200 dark:border-amber-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                      {karatLabel(p.karat)}
                    </Badge>
                    {p.changePercent !== undefined && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${p.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {toPersianDigits(Math.abs(p.changePercent))}٪
                      </span>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl font-bold tabular-nums ltr-num">
                    {formatNumber(p.pricePerGram)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">تومان بر گرم</p>
                  <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelativeTime(p.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
            {prices.length === 0 && !loading && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  قیمتی یافت نشد. روی به‌روزرسانی کلیک کنید.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Extra market info */}
          {(liveData?.dollar || liveData?.ounce || liveData?.coins) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  بازار جهانی و ارز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {liveData?.dollar && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium">دلار آزاد</span>
                      </div>
                      <p className="text-base font-bold tabular-nums ltr-num">
                        {formatNumber(liveData.dollar.price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">تومان</p>
                    </div>
                  )}
                  {liveData?.ounce && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Coins className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-medium">اونس طلا</span>
                      </div>
                      <p className="text-base font-bold tabular-nums ltr-num">
                        {formatNumber(liveData.ounce.price, 2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">دلار</p>
                    </div>
                  )}
                  {liveData?.coins?.[0] && (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-medium">{liveData.coins[0].name}</span>
                      </div>
                      <p className="text-base font-bold tabular-nums ltr-num">
                        {formatNumber(liveData.coins[0].price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">تومان</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {liveData && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <Clock className="w-3 h-3" />
              <span>آخرین به‌روزرسانی: {formatPersianDateTime(liveData.fetchedAt)}</span>
              <span>•</span>
              <span>منبع: {liveData.source}</span>
            </div>
          )}
        </TabsContent>

        {/* History chart tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    نمودار تاریخچه قیمت طلا
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedKarat} onValueChange={setSelectedKarat}>
                    <SelectTrigger className="w-32 sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KARAT_OPTIONS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={historyDays} onValueChange={setHistoryDays}>
                    <SelectTrigger className="w-24 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">۲۴ ساعت</SelectItem>
                      <SelectItem value="7">۷ روز</SelectItem>
                      <SelectItem value="14">۱۴ روز</SelectItem>
                      <SelectItem value="30">۳۰ روز</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">قیمت فعلی</p>
                    <p className="text-sm font-bold tabular-nums ltr-num">
                      {formatNumber(currentStats.current)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">میانگین</p>
                    <p className="text-sm font-bold tabular-nums ltr-num">
                      {formatNumber(currentStats.avg)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">بالاترین</p>
                    <p className="text-sm font-bold tabular-nums ltr-num text-green-600">
                      {formatNumber(currentStats.max)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">پایین‌ترین</p>
                    <p className="text-sm font-bold tabular-nums ltr-num text-red-600">
                      {formatNumber(currentStats.min)}
                    </p>
                  </div>
                </div>
              )}

              <div className="chart-container min-h-[300px] sm:min-h-[400px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="goldHistGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="time"
                        className="text-xs"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${toPersianDigits(Math.round(v / 1000000))}م`}
                        width={50}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value: number) => formatToman(value)}
                        contentStyle={{ direction: "rtl", borderRadius: "8px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="قیمت"
                        stroke="#D4A017"
                        strokeWidth={2}
                        fill="url(#goldHistGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {historyLoading ? "در حال بارگذاری..." : "داده‌ای برای نمایش وجود ندارد"}
                  </div>
                )}
              </div>

              {currentStats && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="text-sm">
                    <span className="text-muted-foreground">تغییر در {toPersianDigits(parseInt(historyDays))} روز: </span>
                    <span className={`font-bold ${currentStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {currentStats.change >= 0 ? "+" : ""}{formatNumber(currentStats.change)} تومان
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">درصد تغییر: </span>
                    <span className={`font-bold ${currentStats.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {currentStats.changePercent >= 0 ? "+" : ""}{toPersianDigits(currentStats.changePercent)}٪
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                آمار پایگاه داده
              </CardTitle>
              <CardDescription>
                مجموع {toPersianDigits(Object.values(history).reduce((s, arr) => s + arr.length, 0))} رکورد قیمت
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {KARAT_OPTIONS.map((k) => {
                  const s = stats[k.value];
                  const count = history[k.value]?.length || 0;
                  return (
                    <div key={k.value} className="p-3 rounded-lg border">
                      <p className="text-xs font-medium mb-2">{k.label}</p>
                      {s ? (
                        <>
                          <p className="text-sm font-bold tabular-nums ltr-num mb-1">
                            {formatNumber(s.current)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {toPersianDigits(count)} رکورد
                          </p>
                          <p className={`text-[10px] font-medium ${s.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {s.changePercent >= 0 ? "+" : ""}{toPersianDigits(s.changePercent)}٪
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">داده‌ای نیست</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {liveData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اطلاعات منبع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">منبع داده:</span>
                  <span className="font-medium">{liveData.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">زمان دریافت:</span>
                  <span className="font-medium">{formatPersianDateTime(liveData.fetchedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تعداد قیمت‌ها:</span>
                  <span className="font-medium">{toPersianDigits(liveData.prices.length)} مورد</span>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                  <p className="font-medium mb-1">نکته:</p>
                  <p className="text-muted-foreground">
                    قیمت‌ها به‌طور خودکار هر ۳۰ دقیقه توسط سرویس پس‌زمینه به‌روزرسانی می‌شوند.
                    منبع داده‌ها جستجوی وب از سایت‌های معتبر ایرانی (tgju، iranjib، taline و ...) است.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
