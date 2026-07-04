"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Gift,
  MessageCircle,
  Phone,
  Mail,
  Crown,
  Wallet,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  StickyNote,
  ShoppingBag,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  formatToman,
  formatNumber,
  toPersianDigits,
  formatPersianDate,
  formatRelativeTime,
  formatPersianDateTime,
  toEnglishDigits,
} from "@/lib/persian";

// ============== Types ==============
interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  nationalId: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastVisit?: string | null;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    name: string;
    karat: string;
    weight: number;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
}

interface CustomerDetail extends Customer {
  sales: Sale[];
  stats: {
    totalSpent: number;
    loyaltyPoints: number;
    totalOrders: number;
    lastVisit: string | null;
    daysToBirthday: number | null;
    avgOrder: number;
  };
}

interface Stats {
  count: number;
  totalSpent: number;
  avgSpent: number;
  totalLoyalty: number;
}

interface BirthdayCustomer {
  id: string;
  name: string;
  phone: string | null;
  birthday: string | null;
  totalSpent: number;
  loyaltyPoints: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدی",
  card: "کارتی",
  transfer: "انتقال",
  gold: "طلا",
  mixed: "ترکیبی",
};

const PAGE_SIZE = 10;

// ============== Helper: WhatsApp ==============
function buildWhatsAppUrl(phone: string | null): string | null {
  if (!phone) return null;
  // Convert Persian digits to english and strip non-digits
  let digits = toEnglishDigits(phone).replace(/\D/g, "");
  if (digits.length === 0) return null;
  // Strip leading 0 and prepend 98 (Iran country code)
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("98")) {
    // already includes country code
  } else {
    digits = "98" + digits;
  }
  return `https://wa.me/${digits}`;
}

// ============== Loyalty Tier ==============
function getLoyaltyTier(points: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (points >= 2000)
    return {
      label: "طلایی",
      color: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      icon: <Crown className="w-3 h-3" />,
    };
  if (points >= 1000)
    return {
      label: "نقره‌ای",
      color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
      icon: <Award className="w-3 h-3" />,
    };
  if (points >= 300)
    return {
      label: "برنزی",
      color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
      icon: <Award className="w-3 h-3" />,
    };
  return {
    label: "عادی",
    color: "bg-muted text-muted-foreground border-border",
    icon: <Users className="w-3 h-3" />,
  };
}

// ============== Main Module ==============
export function CustomersModule() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [birthdays, setBirthdays] = React.useState<BirthdayCustomer[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("createdAt");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Dialogs
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [selected, setSelected] = React.useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Customer | null>(null);

  // Debounce search
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
        order: "desc",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setCustomers(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || null);
      setBirthdays(data.birthdaysThisMonth || []);
    } catch (e: any) {
      toast.error(e.message || "خطا در بارگذاری مشتریان");
    } finally {
      setLoading(false);
    }
  }, [page, sort, search]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Reset page on search/sort change
  React.useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 350);
  };

  const openDetail = async (c: Customer) => {
    setDetailOpen(true);
    setSelected(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/customers/${c.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setSelected(data);
    } catch (e: any) {
      toast.error(e.message || "خطا در بارگذاری جزئیات");
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setFormOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در حذف");
      toast.success("مشتری حذف شد");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "خطا در حذف مشتری");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            مدیریت مشتریان
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مدیریت اطلاعات مشتریان، امتیازات وفاداری و تاریخچه خرید
          </p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
          <UserPlus className="w-4 h-4" />
          افزودن مشتری
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="تعداد مشتریان"
          value={stats ? toPersianDigits(stats.count) : "—"}
          icon={<Users className="w-5 h-5" />}
          accent="amber"
        />
        <StatCard
          title="مجموع خریدها"
          value={stats ? formatToman(stats.totalSpent) : "—"}
          icon={<Wallet className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          title="میانگین خرید"
          value={stats ? formatToman(stats.avgSpent) : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="purple"
        />
        <StatCard
          title="امتیازات اهدایی"
          value={stats ? toPersianDigits(formatNumber(stats.totalLoyalty)) : "—"}
          icon={<Award className="w-5 h-5" />}
          accent="rose"
        />
      </div>

      {/* Birthdays widget */}
      {birthdays.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              تولدهای این ماه
              <Badge variant="secondary" className="text-xs">
                {toPersianDigits(birthdays.length)} نفر
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              مشتریانی که در این ماه تولد دارند - فرصت خوبی برای ارسال تبریک و پیشنهاد ویژه
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {birthdays.map((b) => {
                  const day = b.birthday
                    ? toPersianDigits(new Date(b.birthday).getDate())
                    : "—";
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border border-amber-100 dark:border-amber-900/50 hover:border-amber-300 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          {day}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.phone ? toPersianDigits(b.phone) : "بدون تلفن"}
                        </p>
                      </div>
                      {b.phone && (
                        <a
                          href={buildWhatsAppUrl(b.phone) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="ارسال تبریک در واتساپ"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Search + Sort */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام، تلفن یا ایمیل..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-9"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="مرتب‌سازی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">جدیدترین</SelectItem>
                <SelectItem value="totalSpent">بیشترین خرید</SelectItem>
                <SelectItem value="loyaltyPoints">بیشترین امتیاز</SelectItem>
                <SelectItem value="totalOrders">بیشترین سفارش</SelectItem>
                <SelectItem value="name">نام (الفبا)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            فهرست مشتریان
            <Badge variant="secondary" className="text-xs">
              {toPersianDigits(total)} نفر
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="pr-4">نام</TableHead>
                  <TableHead>تلفن</TableHead>
                  <TableHead className="hidden md:table-cell">ایمیل</TableHead>
                  <TableHead>مجموع خرید</TableHead>
                  <TableHead className="hidden sm:table-cell">سفارش</TableHead>
                  <TableHead>امتیاز</TableHead>
                  <TableHead className="hidden lg:table-cell">آخرین خرید</TableHead>
                  <TableHead className="text-left pl-4">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">هیچ مشتری‌ای یافت نشد</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => {
                    const tier = getLoyaltyTier(c.loyaltyPoints);
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-amber-50/60 dark:hover:bg-amber-950/20"
                        onClick={() => openDetail(c)}
                      >
                        <TableCell className="pr-4 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <span className="truncate max-w-[10rem]">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm" onClick={(e) => e.stopPropagation()}>
                          {c.phone ? (
                            <span dir="ltr">{toPersianDigits(c.phone)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {c.email ? (
                            <span dir="ltr" className="truncate inline-block max-w-[12rem]">{c.email}</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {formatToman(c.totalSpent)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {toPersianDigits(c.totalOrders)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${tier.color}`}
                            title={`امتیاز: ${toPersianDigits(c.loyaltyPoints)}`}
                          >
                            {tier.icon}
                            {tier.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {c.lastVisit
                            ? formatRelativeTime(c.lastVisit)
                            : formatRelativeTime(c.createdAt)}
                        </TableCell>
                        <TableCell
                          className="text-left pl-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDetail(c)}
                              title="مشاهده"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(c)}
                              title="ویرایش"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(c)}
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                نمایش{" "}
                {toPersianDigits((page - 1) * PAGE_SIZE + 1)} تا{" "}
                {toPersianDigits(Math.min(page * PAGE_SIZE, total))} از{" "}
                {toPersianDigits(total)} مشتری
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </Button>
                <span className="text-sm px-2">
                  {toPersianDigits(page)} / {toPersianDigits(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              جزئیات مشتری
            </DialogTitle>
            <DialogDescription>
              اطلاعات کامل، تاریخچه خرید و عملیات مشتری
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : selected ? (
            <div className="overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-4">
              {/* Profile */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                <div className="w-14 h-14 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-900 dark:text-amber-100 text-xl font-bold shrink-0">
                  {selected.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{selected.name}</h3>
                    {(() => {
                      const tier = getLoyaltyTier(selected.loyaltyPoints);
                      return (
                        <Badge variant="outline" className={`gap-1 ${tier.color}`}>
                          {tier.icon}
                          مشتری {tier.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                    <InfoLine
                      icon={<Phone className="w-3.5 h-3.5" />}
                      label="تلفن"
                      value={selected.phone ? toPersianDigits(selected.phone) : "—"}
                      ltr
                    />
                    <InfoLine
                      icon={<Mail className="w-3.5 h-3.5" />}
                      label="ایمیل"
                      value={selected.email || "—"}
                      ltr
                    />
                    <InfoLine
                      icon={<Calendar className="w-3.5 h-3.5" />}
                      label="تولد"
                      value={
                        selected.birthday
                          ? formatPersianDate(selected.birthday)
                          : "—"
                      }
                    />
                    <InfoLine
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      label="کد ملی"
                      value={
                        selected.nationalId
                          ? toPersianDigits(selected.nationalId)
                          : "—"
                      }
                      ltr
                    />
                  </div>
                  {selected.address && (
                    <div className="flex items-start gap-1.5 mt-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{selected.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniStat
                  label="مجموع خرید"
                  value={formatToman(selected.stats.totalSpent)}
                  icon={<Wallet className="w-4 h-4" />}
                />
                <MiniStat
                  label="تعداد سفارش"
                  value={toPersianDigits(selected.stats.totalOrders)}
                  icon={<ShoppingBag className="w-4 h-4" />}
                />
                <MiniStat
                  label="امتیاز وفاداری"
                  value={toPersianDigits(selected.stats.loyaltyPoints)}
                  icon={<Award className="w-4 h-4" />}
                />
                <MiniStat
                  label="میانگین خرید"
                  value={formatToman(selected.stats.avgOrder)}
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </div>

              {/* Birthday countdown */}
              {selected.stats.daysToBirthday !== null && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900 text-sm">
                  <Gift className="w-4 h-4 text-pink-500 shrink-0" />
                  {selected.stats.daysToBirthday === 0 ? (
                    <span className="text-pink-700 dark:text-pink-300 font-medium">
                      🎉 امروز تولد این مشتری است!
                    </span>
                  ) : (
                    <span className="text-pink-700 dark:text-pink-300">
                      {toPersianDigits(selected.stats.daysToBirthday)} روز تا تولد
                      بعدی
                    </span>
                  )}
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <StickyNote className="w-3 h-3" />
                    یادداشت
                  </p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}

              {/* Last visit */}
              {selected.stats.lastVisit && (
                <p className="text-xs text-muted-foreground">
                  آخرین مراجعه:{" "}
                  {formatPersianDateTime(selected.stats.lastVisit)}
                </p>
              )}

              {/* Purchase history */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  تاریخچه خرید
                  <Badge variant="secondary" className="text-xs">
                    {toPersianDigits(selected.sales.length)} از{" "}
                    {toPersianDigits(selected.stats.totalOrders)}
                  </Badge>
                </h4>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {selected.sales.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        خریدی ثبت نشده است
                      </p>
                    ) : (
                      selected.sales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-md bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium" dir="ltr">
                                {sale.invoiceNumber}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {PAYMENT_LABELS[sale.paymentMethod] ||
                                  sale.paymentMethod}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {toPersianDigits(sale.items.length)} اقلام
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatPersianDate(sale.createdAt)} ·{" "}
                              {formatRelativeTime(sale.createdAt)}
                            </p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-sm font-semibold">
                              {formatToman(sale.total)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : null}

          {/* Footer actions */}
          {selected && (
            <DialogFooter className="gap-2 border-t pt-4">
              {selected.phone && (
                <Button
                  variant="outline"
                  className="mr-auto text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950/30"
                  asChild
                >
                  <a
                    href={buildWhatsAppUrl(selected.phone) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    واتساپ
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => openEdit(selected)}
              >
                <Pencil className="w-4 h-4" />
                ویرایش
              </Button>
              <DialogClose asChild>
                <Button variant="ghost">بستن</Button>
              </DialogClose>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Form Dialog */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مشتری</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف مشتری «{deleteTarget?.name}» مطمئن هستید؟ این عمل قابل
              بازگشت نیست. در صورت وجود سفارش ثبت‌شده برای این مشتری، امکان حذف
              وجود ندارد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============== Sub-components ==============

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: "amber" | "green" | "purple" | "rose";
}) {
  const accentColors: Record<string, string> = {
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
    rose: "bg-rose-100 dark:bg-rose-950/40 text-rose-600",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentColors[accent]}`}
          >
            {icon}
          </div>
        </div>
        <p className="text-lg font-bold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-2.5 rounded-lg border bg-card">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  ltr,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span
        className={`text-xs font-medium truncate ${ltr ? "dir-ltr" : ""}`}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ============== Customer Form Dialog ==============
function CustomerFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Customer | null;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Reset form on open
  React.useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name || "");
        setPhone(editing.phone || "");
        setEmail(editing.email || "");
        setAddress(editing.address || "");
        setBirthday(
          editing.birthday
            ? new Date(editing.birthday).toISOString().slice(0, 10)
            : ""
        );
        setNationalId(editing.nationalId || "");
        setNotes(editing.notes || "");
      } else {
        setName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setBirthday("");
        setNationalId("");
        setNotes("");
      }
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام مشتری الزامی است");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        birthday: birthday || null,
        nationalId: nationalId.trim() || null,
        notes: notes.trim() || null,
      };

      const url = editing
        ? `/api/customers/${editing.id}`
        : "/api/customers";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ذخیره");

      toast.success(editing ? "مشتری به‌روزرسانی شد" : "مشتری با موفقیت ایجاد شد");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره مشتری");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? (
              <>
                <Pencil className="w-5 h-5 text-amber-500" />
                ویرایش مشتری
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-amber-500" />
                افزودن مشتری جدید
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "اطلاعات مشتری را به‌روزرسانی کنید"
              : "اطلاعات مشتری جدید را وارد کنید"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                نام <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">تلفن</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationalId">کد ملی</Label>
              <Input
                id="nationalId"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="کد ملی"
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthday">تاریخ تولد</Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">آدرس</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="آدرس کامل"
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">یادداشت</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="یادداشت‌های داخلی درباره مشتری"
              className="min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={submitting}>
                انصراف
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editing ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {editing ? "ذخیره تغییرات" : "ایجاد مشتری"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
