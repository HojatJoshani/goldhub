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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Shield,
  ScrollText,
  Settings,
  Lock,
  Key,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Check,
  X,
  Crown,
  UserCog,
  Store,
  Wallet,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  Activity,
  Filter,
  Globe,
} from "lucide-react";
import {
  formatPersianDate,
  formatPersianDateTime,
  toPersianDigits,
  roleLabel,
  statusLabel,
} from "@/lib/persian";

// ============== Types ==============
interface BranchLite {
  id: string;
  name: string;
  code: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
  branchId: string | null;
  branch: BranchLite | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | string;
  ip: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    actions: string[];
    entities: string[];
  };
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: {
    taxRate?: number;
    currency?: string;
    autoUpdateGoldPrice?: boolean;
    [k: string]: unknown;
  };
  updatedAt: string;
}

// ============== Static permission matrix ==============
const MODULES = [
  "داشبورد",
  "انبار",
  "POS",
  "مشتریان",
  "سفارشات",
  "شعبات",
  "حسابداری",
  "گزارشات",
  "هوش مصنوعی",
  "مدیریت سیستم",
] as const;

type ModuleKey = (typeof MODULES)[number];

const ROLE_ORDER = [
  "super_admin",
  "admin",
  "manager",
  "cashier",
  "staff",
] as const;

// Static permission map: true = allowed, false = denied, "partial" = view-only
const PERMISSIONS: Record<
  string,
  Partial<Record<ModuleKey, boolean | "partial">>
> = {
  super_admin: {
    "داشبورد": true,
    "انبار": true,
    "POS": true,
    "مشتریان": true,
    "سفارشات": true,
    "شعبات": true,
    "حسابداری": true,
    "گزارشات": true,
    "هوش مصنوعی": true,
    "مدیریت سیستم": true,
  },
  admin: {
    "داشبورد": true,
    "انبار": true,
    "POS": true,
    "مشتریان": true,
    "سفارشات": true,
    "شعبات": true,
    "حسابداری": true,
    "گزارشات": true,
    "هوش مصنوعی": true,
    "مدیریت سیستم": "partial",
  },
  manager: {
    "داشبورد": true,
    "انبار": true,
    "POS": true,
    "مشتریان": true,
    "سفارشات": true,
    "شعبات": "partial",
    "حسابداری": "partial",
    "گزارشات": true,
    "هوش مصنوعی": true,
    "مدیریت سیستم": false,
  },
  cashier: {
    "داشبورد": "partial",
    "انبار": "partial",
    "POS": true,
    "مشتریان": true,
    "سفارشات": "partial",
    "شعبات": false,
    "حسابداری": false,
    "گزارشات": false,
    "هوش مصنوعی": false,
    "مدیریت سیستم": false,
  },
  staff: {
    "داشبورد": "partial",
    "انبار": "partial",
    "POS": false,
    "مشتریان": "partial",
    "سفارشات": "partial",
    "شعبات": false,
    "حسابداری": false,
    "گزارشات": false,
    "هوش مصنوعی": false,
    "مدیریت سیستم": false,
  },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin:
    "دسترسی کامل به همه بخش‌های سیستم شامل مدیریت کاربران، تنظیمات سازمان و مشاهده همه گزارش‌ها.",
  admin:
    "مدیر ارشد سازمان. دسترسی کامل به عملیات روزمره، فروش، انبار و گزارش‌ها. دیدن محدود بخش مدیریت سیستم.",
  manager:
    "مدیر شعبه. مدیریت روزمره یک شعبه شامل فروش، انبار، مشتریان و گزارش‌های شعبه. بدون دسترسی به مدیریت سیستم.",
  cashier:
    "صندوق‌دار. ثبت فروش و مدیریت مشتریان. دسترسی محدود به داشبورد و سفارشات. بدون دسترسی به حسابداری و گزارش‌ها.",
  staff:
    "کارمند. دسترسی محدود مشاهده‌ای به داشبورد، انبار و مشتریان. مناسب کارمندان پشتیبانی.",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  super_admin:
    "border-amber-300/60 bg-gradient-to-l from-amber-400 to-yellow-500 text-amber-950",
  admin: "border-amber-200/60 bg-amber-100 text-amber-800",
  manager:
    "border-emerald-200/60 bg-emerald-100 text-emerald-800",
  cashier:
    "border-slate-200/60 bg-slate-100 text-slate-700",
  staff: "border-zinc-200/60 bg-zinc-100 text-zinc-600",
};

const ACTION_LABELS: Record<string, string> = {
  login: "ورود",
  logout: "خروج",
  create: "ایجاد",
  update: "ویرایش",
  delete: "حذف",
};

const ACTION_BADGE_CLASS: Record<string, string> = {
  login: "border-emerald-200/60 bg-emerald-100 text-emerald-800",
  logout: "border-zinc-200/60 bg-zinc-100 text-zinc-700",
  create: "border-amber-200/60 bg-amber-100 text-amber-800",
  update: "border-blue-200/60 bg-blue-50 text-blue-700",
  delete: "border-rose-200/60 bg-rose-100 text-rose-700",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "مبتدی",
  pro: "حرفه‌ای",
  enterprise: "سازمانی",
};

const ROLE_SELECT_ITEMS = ROLE_ORDER.map((r) => ({
  value: r,
  label: roleLabel(r),
}));

// ============== Main module ==============
export function AdminModule() {
  const [tab, setTab] = React.useState("users");

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted/60 h-auto p-1 flex flex-wrap gap-1">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="size-4" />
            کاربران
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <Shield className="size-4" />
            نقش‌ها و دسترسی‌ها
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="size-4" />
            لاگ‌های ممیزی
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-4" />
            تنظیمات سیستم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RolesTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditLogsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModuleHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-amber-950 shadow-sm">
            <Shield className="size-5" />
          </span>
          مدیریت سیستم
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          مدیریت کاربران، نقش‌ها، لاگ‌های ممیزی و تنظیمات سازمان
        </p>
      </div>
    </div>
  );
}

// ============== Users Tab ==============
function UsersTab() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در دریافت کاربران");
      }
      const data: UsersResponse = await res.json();
      setUsers(data.items);
      setTotal(data.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 350);
    return () => clearTimeout(t);
  }, [search, roleFilter, statusFilter, page, load]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setDialogOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در غیرفعال‌سازی کاربر");
      }
      toast.success(`کاربر «${deleteTarget.name}» غیرفعال شد`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطای ناشناخته");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="size-4 text-amber-500" />
                کاربران سیستم
              </CardTitle>
              <CardDescription>
                مجموع {toPersianDigits(total)} کاربر ثبت‌شده
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950"
            >
              <Plus className="size-4" />
              افزودن کاربر
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="جستجو بر اساس نام، ایمیل یا تلفن..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="همه نقش‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه نقش‌ها</SelectItem>
                {ROLE_SELECT_ITEMS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-36">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} title="به‌روزرسانی">
              <RefreshCw className="size-4" />
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="max-h-[60vh] overflow-auto custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-right">نام</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      ایمیل
                    </TableHead>
                    <TableHead className="text-right">نقش</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">
                      شعبه
                    </TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      آخرین ورود
                    </TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-10"
                      >
                        <User className="size-8 mx-auto mb-2 opacity-40" />
                        کاربری یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow
                        key={u.id}
                        className={u.status === "inactive" ? "opacity-60" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={u.name} />
                            <div className="min-w-0">
                              <div className="font-medium truncate max-w-[160px]">
                                {u.name}
                              </div>
                              <div className="text-xs text-muted-foreground md:hidden truncate max-w-[160px]">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          <span className="font-mono">{u.email}</span>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {u.branch ? (
                            <span className="inline-flex items-center gap-1 text-sm">
                              <Store className="size-3.5 text-muted-foreground" />
                              {u.branch.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {u.lastLoginAt
                            ? formatPersianDate(u.lastLoginAt)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => {
                                setEditing(u);
                                setDialogOpen(true);
                              }}
                              title="ویرایش"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setDeleteTarget(u)}
                              title="غیرفعال‌سازی"
                            >
                              <Trash2 className="size-4" />
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

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-muted-foreground">
                نمایش{" "}
                {toPersianDigits((page - 1) * pageSize + 1)} تا{" "}
                {toPersianDigits(Math.min(page * pageSize, total))} از{" "}
                {toPersianDigits(total)} کاربر
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="size-4" />
                  قبلی
                </Button>
                <span className="px-2 font-medium">
                  {toPersianDigits(page)} / {toPersianDigits(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  بعدی
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>غیرفعال‌سازی کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از غیرفعال‌سازی کاربر «{deleteTarget?.name}» مطمئن هستید؟
              کاربر دیگر قادر به ورود به سیستم نخواهد بود. این کار قابل بازگشت
              است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              غیرفعال‌سازی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============== User form dialog ==============
interface UserFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  branchId: string;
  status: string;
}

function UserFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AdminUser | null;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<UserFormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    branchId: "",
    status: "active",
  });
  const [branches, setBranches] = React.useState<BranchLite[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name,
          email: editing.email,
          phone: editing.phone || "",
          password: "",
          role: editing.role,
          branchId: editing.branchId || "",
          status: editing.status,
        });
      } else {
        setForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          role: "staff",
          branchId: "",
          status: "active",
        });
      }
    }
  }, [open, editing]);

  React.useEffect(() => {
    if (open) {
      fetch("/api/branches")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setBranches(d.items || []))
        .catch(() => setBranches([]));
    }
  }, [open]);

  const update = <K extends keyof UserFormState>(
    k: K,
    v: UserFormState[K]
  ) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("نام کاربر الزامی است");
      return;
    }
    if (!form.email.trim()) {
      toast.error("ایمیل الزامی است");
      return;
    }
    if (!editing && form.password.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
      };
      if (form.branchId) {
        body.branchId = form.branchId;
      } else {
        body.branchId = "";
      }
      if (form.password) {
        body.password = form.password;
      }

      const url = editing
        ? `/api/admin/users/${editing.id}`
        : "/api/admin/users";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در ذخیره کاربر");
      }
      toast.success(
        editing ? "کاربر با موفقیت به‌روزرسانی شد" : "کاربر جدید ایجاد شد"
      );
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? (
              <>
                <Pencil className="size-5 text-amber-500" />
                ویرایش کاربر
              </>
            ) : (
              <>
                <UserPlusIcon />
                افزودن کاربر جدید
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "اطلاعات کاربر را ویرایش کنید. رمز عبور در صورت خالی ماندن تغییر نمی‌کند."
              : "اطلاعات کاربر جدید را وارد کنید."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="uf-name">
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="uf-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="مثلاً: علی رضایی"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-email">
              ایمیل <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="uf-email"
              type="email"
              dir="ltr"
              className="text-left font-mono"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="user@goldhub.ir"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-phone">شماره تلفن</Label>
            <Input
              id="uf-phone"
              dir="ltr"
              className="text-left font-mono"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="0912xxxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-password">
              رمز عبور{" "}
              {!editing && <span className="text-rose-500">*</span>}
              {editing && (
                <span className="text-xs text-muted-foreground mr-1">
                  (اختیاری)
                </span>
              )}
            </Label>
            <Input
              id="uf-password"
              type="password"
              dir="ltr"
              className="text-left font-mono"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={editing ? "••••••" : "حداقل ۶ کاراکتر"}
            />
          </div>
          <div className="space-y-2">
            <Label>نقش</Label>
            <Select
              value={form.role}
              onValueChange={(v) => update("role", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نقش" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_SELECT_ITEMS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>شعبه</Label>
            <Select
              value={form.branchId || "__none__"}
              onValueChange={(v) =>
                update("branchId", v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="بدون شعبه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">بدون شعبه</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>وضعیت</Label>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="uf-status"
                checked={form.status === "active"}
                onCheckedChange={(c) =>
                  update("status", c ? "active" : "inactive")
                }
              />
              <Label htmlFor="uf-status" className="cursor-pointer">
                {form.status === "active" ? (
                  <span className="text-emerald-700">فعال</span>
                ) : (
                  <span className="text-muted-foreground">غیرفعال</span>
                )}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>
              انصراف
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserPlusIcon() {
  return (
    <span className="inline-flex size-5 items-center justify-center">
      <UserCog className="size-5 text-amber-500" />
    </span>
  );
}

// ============== Roles & Permissions Tab ==============
function RolesTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4 text-amber-500" />
            ماتریس نقش‌ها و دسترسی‌ها
          </CardTitle>
          <CardDescription>
            نمای کلی سطح دسترسی هر نقش به ماژول‌های سیستم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Permission matrix */}
          <div className="rounded-md border overflow-auto custom-scrollbar max-h-[70vh]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow>
                  <TableHead className="text-right min-w-[140px] bg-muted/95">
                    نقش
                  </TableHead>
                  {MODULES.map((m) => (
                    <TableHead
                      key={m}
                      className="text-center min-w-[110px] bg-muted/95"
                    >
                      {m}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLE_ORDER.map((role) => {
                  const perms = PERMISSIONS[role] || {};
                  return (
                    <TableRow key={role}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <RoleIcon role={role} />
                          <div>
                            <div>{roleLabel(role)}</div>
                            <div className="text-xs text-muted-foreground font-normal">
                              {role}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {MODULES.map((m) => {
                        const v = perms[m];
                        return (
                          <TableCell key={m} className="text-center p-2">
                            <PermissionCell value={v} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex size-5 items-center justify-center rounded bg-emerald-100 text-emerald-700">
                <Check className="size-3.5" />
              </span>
              دسترسی کامل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex size-5 items-center justify-center rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                ن
              </span>
              فقط مشاهده
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex size-5 items-center justify-center rounded bg-rose-50 text-rose-500">
                <X className="size-3.5" />
              </span>
              بدون دسترسی
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Role descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLE_ORDER.map((role) => (
          <Card key={role} className="overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-l from-amber-50/50 to-transparent dark:from-amber-950/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <RoleIcon role={role} />
                  {roleLabel(role)}
                </CardTitle>
                <RoleBadge role={role} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PermissionCell({
  value,
}: {
  value: boolean | "partial" | undefined;
}) {
  if (value === true) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
        <Check className="size-4" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
        ن
      </span>
    );
  }
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-md bg-rose-50 text-rose-400">
      <X className="size-4" />
    </span>
  );
}

function RoleIcon({ role }: { role: string }) {
  const cls = "size-4";
  switch (role) {
    case "super_admin":
      return <Crown className={`${cls} text-amber-600`} />;
    case "admin":
      return <UserCog className={`${cls} text-amber-500`} />;
    case "manager":
      return <Store className={`${cls} text-emerald-600`} />;
    case "cashier":
      return <Wallet className={`${cls} text-slate-500`} />;
    default:
      return <User className={`${cls} text-zinc-500`} />;
  }
}

// ============== Audit Logs Tab ==============
function AuditLogsTab() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(25);
  const [loading, setLoading] = React.useState(true);
  const [actions, setActions] = React.useState<string[]>([]);
  const [entities, setEntities] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState({
    action: "all",
    entity: "all",
    from: "",
    to: "",
  });
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (filters.action !== "all") params.set("action", filters.action);
      if (filters.entity !== "all") params.set("entity", filters.entity);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const res = await fetch(
        `/api/admin/audit-logs?${params.toString()}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در دریافت لاگ‌ها");
      }
      const data: AuditLogsResponse = await res.json();
      setLogs(data.items);
      setTotal(data.total);
      setActions(data.filters.actions);
      setEntities(data.filters.entities);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  React.useEffect(() => {
    if (page !== 1) setPage(1);
    else load();
  }, [filters, page, load]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="size-4 text-amber-500" />
              لاگ‌های ممیزی
            </CardTitle>
            <CardDescription>
              مجموع {toPersianDigits(total)} رویداد ثبت‌شده
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" />
            به‌روزرسانی
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <Select
            value={filters.action}
            onValueChange={(v) => setFilters((f) => ({ ...f, action: v }))}
          >
            <SelectTrigger className="md:w-40">
              <Filter className="size-3.5 ml-1" />
              <SelectValue placeholder="همه اقدامات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه اقدامات</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_LABELS[a] || a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.entity}
            onValueChange={(v) => setFilters((f) => ({ ...f, entity: v }))}
          >
            <SelectTrigger className="md:w-40">
              <Filter className="size-3.5 ml-1" />
              <SelectValue placeholder="همه موجودیت‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه موجودیت‌ها</SelectItem>
              {entities.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              از:
            </Label>
            <Input
              type="date"
              dir="ltr"
              className="text-left w-40"
              value={filters.from}
              onChange={(e) =>
                setFilters((f) => ({ ...f, from: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              تا:
            </Label>
            <Input
              type="date"
              dir="ltr"
              className="text-left w-40"
              value={filters.to}
              onChange={(e) =>
                setFilters((f) => ({ ...f, to: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Logs table */}
        <div className="rounded-md border overflow-hidden">
          <div className="max-h-[60vh] overflow-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow>
                  <TableHead className="text-right min-w-[160px]">
                    زمان
                  </TableHead>
                  <TableHead className="text-right">کاربر</TableHead>
                  <TableHead className="text-right">اقدام</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    موجودیت
                  </TableHead>
                  <TableHead className="text-right">جزئیات</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">
                    IP
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      <ScrollText className="size-8 mx-auto mb-2 opacity-40" />
                      لاگ ممیزی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isOpen = expanded === log.id;
                    const detailsObj =
                      typeof log.details === "string"
                        ? safeParse(log.details)
                        : log.details;
                    return (
                      <React.Fragment key={log.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpanded(isOpen ? null : log.id)
                          }
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatPersianDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <UserAvatar name={log.user.name} />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate max-w-[120px]">
                                    {log.user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {roleLabel(log.user.role)}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                سیستم
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ActionBadge action={log.action} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            <span className="font-mono">{log.entity}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(isOpen ? null : log.id);
                              }}
                            >
                              {isOpen ? "بستن" : "مشاهده"}
                            </Button>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">
                            {log.ip || "—"}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={6} className="py-3">
                              <pre
                                dir="ltr"
                                className="text-left text-xs bg-background border rounded-md p-3 overflow-auto custom-scrollbar max-h-48 font-mono"
                              >
                                {JSON.stringify(detailsObj, null, 2)}
                              </pre>
                              {log.entityId && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  شناسه:{" "}
                                  <span className="font-mono">
                                    {log.entityId}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="text-muted-foreground">
              نمایش {toPersianDigits((page - 1) * pageSize + 1)} تا{" "}
              {toPersianDigits(Math.min(page * pageSize, total))} از{" "}
              {toPersianDigits(total)} رویداد
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronRight className="size-4" />
                قبلی
              </Button>
              <span className="px-2 font-medium">
                {toPersianDigits(page)} / {toPersianDigits(totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                بعدی
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============== Settings Tab ==============
function SettingsTab() {
  const [tenant, setTenant] = React.useState<TenantInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("");
  const [currency, setCurrency] = React.useState("IRR");
  const [autoGold, setAutoGold] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenant");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در دریافت تنظیمات");
      }
      const data: TenantInfo = await res.json();
      setTenant(data);
      setName(data.name);
      setTaxRate(
        data.settings.taxRate !== undefined
          ? String(data.settings.taxRate)
          : "0"
      );
      setCurrency(data.settings.currency || "IRR");
      setAutoGold(Boolean(data.settings.autoUpdateGoldPrice));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const trNum = Number(taxRate);
      const taxRateValue = isNaN(trNum) || trNum < 0 ? 0 : trNum;
      const res = await fetch("/api/admin/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          settings: {
            taxRate: taxRateValue,
            currency,
            autoUpdateGoldPrice: autoGold,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در ذخیره تنظیمات");
      }
      const updated: TenantInfo = await res.json();
      setTenant(updated);
      toast.success("تنظیمات با موفقیت ذخیره شد");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tenant info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4 text-amber-500" />
            اطلاعات سازمان
          </CardTitle>
          <CardDescription>
            مشخصات کلی سازمان و پلان اشتراک
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoTile
              label="نام سازمان"
              value={tenant?.name || "—"}
              icon={<Globe className="size-4" />}
            />
            <InfoTile
              label="شناسه"
              value={tenant?.slug || "—"}
              mono
              icon={<Key className="size-4" />}
            />
            <InfoTile
              label="پلان"
              value={tenant ? PLAN_LABELS[tenant.plan] || tenant.plan : "—"}
              badge
              icon={<Crown className="size-4" />}
            />
            <InfoTile
              label="وضعیت"
              value={tenant ? statusLabel(tenant.status) : "—"}
              icon={<Activity className="size-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4 text-amber-500" />
            تنظیمات سیستم
          </CardTitle>
          <CardDescription>
            پیکربندی مالی و قیمت‌گذاری سازمان
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="st-name">نام سازمان</Label>
              <Input
                id="st-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام سازمان"
              />
              <p className="text-xs text-muted-foreground">
                این نام در فاکتورها و گزارش‌ها نمایش داده می‌شود.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="st-tax">نرخ مالیات (٪)</Label>
              <Input
                id="st-tax"
                inputMode="decimal"
                dir="ltr"
                className="text-left font-mono"
                value={taxRate}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, "");
                  setTaxRate(v);
                }}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                درصد مالیات بر ارزش افزوده اعمال‌شده روی فاکتورها.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="st-currency">واحد پول</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="st-currency">
                  <SelectValue placeholder="واحد پول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IRR">ریال (IRR)</SelectItem>
                  <SelectItem value="IRT">تومان (IRT)</SelectItem>
                  <SelectItem value="USD">دلار (USD)</SelectItem>
                  <SelectItem value="EUR">یورو (EUR)</SelectItem>
                  <SelectItem value="AED">درهم (AED)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                واحد پول پیش‌فرض برای نمایش مبالغ.
              </p>
            </div>

            <div className="space-y-2">
              <Label>به‌روزرسانی خودکار قیمت طلا</Label>
              <div className="flex items-center justify-between rounded-md border p-3 h-[42px]">
                <div className="flex items-center gap-2 text-sm">
                  <Activity
                    className={`size-4 ${
                      autoGold ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  />
                  <span>
                    {autoGold ? "فعال" : "غیرفعال"}
                  </span>
                </div>
                <Switch checked={autoGold} onCheckedChange={setAutoGold} />
              </div>
              <p className="text-xs text-muted-foreground">
                در صورت فعال‌سازی، قیمت طلا به‌صورت خودکار از منبع خارجی به‌روز
                می‌شود.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={save}
              disabled={saving || !name.trim()}
              className="bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              ذخیره تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== Reusable UI helpers ==============
function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className={ROLE_BADGE_CLASS[role] || "border-zinc-200 bg-zinc-100 text-zinc-600"}
    >
      {roleLabel(role)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "border-emerald-200/60 bg-emerald-100 text-emerald-800"
          : "border-zinc-200/60 bg-zinc-100 text-zinc-600"
      }
    >
      <span
        className={`size-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />
      {statusLabel(status)}
    </Badge>
  );
}

function ActionBadge({ action }: { action: string }) {
  return (
    <Badge
      variant="outline"
      className={
        ACTION_BADGE_CLASS[action] || "border-zinc-200 bg-zinc-100 text-zinc-700"
      }
    >
      {ACTION_LABELS[action] || action}
    </Badge>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "؟";
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-amber-950 text-sm font-bold shadow-sm shrink-0">
      {initial}
    </span>
  );
}

function InfoTile({
  label,
  value,
  icon,
  mono,
  badge,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      {badge ? (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-800 border-amber-200/60"
        >
          {value}
        </Badge>
      ) : (
        <div
          className={`font-semibold truncate ${mono ? "font-mono text-sm" : ""}`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

function safeParse(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === "object") return input as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(input));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : { raw: input };
  } catch {
    return { raw: input };
  }
}
