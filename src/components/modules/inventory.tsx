"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  PackagePlus,
  AlertTriangle,
  Wallet,
  Scale,
  Boxes,
  QrCode,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Tags,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatToman,
  formatNumber,
  formatWeight,
  toPersianDigits,
  formatPersianDateTime,
  karatLabel,
  KARAT_LABELS,
} from "@/lib/persian";

// ============ Types ============

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { products: number };
}

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description?: string | null;
  karat: string;
  weight: number;
  makingCharge: number;
  makingType: string;
  stoneWeight: number;
  stoneCost: number;
  purchasePrice: number;
  salePrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  status: string;
  categoryId: string | null;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  reason?: string | null;
  createdAt: string;
  product?: { id: string; name: string; sku: string; karat: string };
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ Constants ============

const MAKING_TYPE_LABELS: Record<string, string> = {
  per_gram: "هر گرم",
  flat: "مقطوع",
  percent: "درصدی",
};

const STOCK_MOVE_TYPE_LABELS: Record<string, string> = {
  purchase: "خرید / ورود",
  sale: "فروش",
  transfer_in: "انتقال ورودی",
  transfer_out: "انتقال خروجی",
  adjustment: "تعدیل",
  return: "مرجوعی",
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  discontinued: "توقف تولید",
};

const KARAT_OPTIONS = Object.keys(KARAT_LABELS);

const PAGE_SIZE = 10;

// ============ Main Component ============

export function InventoryModule() {
  const [tab, setTab] = React.useState("products");

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
              <span className="truncate">مدیریت انبار</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              مدیریت محصولات، حرکات انبار و دسته‌بندی‌ها
            </p>
          </div>
          <TabsList className="h-auto w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Boxes className="w-4 h-4 shrink-0" />
              <span className="truncate">محصولات</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span className="truncate">حرکات</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Tags className="w-4 h-4 shrink-0" />
              <span className="truncate">دسته‌ها</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="products" className="mt-4 sm:mt-6">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="movements" className="mt-4 sm:mt-6">
          <MovementsTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4 sm:mt-6">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Stats Row ============

interface Stats {
  total: number;
  inventoryValue: number;
  totalWeight: number;
  lowStock: number;
}

function StatsRow({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/products?pageSize=1000&_=${refreshKey}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data: ListResponse<Product> = await res.json();
        const items = data.items || [];
        const inventoryValue = items.reduce(
          (s, p) => s + p.purchasePrice * p.stock,
          0
        );
        const totalWeight = items.reduce(
          (s, p) => s + p.weight * p.stock,
          0
        );
        const lowStock = items.filter(
          (p) => p.stock <= p.minStock
        ).length;
        if (active) {
          setStats({
            total: items.length,
            inventoryValue,
            totalWeight,
            lowStock,
          });
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-5 h-24 sm:h-32">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title="تعداد محصولات"
        value={toPersianDigits(stats.total)}
        icon={Boxes}
        accent="amber"
      />
      <StatCard
        title="ارزش انبار"
        value={formatToman(stats.inventoryValue)}
        icon={Wallet}
        accent="green"
      />
      <StatCard
        title="وزن کل طلا"
        value={formatWeight(stats.totalWeight)}
        icon={Scale}
        accent="purple"
      />
      <StatCard
        title="محصولات کم موجود"
        value={toPersianDigits(stats.lowStock)}
        icon={AlertTriangle}
        accent="red"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "amber" | "green" | "purple" | "red";
}) {
  const accentColors: Record<string, string> = {
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
    red: "bg-red-100 dark:bg-red-950/40 text-red-600",
  };
  return (
    <Card>
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <p className="text-[11px] sm:text-sm text-muted-foreground mb-1 truncate">{title}</p>
        <p className="text-base sm:text-xl font-bold truncate tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

// ============ Products Tab ============

function ProductsTab() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<Category[]>([]);

  // Filters
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("all");
  const [karat, setKarat] = React.useState<string>("all");
  const [lowStock, setLowStock] = React.useState(false);

  // Dialogs
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [stockDialogProduct, setStockDialogProduct] =
    React.useState<Product | null>(null);
  const [deleteDialogProduct, setDeleteDialogProduct] =
    React.useState<Product | null>(null);

  // Load categories once
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.items || []);
        }
      } catch {
        // ignore
      }
    })();
  }, [refreshKey]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (categoryId !== "all") params.set("categoryId", categoryId);
        if (karat !== "all") params.set("karat", karat);
        if (lowStock) params.set("lowStock", "true");
        const res = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("fetch failed");
        const data: ListResponse<Product> = await res.json();
        if (active) {
          setProducts(data.items || []);
          setTotal(data.total || 0);
        }
      } catch {
        if (active) {
          toast.error("خطا در دریافت محصولات");
          setProducts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, debouncedSearch, categoryId, karat, lowStock, refreshKey]);

  const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleFormSubmit = async () => {
    setFormOpen(false);
    setEditing(null);
    refresh();
  };

  const handleStockSubmit = async () => {
    setStockDialogProduct(null);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteDialogProduct) return;
    try {
      const res = await fetch(
        `/api/products/${deleteDialogProduct.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در حذف محصول");
      }
      toast.success("محصول با موفقیت حذف شد");
      setDeleteDialogProduct(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در حذف محصول");
    }
  };

  return (
    <div className="space-y-4">
      <StatsRow refreshKey={refreshKey} />

      {/* Filters bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو با نام / بارکد / SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-9"
              />
            </div>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={karat}
              onValueChange={(v) => {
                setKarat(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="عیار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه عیارها</SelectItem>
                {KARAT_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {karatLabel(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background shrink-0">
              <Switch
                checked={lowStock}
                onCheckedChange={(c) => {
                  setLowStock(c);
                  setPage(1);
                }}
              />
              <Label className="text-sm cursor-pointer">کم موجود</Label>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              افزودن محصول
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table (desktop) */}
      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="text-right">محصول</TableHead>
                    <TableHead className="text-right">بارکد / SKU</TableHead>
                    <TableHead className="text-right">عیار</TableHead>
                    <TableHead className="text-right">وزن</TableHead>
                    <TableHead className="text-right">قیمت خرید</TableHead>
                    <TableHead className="text-right">قیمت فروش</TableHead>
                    <TableHead className="text-right">موجودی</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground py-12"
                      >
                        محصولی یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {p.name}
                              </p>
                              {p.category && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {p.category.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs space-y-0.5">
                            <div className="text-foreground">{p.barcode || "—"}</div>
                            <div className="text-muted-foreground">{p.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-amber-400 text-amber-700 dark:text-amber-300"
                          >
                            {karatLabel(p.karat)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatWeight(p.weight)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatToman(p.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatToman(p.salePrice)}
                        </TableCell>
                        <TableCell>
                          {p.stock <= p.minStock ? (
                            <Badge
                              variant="destructive"
                              className="gap-1"
                              title={`حداقل موجودی: ${toPersianDigits(p.minStock)}`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {toPersianDigits(p.stock)}
                            </Badge>
                          ) : p.stock === 0 ? (
                            <Badge variant="destructive">
                              {toPersianDigits(0)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                            >
                              {toPersianDigits(p.stock)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <ProductStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              title="تعدیل موجودی"
                              onClick={() => setStockDialogProduct(p)}
                            >
                              <PackagePlus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="ویرایش"
                              onClick={() => {
                                setEditing(p);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="حذف"
                              onClick={() => setDeleteDialogProduct(p)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden p-3 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))
            ) : products.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                محصولی یافت نشد
              </div>
            ) : (
              products.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        {p.category && (
                          <p className="text-xs text-muted-foreground">
                            {p.category.name}
                          </p>
                        )}
                        <p className="font-mono text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {p.barcode || "—"} · {p.sku}
                        </p>
                      </div>
                      <ProductStatusBadge status={p.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">عیار: </span>
                        <span className="font-medium">{karatLabel(p.karat)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">وزن: </span>
                        <span className="font-medium tabular-nums">{formatWeight(p.weight)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">خرید: </span>
                        <span className="font-medium tabular-nums">{formatToman(p.purchasePrice)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">فروش: </span>
                        <span className="font-medium tabular-nums">{formatToman(p.salePrice)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      <div>
                        <span className="text-xs text-muted-foreground">موجودی: </span>
                        {p.stock <= p.minStock ? (
                          <Badge variant="destructive" className="mr-1 tabular-nums">
                            {toPersianDigits(p.stock)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mr-1 tabular-nums">
                            {toPersianDigits(p.stock)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-amber-600"
                          onClick={() => setStockDialogProduct(p)}
                          title="تعدیل موجودی"
                        >
                          <PackagePlus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                          title="ویرایش"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-destructive"
                          onClick={() => setDeleteDialogProduct(p)}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              نمایش {toPersianDigits((page - 1) * PAGE_SIZE + 1)} تا{" "}
              {toPersianDigits(Math.min(page * PAGE_SIZE, total))} از{" "}
              {toPersianDigits(total)} محصول
            </span>
            <span className="sm:hidden tabular-nums">
              {toPersianDigits(total)} محصول
            </span>
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">قبلی</span>
            </Button>
            <span className="text-xs sm:text-sm tabular-nums px-2">
              {toPersianDigits(page)} / {toPersianDigits(totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span className="hidden sm:inline">بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        product={editing}
        categories={categories}
        onSubmit={handleFormSubmit}
      />

      <StockMoveDialog
        product={stockDialogProduct}
        onClose={() => setStockDialogProduct(null)}
        onSubmit={handleStockSubmit}
      />

      <DeleteConfirmDialog
        product={deleteDialogProduct}
        onClose={() => setDeleteDialogProduct(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function ProductStatusBadge({ status }: { status: string }) {
  if (status === "active")
    return (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 gap-1"
      >
        <CheckCircle2 className="w-3 h-3" />
        {PRODUCT_STATUS_LABELS.active}
      </Badge>
    );
  if (status === "inactive")
    return <Badge variant="secondary">{PRODUCT_STATUS_LABELS.inactive}</Badge>;
  return <Badge variant="destructive">{PRODUCT_STATUS_LABELS.discontinued}</Badge>;
}

// ============ Product Form Dialog ============

interface ProductFormState {
  name: string;
  barcode: string;
  karat: string;
  weight: string;
  makingCharge: string;
  makingType: string;
  stoneWeight: string;
  stoneCost: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  categoryId: string;
  description: string;
  status: string;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  barcode: "",
  karat: "750",
  weight: "",
  makingCharge: "0",
  makingType: "per_gram",
  stoneWeight: "0",
  stoneCost: "0",
  purchasePrice: "0",
  salePrice: "0",
  stock: "0",
  minStock: "0",
  categoryId: "none",
  description: "",
  status: "active",
};

function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSubmit: () => void;
}) {
  const [form, setForm] = React.useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        barcode: product.barcode || "",
        karat: product.karat,
        weight: String(product.weight),
        makingCharge: String(product.makingCharge),
        makingType: product.makingType,
        stoneWeight: String(product.stoneWeight),
        stoneCost: String(product.stoneCost),
        purchasePrice: String(product.purchasePrice),
        salePrice: String(product.salePrice),
        stock: String(product.stock),
        minStock: String(product.minStock),
        categoryId: product.categoryId || "none",
        description: product.description || "",
        status: product.status,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [product, open]);

  const update = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const generateBarcode = () => {
    const code = `${Date.now().toString().slice(-10)}${Math.floor(
      Math.random() * 90 + 10
    )}`;
    update("barcode", code);
    toast.success("بارکد جدید تولید شد");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("نام محصول الزامی است");
      return;
    }
    if (!form.weight || Number(form.weight) <= 0) {
      toast.error("وزن معتبر وارد کنید");
      return;
    }
    if (!form.salePrice || Number(form.salePrice) <= 0) {
      toast.error("قیمت فروش معتبر وارد کنید");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        karat: form.karat,
        weight: Number(form.weight),
        makingCharge: Number(form.makingCharge),
        makingType: form.makingType,
        stoneWeight: Number(form.stoneWeight),
        stoneCost: Number(form.stoneCost),
        purchasePrice: Number(form.purchasePrice),
        salePrice: Number(form.salePrice),
        stock: parseInt(form.stock, 10),
        minStock: parseInt(form.minStock, 10),
        categoryId: form.categoryId === "none" ? null : form.categoryId,
        description: form.description.trim(),
        status: form.status,
      };

      const isEdit = !!product;
      const url = isEdit
        ? `/api/products/${product!.id}`
        : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ذخیره محصول");
      }

      toast.success(isEdit ? "محصول به‌روزرسانی شد" : "محصول با موفقیت ایجاد شد");
      onSubmit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ذخیره محصول");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>
            {product ? "ویرایش محصول" : "افزودن محصول جدید"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? `ویرایش ${product.name}`
              : "اطلاعات محصول جدید را وارد کنید"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Name */}
            <Field label="نام محصول *" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="مثال: انگشتر طلا ۱۸ عیار"
                required
              />
            </Field>

            {/* Barcode */}
            <Field label="بارکد">
              <div className="flex gap-2">
                <Input
                  value={form.barcode}
                  onChange={(e) => update("barcode", e.target.value)}
                  placeholder="خودی تولید می‌شود"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateBarcode}
                  title="تولید بارکد"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </Field>

            {/* Category */}
            <Field label="دسته‌بندی">
              <Select
                value={form.categoryId}
                onValueChange={(v) => update("categoryId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون دسته</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Karat */}
            <Field label="عیار *">
              <Select
                value={form.karat}
                onValueChange={(v) => update("karat", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KARAT_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {karatLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Weight */}
            <Field label="وزن (گرم) *">
              <Input
                type="number"
                step="0.001"
                min="0"
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                required
              />
            </Field>

            {/* Making charge */}
            <Field label="اجرت ساخت">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.makingCharge}
                onChange={(e) => update("makingCharge", e.target.value)}
              />
            </Field>

            {/* Making type */}
            <Field label="نوع اجرت">
              <Select
                value={form.makingType}
                onValueChange={(v) => update("makingType", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MAKING_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Stone weight */}
            <Field label="وزن سنگ">
              <Input
                type="number"
                step="0.001"
                min="0"
                value={form.stoneWeight}
                onChange={(e) => update("stoneWeight", e.target.value)}
              />
            </Field>

            {/* Stone cost */}
            <Field label="هزینه سنگ (تومان)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.stoneCost}
                onChange={(e) => update("stoneCost", e.target.value)}
              />
            </Field>

            {/* Purchase price */}
            <Field label="قیمت خرید (تومان)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.purchasePrice}
                onChange={(e) => update("purchasePrice", e.target.value)}
              />
            </Field>

            {/* Sale price */}
            <Field label="قیمت فروش (تومان) *">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => update("salePrice", e.target.value)}
                required
              />
            </Field>

            {/* Stock */}
            <Field label="موجودی فعلی">
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
                disabled={!!product}
                placeholder={product ? "از طریق تعدیل موجودی تغییر دهید" : ""}
              />
            </Field>

            {/* Min stock */}
            <Field label="حداقل موجودی">
              <Input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => update("minStock", e.target.value)}
              />
            </Field>

            {/* Status (only on edit) */}
            {product && (
              <Field label="وضعیت">
                <Select
                  value={form.status}
                  onValueChange={(v) => update("status", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* Description */}
            <Field label="توضیحات" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="توضیحات اختیاری محصول..."
                rows={2}
              />
            </Field>
          </div>

          {/* Barcode preview */}
          {form.barcode && (
            <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-3">
              <div className="flex items-end gap-[2px] h-10" aria-hidden>
                {Array.from(form.barcode).map((ch, i) => {
                  const h = 20 + (ch.charCodeAt(0) % 70);
                  const w = (i % 3) + 1;
                  return (
                    <div
                      key={i}
                      className="bg-foreground"
                      style={{ width: `${w}px`, height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="font-mono text-sm">
                <div className="text-muted-foreground text-xs">بارکد</div>
                <div className="font-bold tracking-wider">{form.barcode}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {product ? "ذخیره تغییرات" : "ایجاد محصول"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

// ============ Stock Move Dialog ============

function StockMoveDialog({
  product,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [type, setType] = React.useState<"purchase" | "adjustment">("purchase");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (product) {
      setType("purchase");
      setQuantity("");
      setReason("");
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error("تعداد معتبر وارد کنید");
      return;
    }
    if (type === "purchase" && qty < 0) {
      toast.error("برای خرید، تعداد باید مثبت باشد");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          quantity: qty,
          reason: reason.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ثبت حرکت");
      }
      toast.success("حرکت انبار با موفقیت ثبت شد");
      onSubmit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت حرکت");
    } finally {
      setSaving(false);
    }
  };

  const newStock = product.stock + (parseInt(quantity, 10) || 0);

  return (
    <Dialog
      open={!!product}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-amber-500" />
            تعدیل موجودی
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{product.name}</span>{" "}
            · موجودی فعلی: {toPersianDigits(product.stock)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="نوع حرکت">
            <Select
              value={type}
              onValueChange={(v) => setType(v as "purchase" | "adjustment")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-green-600" />
                    خرید / ورود به انبار
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                    تعدیل (مثبت یا منفی)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={
              type === "purchase" ? "تعداد ورودی" : "تغییر تعداد (می‌تواند منفی)"
            }
          >
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={type === "purchase" ? "مثلاً ۵" : "مثلاً ۳ یا -۲"}
              required
              autoFocus
            />
          </Field>

          {quantity && !isNaN(parseInt(quantity, 10)) && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">موجودی جدید:</span>
              <span
                className={`font-bold ${
                  newStock < 0
                    ? "text-destructive"
                    : newStock < product.stock
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {toPersianDigits(newStock)}
              </span>
            </div>
          )}

          <Field label="دلیل (اختیاری)">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثلاً خرید از بازار، شکسته شدن، ..."
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              ثبت حرکت
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ Delete Confirm Dialog ============

function DeleteConfirmDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!product) return null;
  return (
    <Dialog
      open={!!product}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            حذف محصول
          </DialogTitle>
          <DialogDescription>
            آیا از حذف{" "}
            <span className="font-medium text-foreground">{product.name}</span>{" "}
            مطمئن هستید؟ این عملیات محصول را به حالت «توقف تولید» می‌برد و
            قابل بازگشت نیست.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="w-4 h-4" />
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Movements Tab ============

function MovementsTab() {
  const [movements, setMovements] = React.useState<StockMovement[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [type, setType] = React.useState<string>("all");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (type !== "all") params.set("type", type);
        const res = await fetch(`/api/stock-movements?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("fetch failed");
        const data: ListResponse<StockMovement> = await res.json();
        if (active) {
          setMovements(data.items || []);
          setTotal(data.total || 0);
        }
      } catch {
        if (active) toast.error("خطا در دریافت حرکات انبار");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, type]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-500" />
            تاریخچه حرکات انبار
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            ثبت تمام ورود، خروج و تعدیل‌های موجودی محصولات
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filter */}
          <div className="px-3 sm:px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center gap-3">
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="نوع حرکت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه حرکات</SelectItem>
                {Object.entries(STOCK_MOVE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="text-right">محصول</TableHead>
                  <TableHead className="text-right">نوع</TableHead>
                  <TableHead className="text-right">تعداد</TableHead>
                  <TableHead className="text-right">دلیل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-12"
                    >
                      حرکتی ثبت نشده است
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => {
                    const isIncoming =
                      m.type === "purchase" ||
                      m.type === "transfer_in" ||
                      m.type === "return" ||
                      (m.type === "adjustment" && m.quantity > 0);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {formatPersianDateTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          {m.product ? (
                            <div className="min-w-[140px] sm:min-w-[160px]">
                              <p className="font-medium text-xs sm:text-sm truncate">
                                {m.product.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                                {m.product.sku} · {karatLabel(m.product.karat)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <MovementTypeBadge type={m.type} />
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold text-xs sm:text-sm tabular-nums ${
                              isIncoming ? "text-green-600" : "text-destructive"
                            }`}
                          >
                            {isIncoming ? "+" : ""}
                            {toPersianDigits(m.quantity)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground">
                          {m.reason || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              نمایش {toPersianDigits((page - 1) * PAGE_SIZE + 1)} تا{" "}
              {toPersianDigits(Math.min(page * PAGE_SIZE, total))} از{" "}
              {toPersianDigits(total)} حرکت
            </span>
            <span className="sm:hidden tabular-nums">
              {toPersianDigits(total)} حرکت
            </span>
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">قبلی</span>
            </Button>
            <span className="text-xs sm:text-sm tabular-nums px-2">
              {toPersianDigits(page)} / {toPersianDigits(totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span className="hidden sm:inline">بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MovementTypeBadge({ type }: { type: string }) {
  const label = STOCK_MOVE_TYPE_LABELS[type] || type;
  const colorMap: Record<string, string> = {
    purchase:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-900",
    sale:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900",
    transfer_in:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    transfer_out:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    adjustment:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900",
    return:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  };
  const color = colorMap[type] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={color}>
      {label}
    </Badge>
  );
}

// ============ Categories Tab ============

function CategoriesTab() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { credentials: "include" });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setCategories(data.items || []);
    } catch {
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ایجاد دسته");
      }
      toast.success("دسته‌بندی ایجاد شد");
      setName("");
      setDescription("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ایجاد دسته");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Add category */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Tags className="w-5 h-5 text-amber-500" />
            افزودن دسته‌بندی
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            دسته‌بندی جدید برای طبقه‌بندی محصولات ایجاد کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="نام دسته‌بندی *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: انگشتر، گردنبند، النگو..."
                required
              />
            </Field>
            <Field label="توضیحات">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="توضیحات اختیاری..."
              />
            </Field>
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              افزودن
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories list */}
      <Card className="lg:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">دسته‌بندی‌ها</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {toPersianDigits(categories.length)} دسته‌بندی موجود
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="text-right">نام</TableHead>
                  <TableHead className="text-right">شناسه یکتا</TableHead>
                  <TableHead className="text-right">توضیحات</TableHead>
                  <TableHead className="text-right">تعداد محصولات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-12"
                    >
                      دسته‌بندی‌ای موجود نیست
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">{c.name}</TableCell>
                      <TableCell className="font-mono text-[10px] sm:text-xs text-muted-foreground">
                        {c.slug}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                        {c.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="tabular-nums">
                          {toPersianDigits(c._count?.products ?? 0)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
