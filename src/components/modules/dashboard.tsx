"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  Crown,
  ArrowLeft,
  Bell,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  formatToman,
  formatNumber,
  formatWeight,
  toPersianDigits,
  formatRelativeTime,
  karatLabel,
} from "@/lib/persian";
import { LiveGoldTicker } from "@/components/live-gold-ticker";
import { GoldPricePanel } from "@/components/gold-price-panel";

interface DashboardData {
  kpis: {
    totalSales: number;
    todaySales: number;
    salesCount: number;
    salesGrowth: number;
    inventoryValue: number;
    inventoryRetailValue: number;
    totalGoldWeight: number;
    lowStockCount: number;
    outOfStockCount: number;
    customersCount: number;
    newCustomers: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
  };
  charts: {
    dailySales: { date: string; total: number; count: number }[];
    karatDistribution: { karat: string; count: number; weight: number }[];
    paymentMethods: { method: string; amount: number }[];
    topProducts: { name: string; revenue: number; quantity: number }[];
  };
  goldPrices: { karat: string; price: number; updatedAt: string }[];
  alerts: any[];
  recentSales: any[];
  lowStockProducts: any[];
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدی",
  card: "کارتی",
  transfer: "انتقال",
  gold: "طلا",
  mixed: "ترکیبی",
};

const PIE_COLORS = ["#D4A017", "#E6B838", "#F0D060", "#A87C10", "#8B6914"];

export function DashboardModule() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      if (res.ok) setData(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-5 h-24 sm:h-32" />
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-3 sm:p-6 h-64 sm:h-80" />
        </Card>
      </div>
    );
  }

  const { kpis, charts, goldPrices, alerts, recentSales, lowStockProducts } = data;

  const dailyChartData = charts.dailySales.map((d) => ({
    name: new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(new Date(d.date)),
    فروش: d.total,
    تعداد: d.count,
  }));

  const karatPieData = charts.karatDistribution.map((k) => ({
    name: karatLabel(k.karat),
    value: k.weight,
    karat: k.karat,
  }));

  const paymentData = charts.paymentMethods.map((p) => ({
    name: PAYMENT_LABELS[p.method] || p.method,
    مبلغ: p.amount,
  }));

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
            <span className="truncate">داشبورد مدیریتی</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            خلاصه عملکرد فروشگاه در ۳۰ روز گذشته
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="shrink-0">
          <ArrowLeft className="w-4 h-4 ml-1" />
          به‌روزرسانی
        </Button>
      </div>

      {/* Live Gold Prices Ticker */}
      <LiveGoldTicker autoRefresh refreshInterval={300} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="فروش امروز"
          value={formatToman(kpis.todaySales)}
          icon={DollarSign}
          accent="amber"
          subtitle={`${toPersianDigits(kpis.salesCount)} فاکتور در ۳۰ روز`}
        />
        <KpiCard
          title="فروش ۳۰ روز"
          value={formatToman(kpis.totalSales)}
          icon={ShoppingBag}
          accent="green"
          growth={kpis.salesGrowth}
          subtitle={`${toPersianDigits(kpis.salesCount)} تراکنش`}
        />
        <KpiCard
          title="ارزش انبار"
          value={formatToman(kpis.inventoryValue)}
          icon={Package}
          accent="purple"
          subtitle={`${formatWeight(kpis.totalGoldWeight)} طلا`}
        />
        <KpiCard
          title="سود خالص"
          value={formatToman(kpis.netProfit)}
          icon={Wallet}
          accent="blue"
          subtitle={`حاشیه سود ${toPersianDigits(kpis.profitMargin)}٪`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">نمودار فروش</CardTitle>
            <CardDescription className="text-xs sm:text-sm">روند فروش در ۱۴ روز اخیر</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="chart-container min-h-[200px] sm:min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${toPersianDigits(Math.round(v / 1000000))}م`}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number) => formatToman(value)}
                    contentStyle={{ direction: "rtl", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="فروش"
                    stroke="#D4A017"
                    strokeWidth={2}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Karat distribution */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">توزیع عیارها</CardTitle>
            <CardDescription className="text-xs sm:text-sm">بر اساس وزن طلا</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="chart-container min-h-[200px] sm:min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <PieChart>
                  <Pie
                    data={karatPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {karatPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatWeight(value)}
                    contentStyle={{ direction: "rtl", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">پرفروش‌ترین محصولات</CardTitle>
            <CardDescription className="text-xs sm:text-sm">۳۰ روز گذشته</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="chart-container min-h-[200px] sm:min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <BarChart data={charts.topProducts} layout="vertical" margin={{ right: 10, left: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${toPersianDigits(Math.round(v / 1000000))}م`}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                  />
                  <Tooltip
                    formatter={(value: number) => formatToman(value)}
                    contentStyle={{ direction: "rtl", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="revenue" name="درآمد" fill="#D4A017" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">روش‌های پرداخت</CardTitle>
            <CardDescription className="text-xs sm:text-sm">توزیع بر اساس مبلغ</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              {paymentData.map((p, i) => {
                const total = paymentData.reduce((s, x) => s + x["مبلغ"], 0);
                const pct = total > 0 ? Math.round((p["مبلغ"] / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground tabular-nums">{toPersianDigits(pct)}٪</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{formatToman(p["مبلغ"])}</p>
                  </div>
                );
              })}
              {paymentData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">داده‌ای موجود نیست</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recent sales */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">آخرین فروش‌ها</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ScrollArea className="max-h-80 sm:max-h-96">
              <div className="space-y-1.5 sm:space-y-2">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{sale.customer}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {sale.invoiceNumber} · {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-semibold text-xs sm:text-sm tabular-nums">{formatToman(sale.total)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{formatRelativeTime(sale.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {recentSales.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">فروشی ثبت نشده است</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              هشدارها
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ScrollArea className="max-h-80 sm:max-h-96">
              <div className="space-y-1.5 sm:space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm ${
                      alert.severity === "critical"
                        ? "bg-destructive/10 border-destructive/20"
                        : alert.severity === "warning"
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          alert.severity === "critical"
                            ? "text-destructive"
                            : alert.severity === "warning"
                            ? "text-amber-500"
                            : "text-blue-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">هشداری موجود نیست</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Low stock */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>محصولات رو به اتمام</span>
              <Badge variant="secondary">{toPersianDigits(lowStockProducts.length)} مورد</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{p.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{karatLabel(p.karat)}</p>
                  </div>
                  <Badge variant="destructive" className="shrink-0 tabular-nums">{toPersianDigits(p.stock)} عدد</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Gold Price Panel */}
      <GoldPricePanel />
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  growth,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  accent: "amber" | "green" | "purple" | "blue";
  growth?: number;
  subtitle?: string;
}) {
  const accentColors = {
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
    blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600",
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium ${growth >= 0 ? "text-green-600" : "text-destructive"}`}>
              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {toPersianDigits(Math.abs(growth))}٪
            </div>
          )}
        </div>
        <p className="text-[11px] sm:text-sm text-muted-foreground mb-1 truncate">{title}</p>
        <p className="text-base sm:text-xl font-bold truncate tabular-nums">{value}</p>
        {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
