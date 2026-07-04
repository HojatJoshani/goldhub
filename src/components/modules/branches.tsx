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
  Building2,
  Warehouse,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  Package,
  Users,
  Crown,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  Trash2,
  TrendingUp,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatToman,
  toPersianDigits,
  formatPersianDate,
  formatPersianDateTime,
  statusLabel,
} from "@/lib/persian";

// ============ Types ============

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  isWarehouse: boolean;
  isMain: boolean;
  status: string;
  createdAt: string;
  usersCount: number;
  productsCount: number;
  salesCount: number;
  cashboxesCount: number;
}

interface TransferItem {
  productId: string;
  name: string;
  qty: number;
}

interface Transfer {
  id: string;
  reference: string;
  status: string;
  notes?: string | null;
  items: TransferItem[];
  itemsCount: number;
  fromBranch: { id: string; name: string; code: string };
  toBranch: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  stock: number;
  branchId?: string | null;
  branchName?: string;
}

interface BranchPerformance {
  id: string;
  name: string;
  code: string;
  isWarehouse: boolean;
  isMain: boolean;
  sales: number;
}

// ============ Constants ============

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  in_transit: "در حال انتقال",
  received: "دریافت شده",
  cancelled: "لغو شده",
};

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  in_transit: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  received: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-900",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900",
};

// ============ Main Component ============

export function BranchesModule() {
  const [tab, setTab] = React.useState("branches");

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-500" />
              شعبات و انبارها
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              مدیریت شعبات، انبارها، انتقالات بین شعبه‌ای و شاخص عملکرد
            </p>
          </div>
          <TabsList className="h-auto">
            <TabsTrigger value="branches" className="gap-1.5">
              <Store className="w-4 h-4" />
              شعبات و انبارها
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              انتقالات انبار
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5">
              <TrendingUp className="w-4 h-4" />
              شاخص شعبات
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="branches" className="mt-6">
          <BranchesTab />
        </TabsContent>
        <TabsContent value="transfers" className="mt-6">
          <TransfersTab />
        </TabsContent>
        <TabsContent value="metrics" className="mt-6">
          <MetricsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Branches Tab ============

function BranchesTab() {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/branches", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setBranches(data.items || []);
      else toast.error(data.error || "خطا در دریافت شعبات");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          تعداد شعبات و انبارها:
          <Badge variant="secondary" className="font-mono">
            {toPersianDigits(branches.length)} مورد
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
            به‌روزرسانی
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="w-4 h-4 ml-1" />
            افزودن شعبه
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 h-48">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
            هیچ شعبه‌ای ثبت نشده است
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      )}

      <AddBranchDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={(b) => {
          setBranches((prev) => [...prev, b]);
          toast.success(`شعبه «${b.name}» با موفقیت ایجاد شد`);
        }}
      />
    </div>
  );
}

function BranchCard({ branch }: { branch: Branch }) {
  const typeBadge = branch.isMain
    ? { label: "مرکزی", icon: Crown, color: "bg-amber-500 text-white" }
    : branch.isWarehouse
    ? { label: "انبار", icon: Warehouse, color: "bg-stone-500 text-white" }
    : { label: "شعبه", icon: Store, color: "bg-emerald-600 text-white" };

  const TypeIcon = typeBadge.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${typeBadge.color}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{branch.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {branch.code}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              branch.status === "active"
                ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-300"
                : "border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300"
            }
          >
            {statusLabel(branch.status)}
          </Badge>
        </div>

        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeBadge.color}`}>
          <TypeIcon className="w-3 h-3" />
          {typeBadge.label}
        </div>

        <div className="space-y-2 text-sm">
          {branch.address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span className="font-mono" dir="ltr">{toPersianDigits(branch.phone)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
          <Stat icon={Package} value={branch.productsCount} label="محصول" />
          <Stat icon={Users} value={branch.usersCount} label="کاربر" />
          <Stat icon={TrendingUp} value={branch.salesCount} label="فروش" />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 mx-auto text-amber-500 mb-1" />
      <p className="font-bold text-sm">{toPersianDigits(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AddBranchDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (b: Branch) => void;
}) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isWarehouse, setIsWarehouse] = React.useState(false);
  const [isMain, setIsMain] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setName("");
    setCode("");
    setAddress("");
    setPhone("");
    setIsWarehouse(false);
    setIsMain(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام شعبه الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          isWarehouse,
          isMain,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ایجاد شعبه");
        return;
      }
      onCreated({
        ...data,
        usersCount: 0,
        productsCount: 0,
        salesCount: 0,
        cashboxesCount: 0,
      });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            افزودن شعبه / انبار جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات شعبه یا انبار جدید را وارد کنید
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="br-name">نام *</Label>
            <Input
              id="br-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شعبه شیراز"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="br-code">کد شعبه</Label>
            <Input
              id="br-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="خودی وارد شوید یا خالی بگذارید"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              در صورت خالی گذاشتن، کد به‌صورت خودکار تولید می‌شود
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="br-address">آدرس</Label>
            <Textarea
              id="br-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="آدرس کامل"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="br-phone">تلفن</Label>
            <Input
              id="br-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 021-55551234"
              className="font-mono"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-stone-500" />
                <div>
                  <Label className="cursor-pointer">انبار</Label>
                  <p className="text-xs text-muted-foreground">این مکان انبار است</p>
                </div>
              </div>
              <Switch checked={isWarehouse} onCheckedChange={setIsWarehouse} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <div>
                  <Label className="cursor-pointer">شعبه مرکزی</Label>
                  <p className="text-xs text-muted-foreground">شعبه اصلی فروشگاه</p>
                </div>
              </div>
              <Switch checked={isMain} onCheckedChange={setIsMain} />
            </div>
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
            ایجاد شعبه
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Transfers Tab ============

function TransfersTab() {
  const [transfers, setTransfers] = React.useState<Transfer[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [trRes, brRes] = await Promise.all([
        fetch("/api/transfers", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
      ]);
      const trData = await trRes.json();
      const brData = await brRes.json();
      if (trRes.ok) setTransfers(trData.items || []);
      if (brRes.ok) setBranches(brData.items || []);
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/products?pageSize=100", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setProducts(
          (data.items || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            stock: p.stock,
            branchId: p.branchId,
            branchName: p.branch?.name,
          }))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (
    transfer: Transfer,
    action: "in_transit" | "received" | "cancelled"
  ) => {
    setActionLoading(transfer.id + action);
    try {
      const res = await fetch(`/api/transfers/${transfer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در به‌روزرسانی انتقال");
        return;
      }
      toast.success(
        action === "in_transit"
          ? "انتقال در جریان قرار گرفت"
          : action === "received"
          ? "انتقال با موفقیت دریافت شد"
          : "انتقال لغو شد"
      );
      setTransfers((prev) =>
        prev.map((t) => (t.id === transfer.id ? { ...t, status: action } : t))
      );
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return transfers;
    return transfers.filter((t) => t.status === statusFilter);
  }, [transfers, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="in_transit">در حال انتقال</SelectItem>
              <SelectItem value="received">دریافت شده</SelectItem>
              <SelectItem value="cancelled">لغو شده</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
            به‌روزرسانی
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => {
            loadProducts();
            setShowCreate(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 ml-1" />
          انتقال جدید
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
              <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-50" />
              هیچ انتقالی یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره ارجاع</TableHead>
                    <TableHead>مبدا → مقصد</TableHead>
                    <TableHead>اقلام</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {t.reference}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{t.fromBranch.name}</span>
                          <ChevronLeft className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-medium">{t.toBranch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {toPersianDigits(t.itemsCount)} عدد
                        </Badge>
                        <span className="text-xs text-muted-foreground mr-2">
                          ({toPersianDigits(t.items.length)} کالا)
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${TRANSFER_STATUS_COLORS[t.status] || ""}`}
                        >
                          {TRANSFER_STATUS_LABELS[t.status] || t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatPersianDate(t.createdAt)}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                                disabled={actionLoading === t.id + "in_transit"}
                                onClick={() => handleAction(t, "in_transit")}
                              >
                                {actionLoading === t.id + "in_transit" ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Truck className="w-3 h-3" />
                                )}
                                شروع انتقال
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                disabled={actionLoading === t.id + "cancelled"}
                                onClick={() => handleAction(t, "cancelled")}
                              >
                                {actionLoading === t.id + "cancelled" ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                لغو
                              </Button>
                            </>
                          )}
                          {t.status === "in_transit" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950/40"
                                disabled={actionLoading === t.id + "received"}
                                onClick={() => handleAction(t, "received")}
                              >
                                {actionLoading === t.id + "received" ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                تایید دریافت
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                disabled={actionLoading === t.id + "cancelled"}
                                onClick={() => handleAction(t, "cancelled")}
                              >
                                <XCircle className="w-3 h-3" />
                                لغو
                              </Button>
                            </>
                          )}
                          {(t.status === "received" || t.status === "cancelled") && (
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              {t.status === "received" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              )}
                              تکمیل شده
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTransferDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        branches={branches}
        products={products}
        onCreated={(t) => {
          setTransfers((prev) => [t, ...prev]);
          toast.success(`انتقال «${t.reference}» با موفقیت ثبت شد`);
        }}
      />
    </div>
  );
}

function CreateTransferDialog({
  open,
  onOpenChange,
  branches,
  products,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branches: Branch[];
  products: ProductOption[];
  onCreated: (t: Transfer) => void;
}) {
  const [fromBranchId, setFromBranchId] = React.useState("");
  const [toBranchId, setToBranchId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, number>>({});
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setFromBranchId("");
    setToBranchId("");
    setNotes("");
    setSelected({});
  };

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setQty = (id: string, qty: number) => {
    setSelected((prev) => ({
      ...prev,
      [id]: Math.max(1, qty),
    }));
  };

  const selectedProducts = products.filter((p) => selected[p.id] !== undefined);

  const handleSubmit = async () => {
    if (!fromBranchId || !toBranchId) {
      toast.error("شعبه مبدا و مقصد را انتخاب کنید");
      return;
    }
    if (fromBranchId === toBranchId) {
      toast.error("شعبه مبدا و مقصد نمی‌توانند یکسان باشند");
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error("حداقل یک کالا اضافه کنید");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBranchId,
          toBranchId,
          notes: notes.trim() || undefined,
          items: selectedProducts.map((p) => ({
            productId: p.id,
            name: p.name,
            qty: selected[p.id],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ثبت انتقال");
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            انتقال کالا بین شعبات
          </DialogTitle>
          <DialogDescription>
            کالاهای موردنظر را از یک شعبه به شعبه دیگر منتقل کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pl-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>شعبه مبدا *</Label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب شعبه مبدا" />
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
              <Label>شعبه مقصد *</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب شعبه مقصد" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((b) => b.id !== fromBranchId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>توضیحات (اختیاری)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیحات مربوط به این انتقال"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>کالاهای منتقل‌شونده</Label>
            <div className="border rounded-lg max-h-64 overflow-y-auto custom-scrollbar">
              {products.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  محصولی یافت نشد
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>نام کالا</TableHead>
                      <TableHead>موجودی</TableHead>
                      <TableHead className="w-24">تعداد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => {
                      const isSel = selected[p.id] !== undefined;
                      return (
                        <TableRow
                          key={p.id}
                          className={`cursor-pointer ${isSel ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
                          onClick={() => toggleProduct(p.id)}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => toggleProduct(p.id)}
                              className="w-4 h-4 accent-amber-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {p.sku}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {toPersianDigits(p.stock)}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {isSel && (
                              <Input
                                type="number"
                                min={1}
                                max={p.stock}
                                value={selected[p.id]}
                                onChange={(e) =>
                                  setQty(p.id, parseInt(e.target.value, 10) || 1)
                                }
                                className="h-8 w-20 font-mono"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تعداد کالاهای انتخاب‌شده:</span>
                <Badge className="bg-amber-500 text-white">
                  {toPersianDigits(selectedProducts.length)} کالا
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">مجموع تعداد:</span>
                <span className="font-mono font-medium">
                  {toPersianDigits(
                    selectedProducts.reduce((s, p) => s + selected[p.id], 0)
                  )} عدد
                </span>
              </div>
            </div>
          )}
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
            ثبت انتقال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Metrics Tab ============

function MetricsTab() {
  const [branches, setBranches] = React.useState<BranchPerformance[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      // Get summary which includes branchPerformance
      const res = await fetch("/api/accounting/summary", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        // Filter to non-warehouse branches & sort by sales desc
        const list = (data.branchPerformance || [])
          .filter((b: BranchPerformance) => !b.isWarehouse)
          .sort((a: BranchPerformance, b: BranchPerformance) => b.sales - a.sales);
        setBranches(list);
      } else {
        toast.error(data.error || "خطا در دریافت شاخص شعبات");
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

  const maxSales = branches.length > 0 ? branches[0].sales : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 h-40">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
          داده‌ای برای نمایش شاخص شعبات موجود نیست
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          مقایسه فروش شعبات در ۳۰ روز گذشته
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
          به‌روزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b, idx) => {
          const pct = maxSales > 0 ? Math.round((b.sales / maxSales) * 100) : 0;
          const rank = idx + 1;
          const isTop = rank === 1;
          return (
            <Card
              key={b.id}
              className={
                isTop
                  ? "border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20"
                  : ""
              }
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                        isTop
                          ? "bg-amber-500 text-white"
                          : rank === 2
                          ? "bg-stone-300 text-stone-800 dark:bg-stone-700 dark:text-stone-100"
                          : rank === 3
                          ? "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isTop ? <Crown className="w-5 h-5" /> : toPersianDigits(rank)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{b.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{b.code}</p>
                    </div>
                  </div>
                  {b.isMain && (
                    <Badge className="bg-amber-500 text-white gap-1">
                      <Crown className="w-3 h-3" />
                      مرکزی
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">فروش ۳۰ روز</p>
                  <p className="text-xl font-bold">{formatToman(b.sales)}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>سهم نسبت به برتر</span>
                    <span className="font-mono">{toPersianDigits(pct)}٪</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-amber-500 to-yellow-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
