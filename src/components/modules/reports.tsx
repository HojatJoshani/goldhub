"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Wallet,
  Download,
  Printer,
  Calendar,
  ShoppingBag,
  Coins,
  Crown,
  Award,
  UserCheck,
  Activity,
  Boxes,
  PieChart as PieIcon,
  LineChart as LineIcon,
  BarChart as BarIcon,
  Receipt,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  formatToman,
  formatNumber,
  formatWeight,
  toPersianDigits,
  karatLabel,
} from "@/lib/persian";

// ============= TYPES =============
interface SalesReport {
  range: { from: string; to: string; groupBy: "day" | "week" | "month" };
  summary: {
    totalSales: number;
    totalSubtotal: number;
    totalDiscount: number;
    totalMaking: number;
    count: number;
    avgOrderValue: number;
  };
  series: { label: string; key: string; total: number; count: number }[];
  byPaymentMethod: { method: string; total: number; count: number }[];
  byBranch: { branchId: string; branchName: string; total: number; count: number }[];
  byHour: { hour: number; total: number; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    revenue: number;
    quantity: number;
    salesCount: number;
  }[];
}

interface InventoryReport {
  summary: {
    purchaseValue: number;
    retailValue: number;
    potentialProfit: number;
    totalUnits: number;
    totalSkus: number;
    totalGoldWeight: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  byKarat: { karat: string; weight: number; units: number; products: number }[];
  stockStatus: { status: string; label: string; count: number; color: string }[];
  byCategory: {
    categoryId: string | null;
    categoryName: string;
    products: number;
    units: number;
    value: number;
  }[];
  aging: { bucket: string; label: string; units: number; value: number }[];
  topValue: {
    id: string;
    name: string;
    karat: string;
    stock: number;
    unitPrice: number;
    weight: number;
    totalValue: number;
    retailValue: number;
  }[];
}

interface CustomersReport {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    avgSpendPerCustomer: number;
    avgOrdersPerCustomer: number;
    totalSpent: number;
    totalLoyaltyPoints: number;
  };
  segments: { tier: string; label: string; count: number; totalSpent: number }[];
  topCustomers: {
    id: string;
    name: string;
    phone: string | null;
    totalSpent: number;
    totalOrders: number;
    loyaltyPoints: number;
    tier: string;
    tierLabel: string;
    createdAt: string;
    avgOrder: number;
  }[];
  newCustomersTrend: { label: string; key: string; count: number }[];
}

interface StaffReport {
  range: { from: string; to: string };
  summary: {
    totalStaff: number;
    activeCashiers: number;
    totalRevenue: number;
    totalSales: number;
    avgOrderValue: number;
    topPerformer: {
      id: string;
      name: string;
      roleLabel: string;
      totalRevenue: number;
      salesCount: number;
      avgOrderValue: number;
    } | null;
  };
  staff: {
    id: string;
    name: string;
    role: string;
    roleLabel: string;
    branchName: string;
    salesCount: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalDiscount: number;
    totalMaking: number;
    lastLoginAt: string | null;
  }[];
}

interface FinancialReport {
  range: { from: string; to: string };
  summary: {
    revenue: number;
    grossSales: number;
    totalMaking: number;
    totalDiscount: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    salesCount: number;
  };
  expensesByCategory: {
    category: string;
    label: string;
    total: number;
    count: number;
  }[];
  daily: {
    key: string;
    label: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

// ============= CONSTANTS =============
const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدی",
  card: "کارتی",
  transfer: "انتقال",
  gold: "طلا",
  mixed: "ترکیبی",
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#9ca3af",
  gold: "#D4A017",
  silver: "#94a3b8",
  bronze: "#b45309",
  new: "#10b981",
};

const GOLD_PALETTE = [
  "#D4A017",
  "#E6B838",
  "#F0D060",
  "#A87C10",
  "#8B6914",
  "#FBBF24",
  "#FCD34D",
  "#F59E0B",
  "#92400E",
  "#78350F",
];

const STOCK_COLORS: Record<string, string> = {
  in_stock: "#10b981",
  low_stock: "#f59e0b",
  out_of_stock: "#ef4444",
};

function persianDateInput(d: Date): string {
  // Returns YYYY-MM-DD for <input type="date">
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTomanShort(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `${toPersianDigits((v / 1_000_000_000).toFixed(1))} میلیارد`;
  if (Math.abs(v) >= 1_000_000) return `${toPersianDigits(Math.round(v / 1_000_000))} میلیون`;
  if (Math.abs(v) >= 1_000) return `${toPersianDigits(Math.round(v / 1_000))} هزار`;
  return toPersianDigits(Math.round(v));
}

// ============= MAIN COMPONENT =============
export function ReportsModule() {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const [from, setFrom] = React.useState(persianDateInput(defaultFrom));
  const [to, setTo] = React.useState(persianDateInput(now));
  const [groupBy, setGroupBy] = React.useState<"day" | "week" | "month">("day");
  const [activeTab, setActiveTab] = React.useState<
    "sales" | "inventory" | "customers" | "staff" | "financial"
  >("sales");

  // Data states
  const [salesData, setSalesData] = React.useState<SalesReport | null>(null);
  const [inventoryData, setInventoryData] =
    React.useState<InventoryReport | null>(null);
  const [customersData, setCustomersData] =
    React.useState<CustomersReport | null>(null);
  const [staffData, setStaffData] = React.useState<StaffReport | null>(null);
  const [financialData, setFinancialData] =
    React.useState<FinancialReport | null>(null);
  const [loadingSales, setLoadingSales] = React.useState(false);
  const [loadingInventory, setLoadingInventory] = React.useState(false);
  const [loadingCustomers, setLoadingCustomers] = React.useState(false);
  const [loadingStaff, setLoadingStaff] = React.useState(false);
  const [loadingFinancial, setLoadingFinancial] = React.useState(false);

  const loadSales = React.useCallback(async () => {
    setLoadingSales(true);
    try {
      const params = new URLSearchParams({ from, to, groupBy });
      const res = await fetch(`/api/reports/sales?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setSalesData(json);
      else toast.error(json.error || "خطا در دریافت گزارش فروش");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoadingSales(false);
    }
  }, [from, to, groupBy]);

  const loadInventory = React.useCallback(async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch("/api/reports/inventory");
      const json = await res.json();
      if (res.ok) setInventoryData(json);
      else toast.error(json.error || "خطا در دریافت گزارش انبار");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  const loadCustomers = React.useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch("/api/reports/customers");
      const json = await res.json();
      if (res.ok) setCustomersData(json);
      else toast.error(json.error || "خطا در دریافت گزارش مشتریان");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadStaff = React.useCallback(async () => {
    setLoadingStaff(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/reports/staff?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setStaffData(json);
      else toast.error(json.error || "خطا در دریافت گزارش کارکنان");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoadingStaff(false);
    }
  }, [from, to]);

  const loadFinancial = React.useCallback(async () => {
    setLoadingFinancial(true);
    try {
      const res = await fetch("/api/reports/financial");
      const json = await res.json();
      if (res.ok) setFinancialData(json);
      else toast.error(json.error || "خطا در دریافت گزارش مالی");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoadingFinancial(false);
    }
  }, []);

  // Load each tab's data on first activation
  const loadedTabs = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    if (activeTab === "sales") {
      loadSales();
    } else if (activeTab === "inventory" && !loadedTabs.current.has("inventory")) {
      loadedTabs.current.add("inventory");
      loadInventory();
    } else if (activeTab === "customers" && !loadedTabs.current.has("customers")) {
      loadedTabs.current.add("customers");
      loadCustomers();
    } else if (activeTab === "staff") {
      loadStaff();
    } else if (activeTab === "financial" && !loadedTabs.current.has("financial")) {
      loadedTabs.current.add("financial");
      loadFinancial();
    }
  }, [activeTab, from, to, groupBy]);

  // CSV Export
  const handleExportCsv = () => {
    let csv = "";
    let filename = "گزارش";

    if (activeTab === "sales" && salesData) {
      filename = `گزارش-فروش-${from}-${to}.csv`;
      csv = exportSalesCsv(salesData);
    } else if (activeTab === "inventory" && inventoryData) {
      filename = "گزارش-انبار.csv";
      csv = exportInventoryCsv(inventoryData);
    } else if (activeTab === "customers" && customersData) {
      filename = "گزارش-مشتریان.csv";
      csv = exportCustomersCsv(customersData);
    } else if (activeTab === "staff" && staffData) {
      filename = `گزارش-کارکنان-${from}-${to}.csv`;
      csv = exportStaffCsv(staffData);
    } else if (activeTab === "financial" && financialData) {
      filename = "گزارش-مالی-۳۰روز.csv";
      csv = exportFinancialCsv(financialData);
    } else {
      toast.error("داده‌ای برای خروجی موجود نیست");
      return;
    }

    // BOM + UTF-8
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("فایل CSV دانلود شد");
  };

  return (
    <div className="space-y-5 reports-module">
      {/* PRINT ONLY HEADER */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">گزارشات و تحلیل‌های GoldHub</h1>
        <p className="text-sm text-muted-foreground">
          بازه: {toPersianDigits(from)} تا {toPersianDigits(to)}
        </p>
      </div>

      {/* HEADER */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            گزارشات و تحلیل‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            تحلیل جامع عملکرد فروش، انبار، مشتریان، کارکنان و مالی
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-amber-500" />
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-7 w-[140px] border-0 px-1 text-xs"
            />
            <span className="text-muted-foreground text-xs">تا</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-7 w-[140px] border-0 px-1 text-xs"
            />
          </div>
          <Select
            value={groupBy}
            onValueChange={(v) =>
              setGroupBy(v as "day" | "week" | "month")
            }
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">روزانه</SelectItem>
              <SelectItem value="week">هفتگی</SelectItem>
              <SelectItem value="month">ماهانه</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 ml-1" />
            خروجی CSV
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 ml-1" />
            چاپ
          </Button>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          .reports-module .no-print {
            display: none !important;
          }
          .reports-module [role="tablist"] {
            display: none !important;
          }
          .reports-module [data-state="inactive"] {
            display: block !important;
          }
          .reports-module [role="tabpanel"] {
            display: block !important;
          }
          .reports-module [hidden] {
            display: block !important;
          }
          body * {
            visibility: visible;
          }
          .reports-module {
            page-break-after: avoid;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as typeof activeTab)
        }
      >
        <TabsList className="no-print flex-wrap h-auto">
          <TabsTrigger value="sales" className="gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            فروش
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5">
            <Package className="w-4 h-4" />
            انبار
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <Users className="w-4 h-4" />
            مشتریان
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5">
            <UserCheck className="w-4 h-4" />
            عملکرد کارکنان
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5">
            <Wallet className="w-4 h-4" />
            مالی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <SalesTab
            data={salesData}
            loading={loadingSales}
            onRefresh={loadSales}
          />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <InventoryTab
            data={inventoryData}
            loading={loadingInventory}
            onRefresh={loadInventory}
          />
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <CustomersTab
            data={customersData}
            loading={loadingCustomers}
            onRefresh={loadCustomers}
          />
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <StaffTab
            data={staffData}
            loading={loadingStaff}
            onRefresh={loadStaff}
          />
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <FinancialTab
            data={financialData}
            loading={loadingFinancial}
            onRefresh={loadFinancial}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============= SHARED UI =============
function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "amber",
  growth,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "amber" | "green" | "rose" | "purple" | "blue";
  growth?: number;
}) {
  const accentColors: Record<string, string> = {
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
    green: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600",
    rose: "bg-rose-100 dark:bg-rose-950/40 text-rose-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
    blue: "bg-sky-100 dark:bg-sky-950/40 text-sky-600",
  };
  return (
    <Card className="print-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {growth !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                growth >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {growth >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {toPersianDigits(Math.abs(growth))}٪
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-lg font-bold truncate">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={`print-card ${className || ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-amber-500" />}
            {title}
          </CardTitle>
          {action}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const tooltipStyle = {
  direction: "rtl" as const,
  borderRadius: "8px",
  fontSize: "12px",
  border: "1px solid rgba(212,160,23,0.2)",
  background: "rgba(255,255,255,0.98)",
};

const axisTickStyle = { fontSize: 11, fontFamily: "inherit" };

const tomanTickFormatter = (v: number) => formatTomanShort(v);

function RefreshBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-7 px-2 text-xs no-print"
    >
      به‌روزرسانی
    </Button>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// ============= SALES TAB =============
function SalesTab({
  data,
  loading,
  onRefresh,
}: {
  data: SalesReport | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return <SkeletonGrid count={4} />;
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          داده‌ای برای نمایش موجود نیست.
        </CardContent>
      </Card>
    );
  }
  const { summary, series, byPaymentMethod, byBranch, byHour, topProducts } =
    data;

  const seriesChart = series.map((s) => ({
    name: s.label,
    فروش: s.total,
    تعداد: s.count,
  }));

  const paymentChart = byPaymentMethod.map((p) => ({
    name: PAYMENT_LABELS[p.method] || p.method,
    مبلغ: p.total,
    count: p.count,
  }));

  const branchChart = byBranch
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((b) => ({
      name: b.branchName,
      مبلغ: b.total,
      تعداد: b.count,
    }));

  const hourChart = byHour
    .filter((h) => h.count > 0)
    .map((h) => ({
      name: `${toPersianDigits(h.hour)}:۰۰`,
      فروش: h.total,
      تعداد: h.count,
    }));

  const hasData = summary.count > 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="کل فروش"
          value={formatToman(summary.totalSales)}
          subtitle={`${toPersianDigits(summary.count)} فاکتور`}
          icon={ShoppingBag}
          accent="amber"
        />
        <KpiCard
          title="میانگین ارزش سفارش"
          value={formatToman(summary.avgOrderValue)}
          subtitle="هر فاکتور به‌طور میانگین"
          icon={Receipt}
          accent="green"
        />
        <KpiCard
          title="کل اجرت"
          value={formatToman(summary.totalMaking)}
          subtitle="اجرت فروش"
          icon={Coins}
          accent="purple"
        />
        <KpiCard
          title="کل تخفیف"
          value={formatToman(summary.totalDiscount)}
          subtitle="تخفیف اعطایی"
          icon={TrendingDown}
          accent="rose"
        />
      </div>

      {/* Charts Row 1: Sales line + Payment pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="روند فروش"
          description={`بر اساس ${
            data.range.groupBy === "day"
              ? "روز"
              : data.range.groupBy === "week"
              ? "هفته"
              : "ماه"
          }`}
          icon={LineIcon}
          className="lg:col-span-2"
          action={<RefreshBtn onClick={onRefresh} />}
        >
          {!hasData ? (
            <EmptyChart message="در این بازه فروشی ثبت نشده است" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={seriesChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={tomanTickFormatter}
                  width={55}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "تعداد"
                      ? [toPersianDigits(value), name]
                      : [formatToman(value), name]
                  }
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="فروش"
                  stroke="#D4A017"
                  strokeWidth={2.5}
                  fill="url(#salesArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="روش‌های پرداخت"
          description="توزیع بر اساس مبلغ"
          icon={PieIcon}
        >
          {!hasData ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="مبلغ"
                  nameKey="name"
                >
                  {paymentChart.map((_, i) => (
                    <Cell
                      key={i}
                      fill={GOLD_PALETTE[i % GOLD_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2: Branch bar + Hour bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="مقایسه شعب"
          description="فروش بر اساس شعبه"
          icon={BarIcon}
        >
          {!hasData || branchChart.length === 0 ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={branchChart}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={tomanTickFormatter}
                  width={55}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="مبلغ"
                  fill="#D4A017"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="فروش بر اساس ساعت روز"
          description="توزیع فروش در ساعات شبانه‌روز"
          icon={Activity}
        >
          {!hasData || hourChart.length === 0 ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={hourChart}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={tomanTickFormatter}
                  width={55}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="فروش"
                  fill="#E6B838"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top products table */}
      <ChartCard
        title="پرفروش‌ترین محصولات (۱۰ مورد)"
        description="بر اساس درآمد در بازه انتخابی"
        icon={Crown}
      >
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>نام محصول</TableHead>
                <TableHead className="text-right">تعداد فروش</TableHead>
                <TableHead className="text-right">دفعات فروش</TableHead>
                <TableHead className="text-right">درآمد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-6"
                  >
                    موردی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                topProducts.map((p, i) => (
                  <TableRow key={p.productId}>
                    <TableCell className="text-center text-muted-foreground font-medium">
                      {toPersianDigits(i + 1)}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {toPersianDigits(p.quantity)} عدد
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {toPersianDigits(p.salesCount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">
                      {formatToman(p.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </ChartCard>
    </div>
  );
}

// ============= INVENTORY TAB =============
function InventoryTab({
  data,
  loading,
  onRefresh,
}: {
  data: InventoryReport | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return <SkeletonGrid count={4} />;
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          داده‌ای برای نمایش موجود نیست.
        </CardContent>
      </Card>
    );
  }
  const { summary, byKarat, stockStatus, byCategory, aging, topValue } = data;

  const karatChart = byKarat.map((k) => ({
    name: karatLabel(k.karat),
    وزن: k.weight,
    تعداد: k.units,
  }));

  const stockChart = stockStatus.map((s) => ({
    name: s.label,
    تعداد: s.count,
    color: s.color,
  }));

  const categoryChart = byCategory
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((c) => ({
      name: c.categoryName,
      تعداد: c.products,
      ارزش: c.value,
    }));

  const agingChart = aging.map((a) => ({
    name: a.label,
    تعداد: a.units,
    ارزش: a.value,
  }));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="ارزش انبار (خرید)"
          value={formatToman(summary.purchaseValue)}
          subtitle={`${toPersianDigits(summary.totalSkus)} نوع محصول`}
          icon={Wallet}
          accent="amber"
        />
        <KpiCard
          title="ارزش انبار (فروش)"
          value={formatToman(summary.retailValue)}
          subtitle={`سود بالقوه: ${formatTomanShort(summary.potentialProfit)}`}
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          title="وزن کل طلا"
          value={formatWeight(summary.totalGoldWeight)}
          subtitle={`${toPersianDigits(summary.totalUnits)} عدد کالا`}
          icon={Coins}
          accent="purple"
        />
        <KpiCard
          title="وضعیت موجودی"
          value={`${toPersianDigits(summary.inStock)} موجود`}
          subtitle={`${toPersianDigits(summary.lowStock)} کم · ${toPersianDigits(summary.outOfStock)} ناموجود`}
          icon={Boxes}
          accent="rose"
        />
      </div>

      {/* Karat pie + Category bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="توزیع عیارها"
          description="بر اساس وزن طلا"
          icon={PieIcon}
          action={<RefreshBtn onClick={onRefresh} />}
        >
          {karatChart.length === 0 ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={karatChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="وزن"
                  nameKey="name"
                >
                  {karatChart.map((_, i) => (
                    <Cell
                      key={i}
                      fill={GOLD_PALETTE[i % GOLD_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatWeight(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="محصولات بر اساس دسته‌بندی"
          description="۸ دسته برتر از نظر تعداد محصول"
          icon={BarIcon}
        >
          {categoryChart.length === 0 ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={categoryChart}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisTickStyle}
                  width={110}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) =>
                    v.length > 14 ? v.slice(0, 14) + "…" : v
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "ارزش"
                      ? [formatToman(value), name]
                      : [toPersianDigits(value), name]
                  }
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="تعداد"
                  fill="#D4A017"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Stock status donut + Aging bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="وضعیت موجودی"
          description="توزیع محصولات بر اساس وضعیت"
          icon={Boxes}
        >
          {stockChart.every((s) => s["تعداد"] === 0) ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stockChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="تعداد"
                  nameKey="name"
                >
                  {stockChart.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${toPersianDigits(value)} محصول`
                  }
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="کهنگی انبار"
          description="مدت زمان باقی‌ماندن محصولات در انبار"
          icon={Activity}
        >
          {agingChart.every((a) => a["تعداد"] === 0) ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={agingChart}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  width={36}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "ارزش"
                      ? [formatToman(value), name]
                      : [`${toPersianDigits(value)} عدد`, name]
                  }
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="تعداد"
                  fill="#A87C10"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top value products */}
      <ChartCard
        title="باارزش‌ترین محصولات انبار (۱۰ مورد)"
        description="بر اساس ارزش خرید موجودی"
        icon={Crown}
      >
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>نام محصول</TableHead>
                <TableHead className="text-right">عیار</TableHead>
                <TableHead className="text-right">موجودی</TableHead>
                <TableHead className="text-right">وزن واحد</TableHead>
                <TableHead className="text-right">ارزش خرید</TableHead>
                <TableHead className="text-right">ارزش فروش</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topValue.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-6"
                  >
                    موردی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                topValue.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-center text-muted-foreground font-medium">
                      {toPersianDigits(i + 1)}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                        {karatLabel(p.karat)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.stock === 0 ? "destructive" : "secondary"}>
                        {toPersianDigits(p.stock)} عدد
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatWeight(p.weight)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatToman(p.totalValue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatToman(p.retailValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </ChartCard>
    </div>
  );
}

// ============= CUSTOMERS TAB =============
function CustomersTab({
  data,
  loading,
  onRefresh,
}: {
  data: CustomersReport | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return <SkeletonGrid count={4} />;
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          داده‌ای برای نمایش موجود نیست.
        </CardContent>
      </Card>
    );
  }
  const { summary, segments, topCustomers, newCustomersTrend } = data;

  const trendChart = newCustomersTrend.map((t) => ({
    name: t.label,
    "مشتری جدید": t.count,
  }));

  const segmentChart = segments.map((s) => ({
    name: s.label,
    تعداد: s.count,
    tier: s.tier,
    color: TIER_COLORS[s.tier] || "#D4A017",
  }));

  const repeatGauge = [
    {
      name: "نرخ تکرار",
      value: summary.repeatRate,
      fill: "#D4A017",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="کل مشتریان"
          value={toPersianDigits(summary.totalCustomers) + " نفر"}
          subtitle={`${toPersianDigits(summary.totalLoyaltyPoints)} امتیاز اهدایی`}
          icon={Users}
          accent="amber"
        />
        <KpiCard
          title="مشتریان جدید (۳۰ روز)"
          value={toPersianDigits(summary.newCustomers) + " نفر"}
          subtitle="ثبت‌نام در ماه گذشته"
          icon={UserCheck}
          accent="green"
        />
        <KpiCard
          title="میانگین خرید هر مشتری"
          value={formatToman(summary.avgSpendPerCustomer)}
          subtitle={`${toPersianDigits(
            summary.avgOrdersPerCustomer.toFixed(1)
          )} سفارش در میانگین`}
          icon={Wallet}
          accent="purple"
        />
        <KpiCard
          title="نرخ تکرار خرید"
          value={`${toPersianDigits(summary.repeatRate)}٪`}
          subtitle={`${toPersianDigits(summary.repeatCustomers)} مشتری بازگشتی`}
          icon={Award}
          accent="blue"
        />
      </div>

      {/* New customers trend + Segment pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="روند مشتریان جدید"
          description="۱۴ روز گذشته"
          icon={LineIcon}
          className="lg:col-span-2"
          action={<RefreshBtn onClick={onRefresh} />}
        >
          {trendChart.every((t) => t["مشتری جدید"] === 0) ? (
            <EmptyChart message="در این بازه مشتری جدیدی ثبت نشده" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={trendChart}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="newCust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  width={36}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${toPersianDigits(value)} نفر`,
                    "مشتری جدید",
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="مشتری جدید"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#newCust)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="بخش‌بندی مشتریان"
          description="بر اساس سطح وفاداری"
          icon={PieIcon}
        >
          {segmentChart.length === 0 ? (
            <EmptyChart message="داده‌ای موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={segmentChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="تعداد"
                  nameKey="name"
                >
                  {segmentChart.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${toPersianDigits(value)} مشتری`
                  }
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Repeat rate gauge + Top customers table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="نرخ تکرار خرید"
          description="درصد مشتریان با بیش از یک خرید"
          icon={Activity}
        >
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                barSize={18}
                data={repeatGauge}
                startAngle={90}
                endAngle={90 - (summary.repeatRate / 100) * 360}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: "rgba(212,160,23,0.1)" }}
                  dataKey="value"
                  cornerRadius={10}
                  fill="#D4A017"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold text-amber-600">
                {toPersianDigits(summary.repeatRate)}٪
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {toPersianDigits(summary.repeatCustomers)} از{" "}
                {toPersianDigits(summary.totalCustomers)}
              </p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="برترین مشتریان (۱۰ نفر)"
          description="بر اساس مجموع خرید"
          icon={Crown}
          className="lg:col-span-2"
        >
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>نام مشتری</TableHead>
                  <TableHead className="text-right">سطح</TableHead>
                  <TableHead className="text-right">سفارش‌ها</TableHead>
                  <TableHead className="text-right">مجموع خرید</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-6"
                    >
                      مشتری‌ای یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  topCustomers.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-center text-muted-foreground font-medium">
                        {toPersianDigits(i + 1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          {c.phone && (
                            <span className="text-xs text-muted-foreground">
                              {toPersianDigits(c.phone)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: TIER_COLORS[c.tier],
                            color: TIER_COLORS[c.tier],
                          }}
                        >
                          {c.tierLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {toPersianDigits(c.totalOrders)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">
                        {formatToman(c.totalSpent)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </ChartCard>
      </div>
    </div>
  );
}

// ============= STAFF TAB =============
function StaffTab({
  data,
  loading,
  onRefresh,
}: {
  data: StaffReport | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return <SkeletonGrid count={4} />;
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          داده‌ای برای نمایش موجود نیست.
        </CardContent>
      </Card>
    );
  }
  const { summary, staff } = data;

  const staffChart = staff
    .filter((s) => s.salesCount > 0)
    .slice()
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map((s) => ({
      name: s.name,
      درآمد: s.totalRevenue,
      تعداد: s.salesCount,
    }));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="کل کارکنان"
          value={toPersianDigits(summary.totalStaff) + " نفر"}
          subtitle={`${toPersianDigits(summary.activeCashiers)} نفر فعال`}
          icon={Users}
          accent="amber"
        />
        <KpiCard
          title="کل درآمد (بازه)"
          value={formatToman(summary.totalRevenue)}
          subtitle={`${toPersianDigits(summary.totalSales)} فاکتور`}
          icon={Wallet}
          accent="green"
        />
        <KpiCard
          title="میانگین ارزش سفارش"
          value={formatToman(summary.avgOrderValue)}
          subtitle="میانگین کل کارکنان"
          icon={Receipt}
          accent="purple"
        />
        {summary.topPerformer ? (
          <KpiCard
            title="برترین کارمند"
            value={summary.topPerformer.name}
            subtitle={`${formatTomanShort(
              summary.topPerformer.totalRevenue
            )} · ${toPersianDigits(summary.topPerformer.salesCount)} فاکتور`}
            icon={Crown}
            accent="blue"
          />
        ) : (
          <KpiCard
            title="برترین کارمند"
            value="—"
            subtitle="بدون فروش در این بازه"
            icon={Crown}
            accent="blue"
          />
        )}
      </div>

      {/* Staff comparison bar chart */}
      <ChartCard
        title="مقایسه عملکرد کارکنان"
        description="۱۰ کارمند برتر بر اساس درآمد"
        icon={BarIcon}
        action={<RefreshBtn onClick={onRefresh} />}
      >
        {staffChart.length === 0 ? (
          <EmptyChart message="در این بازه فروشی ثبت نشده است" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={staffChart}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={axisTickStyle}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
                tickFormatter={(v: string) =>
                  v.length > 12 ? v.slice(0, 12) + "…" : v
                }
              />
              <YAxis
                tick={axisTickStyle}
                tickFormatter={tomanTickFormatter}
                width={55}
                orientation="right"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "تعداد"
                    ? [toPersianDigits(value), name]
                    : [formatToman(value), name]
                }
                contentStyle={tooltipStyle}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                iconType="circle"
              />
              <Bar
                dataKey="درآمد"
                fill="#D4A017"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Staff detail table */}
      <ChartCard
        title="جدول عملکرد کارکنان"
        description="جزئیات فروش هر کارمند در بازه انتخابی"
        icon={UserCheck}
      >
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>نام</TableHead>
                <TableHead className="text-right">نقش</TableHead>
                <TableHead className="text-right">شعبه</TableHead>
                <TableHead className="text-right">تعداد فروش</TableHead>
                <TableHead className="text-right">درآمد کل</TableHead>
                <TableHead className="text-right">میانگین سفارش</TableHead>
                <TableHead className="text-right">تخفیف</TableHead>
                <TableHead className="text-right">اجرت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-6"
                  >
                    کارمندی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-center text-muted-foreground font-medium">
                      {toPersianDigits(i + 1)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xs font-bold">
                          {s.name.charAt(0)}
                        </div>
                        {s.name}
                        {i === 0 && s.salesCount > 0 && (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {s.roleLabel}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {s.branchName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {toPersianDigits(s.salesCount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">
                      {formatToman(s.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatToman(s.avgOrderValue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatTomanShort(s.totalDiscount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatTomanShort(s.totalMaking)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </ChartCard>
    </div>
  );
}

// ============= FINANCIAL TAB =============
function FinancialTab({
  data,
  loading,
  onRefresh,
}: {
  data: FinancialReport | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return <SkeletonGrid count={4} />;
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          داده‌ای برای نمایش موجود نیست.
        </CardContent>
      </Card>
    );
  }
  const { summary, expensesByCategory, daily } = data;

  const dailyChart = daily.map((d) => ({
    name: d.label,
    درآمد: d.revenue,
    هزینه: d.expenses,
    سود: d.profit,
  }));

  const expenseChart = expensesByCategory.map((e) => ({
    name: e.label,
    مبلغ: e.total,
    count: e.count,
  }));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="درآمد (۳۰ روز)"
          value={formatToman(summary.revenue)}
          subtitle={`${toPersianDigits(summary.salesCount)} فاکتور`}
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          title="هزینه‌ها (۳۰ روز)"
          value={formatToman(summary.totalExpenses)}
          subtitle={`${toPersianDigits(expensesByCategory.length)} دسته هزینه`}
          icon={Wallet}
          accent="rose"
        />
        <KpiCard
          title="سود خالص"
          value={formatToman(summary.netProfit)}
          subtitle={
            summary.netProfit >= 0 ? "سود" : "زیان"
          }
          icon={Coins}
          accent={summary.netProfit >= 0 ? "amber" : "rose"}
        />
        <KpiCard
          title="حاشیه سود"
          value={`${toPersianDigits(summary.profitMargin)}٪`}
          subtitle="درصد سود به درآمد"
          icon={Activity}
          accent={summary.profitMargin >= 0 ? "purple" : "rose"}
        />
      </div>

      {/* Daily income vs expenses bar + Expense category pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="درآمد در برابر هزینه"
          description="روند روزانه در ۳۰ روز گذشته"
          icon={BarIcon}
          className="lg:col-span-2"
          action={<RefreshBtn onClick={onRefresh} />}
        >
          {daily.every((d) => d.revenue === 0 && d.expenses === 0) ? (
            <EmptyChart message="داده‌ای در این بازه موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dailyChart}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(daily.length / 8) - 1)}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={tomanTickFormatter}
                  width={55}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="درآمد"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  dataKey="هزینه"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="دسته‌بندی هزینه‌ها"
          description="سهم هر دسته از کل هزینه‌ها"
          icon={PieIcon}
        >
          {expenseChart.length === 0 ? (
            <EmptyChart message="هزینه‌ای ثبت نشده است" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="مبلغ"
                  nameKey="name"
                >
                  {expenseChart.map((_, i) => (
                    <Cell
                      key={i}
                      fill={GOLD_PALETTE[i % GOLD_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatToman(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", direction: "rtl" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* P&L trend line */}
      <ChartCard
        title="روند سود و زیان"
        description="سود/زیان روزانه در ۳۰ روز گذشته"
        icon={LineIcon}
      >
        {daily.every((d) => d.profit === 0) ? (
          <EmptyChart message="داده‌ای موجود نیست" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={dailyChart}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={axisTickStyle}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(daily.length / 8) - 1)}
              />
              <YAxis
                tick={axisTickStyle}
                tickFormatter={tomanTickFormatter}
                width={55}
                orientation="right"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatToman(value)}
                contentStyle={tooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="سود"
                stroke="#D4A017"
                strokeWidth={2.5}
                fill="url(#profitGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Summary detail card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="خلاصه صورت سود و زیان"
          description="۳۰ روز گذشته"
          icon={Receipt}
        >
          <div className="space-y-2.5">
            <PnLRow label="فروش ناخالص" value={summary.grossSales} />
            <PnLRow
              label="اجرت"
              value={summary.totalMaking}
              positive
            />
            <PnLRow
              label="تخفیف"
              value={-summary.totalDiscount}
              negative
            />
            <PnLRow
              label="درآمد کل"
              value={summary.revenue}
              bold
              divider
            />
            <PnLRow
              label="هزینه‌ها"
              value={-summary.totalExpenses}
              negative
              divider
            />
            <PnLRow
              label="سود خالص"
              value={summary.netProfit}
              bold
              accent={summary.netProfit >= 0 ? "green" : "rose"}
            />
            <PnLRow
              label="حاشیه سود"
              textValue={`${toPersianDigits(summary.profitMargin)}٪`}
              accent={summary.profitMargin >= 0 ? "green" : "rose"}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="دسته‌های هزینه (جدول)"
          description="جزئیات هزینه‌ها بر اساس دسته"
          icon={Wallet}
        >
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>دسته</TableHead>
                  <TableHead className="text-right">دفعات</TableHead>
                  <TableHead className="text-right">مبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesByCategory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-6"
                    >
                      هزینه‌ای ثبت نشده است
                    </TableCell>
                  </TableRow>
                ) : (
                  expensesByCategory.map((e, i) => (
                    <TableRow key={e.category}>
                      <TableCell className="text-center text-muted-foreground font-medium">
                        {toPersianDigits(i + 1)}
                      </TableCell>
                      <TableCell className="font-medium">{e.label}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {toPersianDigits(e.count)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600">
                        {formatToman(e.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </ChartCard>
      </div>
    </div>
  );
}

function PnLRow({
  label,
  value,
  textValue,
  positive,
  negative,
  bold,
  accent,
  divider,
}: {
  label: string;
  value?: number;
  textValue?: string;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
  accent?: "green" | "rose" | "amber";
  divider?: boolean;
}) {
  const display = textValue
    ? textValue
    : value !== undefined
    ? formatToman(Math.abs(value))
    : "—";
  const valueColor = accent
    ? accent === "green"
      ? "text-emerald-600"
      : accent === "rose"
      ? "text-rose-600"
      : "text-amber-600"
    : positive
    ? "text-emerald-600"
    : negative
    ? "text-rose-600"
    : "";
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        divider ? "border-t pt-2.5 mt-1" : ""
      }`}
    >
      <span className={`text-muted-foreground ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span
        className={`${valueColor} ${
          bold ? "font-bold text-base" : "font-medium"
        }`}
      >
        {value !== undefined && value < 0 ? "− " : ""}
        {display}
      </span>
    </div>
  );
}

// ============= SKELETON =============
function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 h-32">
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-1/3 mb-4" />
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============= CSV EXPORTS =============
function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(",");
}

function exportSalesCsv(data: SalesReport): string {
  const lines: string[] = [];
  lines.push(csvRow(["گزارش فروش"]));
  lines.push(
    csvRow([
      "بازه شروع",
      new Date(data.range.from).toLocaleDateString("fa-IR"),
    ])
  );
  lines.push(
    csvRow(["بازه پایان", new Date(data.range.to).toLocaleDateString("fa-IR")])
  );
  lines.push("");
  lines.push(csvRow(["خلاصه"]));
  lines.push(
    csvRow(["کل فروش", Math.round(data.summary.totalSales), "تومان"])
  );
  lines.push(csvRow(["تعداد فاکتور", data.summary.count]));
  lines.push(
    csvRow(["میانگین سفارش", Math.round(data.summary.avgOrderValue), "تومان"])
  );
  lines.push(
    csvRow(["کل اجرت", Math.round(data.summary.totalMaking), "تومان"])
  );
  lines.push(
    csvRow(["کل تخفیف", Math.round(data.summary.totalDiscount), "تومان"])
  );
  lines.push("");
  lines.push(csvRow(["سری زمانی فروش"]));
  lines.push(csvRow(["برچسب", "کلید", "مبلغ (تومان)", "تعداد"]));
  for (const s of data.series) {
    lines.push(csvRow([s.label, s.key, Math.round(s.total), s.count]));
  }
  lines.push("");
  lines.push(csvRow(["روش‌های پرداخت"]));
  lines.push(csvRow(["روش", "مبلغ (تومان)", "تعداد"]));
  for (const p of data.byPaymentMethod) {
    lines.push(
      csvRow([
        PAYMENT_LABELS[p.method] || p.method,
        Math.round(p.total),
        p.count,
      ])
    );
  }
  lines.push("");
  lines.push(csvRow(["فروش بر اساس شعبه"]));
  lines.push(csvRow(["شعبه", "مبلغ (تومان)", "تعداد"]));
  for (const b of data.byBranch) {
    lines.push(csvRow([b.branchName, Math.round(b.total), b.count]));
  }
  lines.push("");
  lines.push(csvRow(["فروش بر اساس ساعت"]));
  lines.push(csvRow(["ساعت", "مبلغ (تومان)", "تعداد"]));
  for (const h of data.byHour) {
    if (h.count > 0)
      lines.push(csvRow([h.hour, Math.round(h.total), h.count]));
  }
  lines.push("");
  lines.push(csvRow(["پرفروش‌ترین محصولات"]));
  lines.push(csvRow(["نام محصول", "تعداد", "دفعات فروش", "درآمد (تومان)"]));
  for (const p of data.topProducts) {
    lines.push(
      csvRow([p.name, p.quantity, p.salesCount, Math.round(p.revenue)])
    );
  }
  return lines.join("\n");
}

function exportInventoryCsv(data: InventoryReport): string {
  const lines: string[] = [];
  lines.push(csvRow(["گزارش انبار"]));
  lines.push("");
  lines.push(csvRow(["خلاصه"]));
  lines.push(
    csvRow(["ارزش خرید", Math.round(data.summary.purchaseValue), "تومان"])
  );
  lines.push(
    csvRow(["ارزش فروش", Math.round(data.summary.retailValue), "تومان"])
  );
  lines.push(
    csvRow([
      "سود بالقوه",
      Math.round(data.summary.potentialProfit),
      "تومان",
    ])
  );
  lines.push(csvRow(["کل کالا", data.summary.totalUnits]));
  lines.push(csvRow(["انواع محصول", data.summary.totalSkus]));
  lines.push(csvRow(["وزن کل طلا (گرم)", data.summary.totalGoldWeight]));
  lines.push(csvRow(["موجود", data.summary.inStock]));
  lines.push(csvRow(["کم موجود", data.summary.lowStock]));
  lines.push(csvRow(["ناموجود", data.summary.outOfStock]));
  lines.push("");
  lines.push(csvRow(["توزیع عیارها"]));
  lines.push(csvRow(["عیار", "وزن (گرم)", "تعداد", "محصولات"]));
  for (const k of data.byKarat) {
    lines.push(csvRow([karatLabel(k.karat), k.weight, k.units, k.products]));
  }
  lines.push("");
  lines.push(csvRow(["دسته‌بندی محصولات"]));
  lines.push(csvRow(["دسته", "محصولات", "تعداد", "ارزش (تومان)"]));
  for (const c of data.byCategory) {
    lines.push(
      csvRow([c.categoryName, c.products, c.units, Math.round(c.value)])
    );
  }
  lines.push("");
  lines.push(csvRow(["کهنگی انبار"]));
  lines.push(csvRow(["بازه (روز)", "تعداد", "ارزش (تومان)"]));
  for (const a of data.aging) {
    lines.push(csvRow([a.label, a.units, Math.round(a.value)]));
  }
  lines.push("");
  lines.push(csvRow(["باارزش‌ترین محصولات"]));
  lines.push(
    csvRow([
      "نام محصول",
      "عیار",
      "موجودی",
      "وزن واحد (گرم)",
      "ارزش خرید (تومان)",
      "ارزش فروش (تومان)",
    ])
  );
  for (const p of data.topValue) {
    lines.push(
      csvRow([
        p.name,
        karatLabel(p.karat),
        p.stock,
        p.weight,
        Math.round(p.totalValue),
        Math.round(p.retailValue),
      ])
    );
  }
  return lines.join("\n");
}

function exportCustomersCsv(data: CustomersReport): string {
  const lines: string[] = [];
  lines.push(csvRow(["گزارش مشتریان"]));
  lines.push("");
  lines.push(csvRow(["خلاصه"]));
  lines.push(csvRow(["کل مشتریان", data.summary.totalCustomers]));
  lines.push(csvRow(["مشتریان جدید (۳۰ روز)", data.summary.newCustomers]));
  lines.push(csvRow(["مشتریان بازگشتی", data.summary.repeatCustomers]));
  lines.push(csvRow(["نرخ تکرار خرید", data.summary.repeatRate + "٪"]));
  lines.push(
    csvRow([
      "میانگین خرید هر مشتری",
      Math.round(data.summary.avgSpendPerCustomer),
      "تومان",
    ])
  );
  lines.push(
    csvRow([
      "میانگین سفارش هر مشتری",
      data.summary.avgOrdersPerCustomer.toFixed(2),
    ])
  );
  lines.push(csvRow(["کل امتیازات", data.summary.totalLoyaltyPoints]));
  lines.push("");
  lines.push(csvRow(["بخش‌بندی مشتریان"]));
  lines.push(csvRow(["سطح", "تعداد", "مجموع خرید (تومان)"]));
  for (const s of data.segments) {
    lines.push(csvRow([s.label, s.count, Math.round(s.totalSpent)]));
  }
  lines.push("");
  lines.push(csvRow(["روند مشتریان جدید"]));
  lines.push(csvRow(["روز", "تعداد"]));
  for (const t of data.newCustomersTrend) {
    lines.push(csvRow([t.label, t.count]));
  }
  lines.push("");
  lines.push(csvRow(["برترین مشتریان"]));
  lines.push(
    csvRow([
      "نام",
      "تلفن",
      "سطح",
      "تعداد سفارش",
      "مجموع خرید (تومان)",
      "امتیاز",
    ])
  );
  for (const c of data.topCustomers) {
    lines.push(
      csvRow([
        c.name,
        c.phone || "",
        c.tierLabel,
        c.totalOrders,
        Math.round(c.totalSpent),
        c.loyaltyPoints,
      ])
    );
  }
  return lines.join("\n");
}

function exportStaffCsv(data: StaffReport): string {
  const lines: string[] = [];
  lines.push(csvRow(["گزارش عملکرد کارکنان"]));
  lines.push(
    csvRow([
      "بازه شروع",
      new Date(data.range.from).toLocaleDateString("fa-IR"),
    ])
  );
  lines.push(
    csvRow([
      "بازه پایان",
      new Date(data.range.to).toLocaleDateString("fa-IR"),
    ])
  );
  lines.push("");
  lines.push(csvRow(["خلاصه"]));
  lines.push(csvRow(["کل کارکنان", data.summary.totalStaff]));
  lines.push(csvRow(["کارکنان فعال", data.summary.activeCashiers]));
  lines.push(
    csvRow(["کل درآمد", Math.round(data.summary.totalRevenue), "تومان"])
  );
  lines.push(csvRow(["کل فروش", data.summary.totalSales]));
  if (data.summary.topPerformer) {
    lines.push(csvRow(["برترین کارمند", data.summary.topPerformer.name]));
  }
  lines.push("");
  lines.push(csvRow(["جزئیات کارکنان"]));
  lines.push(
    csvRow([
      "نام",
      "نقش",
      "شعبه",
      "تعداد فروش",
      "درآمد (تومان)",
      "میانگین سفارش (تومان)",
      "تخفیف (تومان)",
      "اجرت (تومان)",
    ])
  );
  for (const s of data.staff) {
    lines.push(
      csvRow([
        s.name,
        s.roleLabel,
        s.branchName,
        s.salesCount,
        Math.round(s.totalRevenue),
        Math.round(s.avgOrderValue),
        Math.round(s.totalDiscount),
        Math.round(s.totalMaking),
      ])
    );
  }
  return lines.join("\n");
}

function exportFinancialCsv(data: FinancialReport): string {
  const lines: string[] = [];
  lines.push(csvRow(["گزارش مالی (۳۰ روز)"]));
  lines.push(
    csvRow([
      "بازه شروع",
      new Date(data.range.from).toLocaleDateString("fa-IR"),
    ])
  );
  lines.push(
    csvRow(["بازه پایان", new Date(data.range.to).toLocaleDateString("fa-IR")])
  );
  lines.push("");
  lines.push(csvRow(["خلاصه صورت سود و زیان"]));
  lines.push(csvRow(["فروش ناخالص", Math.round(data.summary.grossSales)]));
  lines.push(csvRow(["اجرت", Math.round(data.summary.totalMaking)]));
  lines.push(csvRow(["تخفیف", Math.round(data.summary.totalDiscount)]));
  lines.push(csvRow(["درآمد کل", Math.round(data.summary.revenue)]));
  lines.push(csvRow(["هزینه‌ها", Math.round(data.summary.totalExpenses)]));
  lines.push(csvRow(["سود خالص", Math.round(data.summary.netProfit)]));
  lines.push(csvRow(["حاشیه سود", data.summary.profitMargin + "٪"]));
  lines.push("");
  lines.push(csvRow(["هزینه‌ها بر اساس دسته"]));
  lines.push(csvRow(["دسته", "دفعات", "مبلغ (تومان)"]));
  for (const e of data.expensesByCategory) {
    lines.push(csvRow([e.label, e.count, Math.round(e.total)]));
  }
  lines.push("");
  lines.push(csvRow(["روند روزانه سود و زیان"]));
  lines.push(csvRow(["روز", "درآمد", "هزینه", "سود"]));
  for (const d of data.daily) {
    lines.push(
      csvRow([
        d.label,
        Math.round(d.revenue),
        Math.round(d.expenses),
        Math.round(d.profit),
      ])
    );
  }
  return lines.join("\n");
}

