"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Trash2,
  Building2,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  ShoppingBag,
  AlertCircle,
  Calendar,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatToman,
  toPersianDigits,
  formatPersianDate,
  formatPersianDateTime,
} from "@/lib/persian";

// ============ Types ============

interface CashboxListItem {
  id: string;
  name: string;
  balance: number;
  openingBalance: number;
  closingBalance: number;
  status: string;
  openedAt?: string | null;
  closedAt?: string | null;
  branch: { id: string; name: string; code: string };
  transactionsCount: number;
}

interface CashboxTransaction {
  id: string;
  type: string;
  amount: number;
  method: string;
  description?: string | null;
  refId?: string | null;
  createdAt: string;
}

interface CashboxDetail extends CashboxListItem {
  transactions: CashboxTransaction[];
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
}

interface SummaryData {
  kpis: {
    totalIncome30: number;
    totalExpenses30: number;
    netProfit: number;
    profitMargin: number;
    totalCashboxBalance: number;
    salesCount30: number;
  };
  cashboxes: {
    id: string;
    name: string;
    balance: number;
    status: string;
    branch: { id: string; name: string };
  }[];
  expensesByCategory: { category: string; amount: number }[];
  daily: { date: string; income: number; expenses: number }[];
  branchPerformance: {
    id: string;
    name: string;
    code: string;
    isWarehouse: boolean;
    isMain: boolean;
    sales: number;
  }[];
}

interface BranchOption {
  id: string;
  name: string;
  code: string;
  isWarehouse: boolean;
  isMain: boolean;
}

// ============ Constants ============

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: "اجاره",
  salary: "حقوق",
  utilities: "قبوض",
  supplies: "تجهیزات",
  marketing: "تبلیغات",
  other: "سایر",
};

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  rent: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  salary: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  utilities: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900",
  supplies: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900",
  marketing: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900",
  other: "bg-stone-100 text-stone-700 dark:bg-stone-900/40 dark:text-stone-300 border-stone-200 dark:border-stone-800",
};

const TX_TYPE_LABELS: Record<string, string> = {
  sale: "فروش",
  expense: "هزینه",
  deposit: "واریز",
  withdrawal: "برداشت",
  transfer: "انتقال",
};

const TX_TYPE_ICONS: Record<string, any> = {
  sale: ShoppingBag,
  expense: Receipt,
  deposit: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  transfer: ArrowLeftRight,
};

const TX_TYPE_COLORS: Record<string, string> = {
  sale: "text-emerald-600",
  deposit: "text-emerald-600",
  transfer: "text-emerald-600",
  expense: "text-rose-600",
  withdrawal: "text-rose-600",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدی",
  card: "کارتی",
  transfer: "انتقال",
};

const PIE_COLORS = ["#D4A017", "#10B981", "#0EA5E9", "#A855F7", "#F43F5E", "#78716C"];

// ============ Main Component ============

export function AccountingModule() {
  const [tab, setTab] = React.useState("summary");

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              حسابداری و مالی
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              خلاصه مالی، مدیریت صندوق فروش و هزینه‌ها
            </p>
          </div>
          <TabsList className="h-auto w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <TabsTrigger value="summary" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">خلاصه مالی</span>
              <span className="xs:hidden">خلاصه</span>
            </TabsTrigger>
            <TabsTrigger value="cashbox" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
              <Coins className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">صندوق فروش</span>
              <span className="xs:hidden">صندوق</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
              <Receipt className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">هزینه‌ها</span>
              <span className="xs:hidden">هزینه‌ها</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summary" className="mt-6">
          <SummaryTab />
        </TabsContent>
        <TabsContent value="cashbox" className="mt-6">
          <CashboxTab />
        </TabsContent>
        <TabsContent value="expenses" className="mt-6">
          <ExpensesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Summary Tab ============

function SummaryTab() {
  const [data, setData] = React.useState<SummaryData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounting/summary", { cache: "no-store" });
      const d = await res.json();
      if (res.ok) setData(d);
      else toast.error(d.error || "خطا در دریافت خلاصه مالی");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-5 h-28 sm:h-32">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-5 h-64 sm:h-80">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5 h-64 sm:h-80">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { kpis, expensesByCategory, daily } = data;

  const dailyChartData = daily.map((d) => ({
    name: new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "short",
    }).format(new Date(d.date)),
    درآمد: d.income,
    هزینه: d.expenses,
  }));

  const pieData = expensesByCategory.map((e) => ({
    name: EXPENSE_CATEGORY_LABELS[e.category] || e.category,
    value: e.amount,
    category: e.category,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">
          خلاصه عملکرد مالی در ۳۰ روز گذشته
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="shrink-0 self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
          به‌روزرسانی
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="درآمد ۳۰ روز"
          value={formatToman(kpis.totalIncome30)}
          icon={TrendingUp}
          accent="amber"
          subtitle={`${toPersianDigits(kpis.salesCount30)} فروش`}
        />
        <KpiCard
          title="هزینه‌ها ۳۰ روز"
          value={formatToman(kpis.totalExpenses30)}
          icon={TrendingDown}
          accent="rose"
          subtitle="مجموع هزینه‌های ثبت‌شده"
        />
        <KpiCard
          title="سود خالص"
          value={formatToman(kpis.netProfit)}
          icon={PiggyBank}
          accent={kpis.netProfit >= 0 ? "green" : "rose"}
          subtitle={`حاشیه سود ${toPersianDigits(kpis.profitMargin)}٪`}
        />
        <KpiCard
          title="موجودی صندوق"
          value={formatToman(kpis.totalCashboxBalance)}
          icon={Coins}
          accent="emerald"
          subtitle={`${toPersianDigits(data.cashboxes.length)} صندوق فعال`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">درآمد در برابر هزینه</CardTitle>
            <CardDescription>روند روزانه در ۱۴ روز اخیر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container min-h-[220px] sm:min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    className="text-xs"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(v) => `${toPersianDigits(Math.round(v / 1000000))}م`}
                    tick={{ fontSize: 10 }}
                    width={48}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => formatToman(value)}
                    contentStyle={{ direction: "rtl", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                    iconType="circle"
                  />
                  <Bar dataKey="درآمد" fill="#D4A017" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="هزینه" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">تفکیک هزینه‌ها</CardTitle>
            <CardDescription>بر اساس دسته‌بندی</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[220px] sm:h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                هزینه‌ای ثبت نشده است
              </div>
            ) : (
              <div className="chart-container min-h-[220px] sm:min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatToman(value)}
                      contentStyle={{ direction: "rtl", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashbox quick overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            وضعیت صندوق‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.cashboxes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.branch.name}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-semibold text-sm">{formatToman(c.balance)}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      c.status === "open"
                        ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-300"
                        : "border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-300"
                    }`}
                  >
                    {c.status === "open" ? "باز" : "بسته"}
                  </Badge>
                </div>
              </div>
            ))}
            {data.cashboxes.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-6">
                صندوقی ثبت نشده است
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  accent: "amber" | "rose" | "green" | "emerald";
  subtitle?: string;
}) {
  const accentColors = {
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
    rose: "bg-rose-100 dark:bg-rose-950/40 text-rose-600",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    emerald: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600",
  };
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-base sm:text-xl font-bold truncate">{value}</p>
        {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ============ Cashbox Tab ============

function CashboxTab() {
  const [cashboxes, setCashboxes] = React.useState<CashboxListItem[]>([]);
  const [branches, setBranches] = React.useState<BranchOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCashbox, setSelectedCashbox] = React.useState<CashboxDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [showAddTx, setShowAddTx] = React.useState(false);
  const [showAddCashbox, setShowAddCashbox] = React.useState(false);
  const [showClosing, setShowClosing] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [cbRes, brRes] = await Promise.all([
        fetch("/api/accounting/cashbox", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
      ]);
      const cbData = await cbRes.json();
      const brData = await brRes.json();
      if (cbRes.ok) setCashboxes(cbData.items || []);
      if (brRes.ok) {
        setBranches(
          (brData.items || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            isWarehouse: b.isWarehouse,
            isMain: b.isMain,
          }))
        );
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const selectCashbox = async (id: string) => {
    setDetailLoading(true);
    setSelectedCashbox(null);
    try {
      const res = await fetch(`/api/accounting/cashbox?cashboxId=${id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) setSelectedCashbox(data);
      else toast.error(data.error || "خطا در دریافت اطلاعات صندوق");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (cb: CashboxListItem) => {
    const action = cb.status === "open" ? "close" : "open";
    const opening =
      cb.status === "closed"
        ? await new Promise<number | null>((resolve) => {
            const val = window.prompt("موجودی اولیه برای باز کردن صندوق (تومان):", "0");
            if (val === null) resolve(null);
            else resolve(Number(val) || 0);
          })
        : null;
    if (opening === null) return;

    setActionLoading(cb.id + action);
    try {
      const body: any = { action, cashboxId: cb.id };
      if (action === "open") body.openingBalance = opening;
      const res = await fetch("/api/accounting/cashbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در عملیات صندوق");
        return;
      }
      toast.success(
        action === "open" ? "صندوق باز شد" : "صندوق بسته شد"
      );
      await load();
      if (selectedCashbox?.id === cb.id) await selectCashbox(cb.id);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-5 h-40 sm:h-44">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coins className="w-4 h-4" />
          مجموع موجودی صندوق‌ها:
          <Badge className="bg-amber-500 text-white">
            {formatToman(
              cashboxes.reduce((s, c) => s + c.balance, 0)
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 ml-1" />
            به‌روزرسانی
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddCashbox(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            صندوق جدید
          </Button>
        </div>
      </div>

      {cashboxes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Coins className="w-10 h-10 mx-auto mb-3 opacity-50" />
            هیچ صندوقی ثبت نشده است
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cashboxes.map((cb) => {
            const isOpen = cb.status === "open";
            return (
              <Card
                key={cb.id}
                className={
                  selectedCashbox?.id === cb.id
                    ? "border-amber-300 dark:border-amber-800 ring-1 ring-amber-200 dark:ring-amber-900"
                    : ""
                }
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isOpen
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
                            : "bg-stone-100 text-stone-500 dark:bg-stone-900/40"
                        }`}
                      >
                        <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{cb.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {cb.branch.name}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${
                        isOpen
                          ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-300"
                          : "border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-300"
                      }`}
                    >
                      {isOpen ? "باز" : "بسته"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">موجودی فعلی</p>
                    <p className="text-lg font-bold">{formatToman(cb.balance)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span>اول دوره:</span>
                      <p className="font-mono text-foreground">
                        {toPersianDigits(cb.openingBalance.toLocaleString("en-US"))}
                      </p>
                    </div>
                    <div>
                      <span>تراکنش‌ها:</span>
                      <p className="font-mono text-foreground">
                        {toPersianDigits(cb.transactionsCount)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs gap-1"
                      onClick={() => selectCashbox(cb.id)}
                      disabled={detailLoading && selectedCashbox?.id === cb.id}
                    >
                      {detailLoading && selectedCashbox?.id === cb.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Receipt className="w-3 h-3" />
                      )}
                      تراکنش‌ها
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs gap-1"
                      onClick={() => handleToggleStatus(cb)}
                      disabled={actionLoading === cb.id + "open" || actionLoading === cb.id + "close"}
                    >
                      {actionLoading === cb.id + "open" || actionLoading === cb.id + "close" ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : isOpen ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                      {isOpen ? "بستن" : "باز کردن"}
                    </Button>
                  </div>
                  {isOpen && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          selectCashbox(cb.id);
                          setShowAddTx(true);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                        تراکنش
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        onClick={() => {
                          selectCashbox(cb.id);
                          setShowClosing(true);
                        }}
                      >
                        <Lock className="w-3 h-3" />
                        تسویه روزانه
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Transactions panel */}
      {selectedCashbox && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                تراکنش‌های صندوق «{selectedCashbox.name}»
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCashbox(null)}
              >
                بستن
              </Button>
            </div>
            <CardDescription>
              موجودی فعلی: {formatToman(selectedCashbox.balance)} · شعبه:{" "}
              {selectedCashbox.branch.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : selectedCashbox.transactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                تراکنشی ثبت نشده است
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>نوع</TableHead>
                      <TableHead>توضیحات</TableHead>
                      <TableHead>روش</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCashbox.transactions.map((t) => {
                      const Icon = TX_TYPE_ICONS[t.type] || ArrowLeftRight;
                      const isIncome = ["deposit", "sale", "transfer"].includes(t.type);
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className={`flex items-center gap-2 ${TX_TYPE_COLORS[t.type] || ""}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {TX_TYPE_LABELS[t.type] || t.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {t.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {PAYMENT_METHOD_LABELS[t.method] || t.method}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`font-mono text-sm font-medium ${
                              isIncome ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isIncome ? "+" : "−"}
                            {toPersianDigits(
                              t.amount.toLocaleString("en-US")
                            )} تومان
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatPersianDateTime(t.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AddTransactionDialog
        open={showAddTx}
        onOpenChange={setShowAddTx}
        cashbox={selectedCashbox}
        onDone={() => {
          if (selectedCashbox) selectCashbox(selectedCashbox.id);
          load();
        }}
      />

      <AddCashboxDialog
        open={showAddCashbox}
        onOpenChange={setShowAddCashbox}
        branches={branches}
        onCreated={() => {
          load();
          toast.success("صندوق جدید با موفقیت ایجاد شد");
        }}
      />

      <DailyClosingDialog
        open={showClosing}
        onOpenChange={setShowClosing}
        cashbox={selectedCashbox}
        onDone={() => {
          setSelectedCashbox(null);
          load();
        }}
      />
    </div>
  );
}

function AddTransactionDialog({
  open,
  onOpenChange,
  cashbox,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cashbox: CashboxDetail | null;
  onDone: () => void;
}) {
  const [type, setType] = React.useState("deposit");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("cash");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setType("deposit");
    setAmount("");
    setMethod("cash");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!cashbox) return;
    const amt = Number(amount.replace(/,/g, ""));
    if (!amt || amt <= 0) {
      toast.error("مبلغ معتبر وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/cashbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transaction",
          cashboxId: cashbox.id,
          type,
          amount: amt,
          method,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ثبت تراکنش");
        return;
      }
      toast.success("تراکنش با موفقیت ثبت شد");
      reset();
      onOpenChange(false);
      onDone();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            ثبت تراکنش صندوق
          </DialogTitle>
          <DialogDescription>
            {cashbox ? `صندوق: ${cashbox.name}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>نوع تراکنش *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">واریز</SelectItem>
                <SelectItem value="withdrawal">برداشت</SelectItem>
                <SelectItem value="sale">فروش</SelectItem>
                <SelectItem value="expense">هزینه</SelectItem>
                <SelectItem value="transfer">انتقال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>مبلغ (تومان) *</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setAmount(v ? Number(v).toLocaleString("en-US") : "");
              }}
              placeholder="مثال: 1,000,000"
              className="font-mono"
              dir="ltr"
            />
            {amount && (
              <p className="text-xs text-muted-foreground">
                {formatToman(Number(amount.replace(/,/g, "")))}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>روش پرداخت</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدی</SelectItem>
                <SelectItem value="card">کارتی</SelectItem>
                <SelectItem value="transfer">انتقال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>توضیحات</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات اختیاری"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !cashbox}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {saving && <RefreshCw className="w-4 h-4 ml-1 animate-spin" />}
            ثبت تراکنش
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCashboxDialog({
  open,
  onOpenChange,
  branches,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branches: BranchOption[];
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [branchId, setBranchId] = React.useState("");
  const [openingBalance, setOpeningBalance] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setName("");
    setBranchId("");
    setOpeningBalance("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام صندوق الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/cashbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: name.trim(),
          branchId: branchId || undefined,
          openingBalance: Number(openingBalance.replace(/,/g, "")) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ایجاد صندوق");
        return;
      }
      reset();
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            ایجاد صندوق جدید
          </DialogTitle>
          <DialogDescription>
            یک صندوق فروش جدید برای یکی از شعبات ایجاد کنید
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>نام صندوق *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: صندوق شعبه اصفهان"
            />
          </div>
          <div className="space-y-2">
            <Label>شعبه</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب شعبه (پیش‌فرض: اولین شعبه)" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>موجودی اولیه (تومان)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={openingBalance}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setOpeningBalance(v ? Number(v).toLocaleString("en-US") : "");
              }}
              placeholder="0"
              className="font-mono"
              dir="ltr"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {saving && <RefreshCw className="w-4 h-4 ml-1 animate-spin" />}
            ایجاد صندوق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DailyClosingDialog({
  open,
  onOpenChange,
  cashbox,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cashbox: CashboxDetail | null;
  onDone: () => void;
}) {
  const [processing, setProcessing] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  const handleClose = async () => {
    if (!cashbox) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/accounting/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashboxId: cashbox.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در تسویه روزانه");
        return;
      }
      setResult(data);
      toast.success("تسویه روزانه با موفقیت انجام شد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseDialog = (v: boolean) => {
    onOpenChange(v);
    if (!v && result) {
      setResult(null);
      onDone();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            تسویه روزانه صندوق
          </DialogTitle>
          <DialogDescription>
            {cashbox
              ? `صندوق «${cashbox.name}» بسته شده و خلاصه روز ارائه می‌شود`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-medium mb-2">
                <CheckClosingIcon />
                تسویه با موفقیت انجام شد
              </div>
              <p className="text-xs text-muted-foreground">
                صندوق در تاریخ {formatPersianDateTime(result.cashbox.closedAt)} بسته شد.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <SummaryItem
                label="موجودی اول دوره"
                value={formatToman(result.summary.salesTotal !== undefined ? result.cashbox.openingBalance : 0)}
              />
              <SummaryItem
                label="موجودی پایان دوره"
                value={formatToman(result.cashbox.closingBalance)}
              />
              <SummaryItem
                label="فروش روز"
                value={`${formatToman(result.summary.salesTotal)} (${toPersianDigits(result.summary.salesCount)} فاکتور)`}
              />
              <SummaryItem
                label="هزینه‌های روز"
                value={`${formatToman(result.summary.expensesTotal)} (${toPersianDigits(result.summary.expensesCount)} مورد)`}
              />
              <SummaryItem
                label="واریزها"
                value={formatToman(result.summary.cashboxIncome)}
              />
              <SummaryItem
                label="برداشت‌ها"
                value={formatToman(result.summary.cashboxOutcome)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">مبلغ مورد انتظار:</span>
              <span className="font-mono">{formatToman(result.summary.expectedBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">مبلغ واقعی:</span>
              <span className="font-mono">{formatToman(result.summary.actualBalance)}</span>
            </div>
            <div
              className={`flex items-center justify-between text-sm font-medium p-2 rounded ${
                Math.abs(result.summary.difference) < 1
                  ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                  : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
              }`}
            >
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                اختلاف:
              </span>
              <span className="font-mono">
                {formatToman(result.summary.difference)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              با انجام تسویه روزانه، صندوق بسته شده و گزارش کامل فروش و
              هزینه‌های امروز نمایش داده می‌شود.
            </p>
            {cashbox && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">صندوق:</span>
                  <span className="font-medium">{cashbox.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">شعبه:</span>
                  <span className="font-medium">{cashbox.branch.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">موجودی فعلی:</span>
                  <span className="font-mono font-medium">
                    {formatToman(cashbox.balance)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleCloseDialog(false)} className="bg-amber-500 hover:bg-amber-600 text-white">
              تمام
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleCloseDialog(false)} disabled={processing}>
                انصراف
              </Button>
              <Button
                onClick={handleClose}
                disabled={processing || !cashbox}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {processing && <RefreshCw className="w-4 h-4 ml-1 animate-spin" />}
                <Lock className="w-4 h-4 ml-1" />
                انجام تسویه
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckClosingIcon() {
  return <Lock className="w-4 h-4" />;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2.5">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium font-mono">{value}</p>
    </div>
  );
}

// ============ Expenses Tab ============

function ExpensesTab() {
  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
  const [branches, setBranches] = React.useState<BranchOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [exRes, brRes] = await Promise.all([
        fetch("/api/accounting/expenses?pageSize=100", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
      ]);
      const exData = await exRes.json();
      const brData = await brRes.json();
      if (exRes.ok) setExpenses(exData.items || []);
      if (brRes.ok) {
        setBranches(
          (brData.items || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            isWarehouse: b.isWarehouse,
            isMain: b.isMain,
          }))
        );
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این هزینه مطمئن هستید؟")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/accounting/expenses?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در حذف هزینه");
        return;
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("هزینه با موفقیت حذف شد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = React.useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="همه دسته‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دسته‌ها</SelectItem>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
            به‌روزرسانی
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAdd(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 ml-1" />
          ثبت هزینه
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
              هزینه‌ای ثبت نشده است
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>توضیحات</TableHead>
                    <TableHead>شعبه</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/50">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatPersianDate(e.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            EXPENSE_CATEGORY_COLORS[e.category] || ""
                          }`}
                        >
                          {EXPENSE_CATEGORY_LABELS[e.category] || e.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        <span className="line-clamp-1">{e.description}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.branch?.name || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium text-rose-600">
                        {formatToman(e.amount)}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          onClick={() => handleDelete(e.id)}
                          disabled={deleting === e.id}
                        >
                          {deleting === e.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                مجموع هزینه‌های نمایش‌داده‌شده:
              </span>
              <span className="font-mono font-bold text-rose-600">
                {formatToman(totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <AddExpenseDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        branches={branches}
        onCreated={(e) => {
          setExpenses((prev) => [e, ...prev]);
          toast.success("هزینه با موفقیت ثبت شد");
        }}
      />
    </div>
  );
}

function AddExpenseDialog({
  open,
  onOpenChange,
  branches,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branches: BranchOption[];
  onCreated: (e: ExpenseItem) => void;
}) {
  const [category, setCategory] = React.useState("other");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [branchId, setBranchId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setCategory("other");
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setBranchId("");
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("توضیحات هزینه الزامی است");
      return;
    }
    const amt = Number(amount.replace(/,/g, ""));
    if (!amt || amt <= 0) {
      toast.error("مبلغ معتبر وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.trim(),
          amount: amt,
          date: date ? new Date(date).toISOString() : undefined,
          branchId: branchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ثبت هزینه");
        return;
      }
      onCreated(data);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            ثبت هزینه جدید
          </DialogTitle>
          <DialogDescription>
            هزینه‌های جاری فروشگاه را ثبت کنید
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>دسته‌بندی *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>توضیحات *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: اجاره شعبه مرداد"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>مبلغ (تومان) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setAmount(v ? Number(v).toLocaleString("en-US") : "");
                }}
                placeholder="0"
                className="font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>تاریخ</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono"
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>شعبه (اختیاری)</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب شعبه" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {saving && <RefreshCw className="w-4 h-4 ml-1 animate-spin" />}
            ثبت هزینه
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
