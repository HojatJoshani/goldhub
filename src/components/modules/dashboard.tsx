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
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6 h-80" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            داشبورد مدیریتی
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            خلاصه عملکرد فروشگاه در ۳۰ روز گذشته
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <ArrowLeft className="w-4 h-4 ml-1" />
          به‌روزرسانی
        </Button>
      </div>

      {/* Live Gold Prices Ticker */}
      <Card className="overflow-hidden border-amber-200 dark:border-amber-900">
        <CardContent className="p-0">
          <div className="flex items-center bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <div className="bg-amber-500 text-white px-4 py-2 font-bold text-sm flex items-center gap-2 shrink-0">
              <Crown className="w-4 h-4" />
              قیمت زنده طلا
            </div>
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-6 px-4 py-2 whitespace-nowrap">
                {goldPrices.map((g) => (
                  <div key={g.karat} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                      {karatLabel(g.karat)}
                    </Badge>
                    <span className="font-semibold">{formatNumber(g.price)}</span>
                    <span className="text-muted-foreground text-xs">تومان/گرم</span>
                  </div>
                ))}
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  به‌روزرسانی {formatRelativeTime(goldPrices[0]?.updatedAt)}
                </div>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">نمودار فروش</CardTitle>
            <CardDescription>روند فروش در ۱۴ روز اخیر</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${toPersianDigits(Math.round(v / 1000000))}م`}
                  width={50}
                />
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={{ direction: "rtl", borderRadius: "8px" }}
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
          </CardContent>
        </Card>

        {/* Karat distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزیع عیارها</CardTitle>
            <CardDescription>بر اساس وزن طلا</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={karatPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {karatPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatWeight(value)}
                  contentStyle={{ direction: "rtl", borderRadius: "8px" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", direction: "rtl" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">پرفروش‌ترین محصولات</CardTitle>
            <CardDescription>۳۰ روز گذشته</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.topProducts} layout="vertical" margin={{ right: 20, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${toPersianDigits(Math.round(v / 1000000))}م`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                />
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={{ direction: "rtl", borderRadius: "8px" }}
                />
                <Bar dataKey="revenue" name="درآمد" fill="#D4A017" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">روش‌های پرداخت</CardTitle>
            <CardDescription>توزیع بر اساس مبلغ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentData.map((p, i) => {
                const total = paymentData.reduce((s, x) => s + x["مبلغ"], 0);
                const pct = total > 0 ? Math.round((p["مبلغ"] / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">{toPersianDigits(pct)}٪</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{formatToman(p["مبلغ"])}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">آخرین فروش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{sale.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.invoiceNumber} · {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-semibold text-sm">{formatToman(sale.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(sale.createdAt)}</p>
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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              هشدارها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border text-sm ${
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
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              محصولات رو به اتمام
              <Badge variant="secondary">{toPersianDigits(lowStockProducts.length)} مورد</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20"
                >
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{karatLabel(p.karat)}</p>
                  </div>
                  <Badge variant="destructive">{toPersianDigits(p.stock)} عدد</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${growth >= 0 ? "text-green-600" : "text-destructive"}`}>
              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {toPersianDigits(Math.abs(growth))}٪
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-xl font-bold truncate">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
