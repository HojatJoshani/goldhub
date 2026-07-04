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
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Hammer,
  Wrench,
  Clock,
  CheckCircle,
  Plus,
  Search,
  PencilRuler,
  Sparkles,
  PackageCheck,
  Gift,
  Ban,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Weight,
  Gem,
  Wallet,
  Coins,
  ArrowLeft,
  Trash2,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  UserCog,
  Loader2,
  PartyPopper,
  RotateCcw,
} from "lucide-react";
import {
  formatToman,
  formatNumber,
  formatWeight,
  toPersianDigits,
  formatPersianDate,
  formatPersianDateTime,
  formatRelativeTime,
  karatLabel,
  KARAT_LABELS,
} from "@/lib/persian";

// ===================== Types =====================

interface CustomerRef {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface StaffRef {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface TimelineEntry {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  product?: { id: string; name: string; sku: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  goldWeight: number;
  karat: string;
  makingCharge: number;
  stoneCost: number;
  estimatedCost: number;
  finalCost: number;
  assignedToId: string | null;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerRef | null;
  assignedTo?: StaffRef | null;
}

interface OrderDetail extends Order {
  items: OrderItem[];
  timeline: TimelineEntry[];
}

interface OrdersStats {
  inProgress: number;
  delivered: number;
  repairs: number;
  cancelled: number;
  avgDeliveryDays: number;
}

interface ListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  stats: OrdersStats;
}

// ===================== Constants =====================

const TYPE_LABELS: Record<string, string> = {
  custom: "سفارشی",
  repair: "تعمیر",
  manufacturing: "ساخت",
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  custom: ClipboardList,
  repair: Wrench,
  manufacturing: Hammer,
};

const STATUS_FLOW: string[] = [
  "pending",
  "design",
  "manufacturing",
  "polishing",
  "ready",
  "delivered",
];

const STATUS_LABEL_OVERRIDE: Record<string, string> = {
  pending: "در انتظار",
  design: "طراحی",
  manufacturing: "در حال ساخت",
  polishing: "پرداخت",
  ready: "آماده تحویل",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

function statusText(status: string): string {
  return (
    STATUS_LABEL_OVERRIDE[status] ||
    status
  );
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  custom:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  repair:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300 dark:border-orange-800",
  manufacturing:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-300 dark:border-violet-800",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
  design:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-300 dark:border-violet-800",
  manufacturing:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  polishing:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800",
  ready:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-300 dark:border-green-800",
  cancelled:
    "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800",
};

interface StageConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "zinc" | "violet" | "amber" | "cyan" | "emerald" | "green";
}

const STAGE_CONFIG: Record<string, StageConfig> = {
  pending: {
    label: "ثبت سفارش",
    description: "سفارش در سیستم ثبت شد",
    icon: ClipboardList,
    color: "zinc",
  },
  design: {
    label: "طراحی",
    description: "طرح اولیه و تایید مشتری",
    icon: PencilRuler,
    color: "violet",
  },
  manufacturing: {
    label: "ساخت و قالب‌گیری",
    description: "ذوب، ریخته‌گری و شکل‌دهی",
    icon: Hammer,
    color: "amber",
  },
  polishing: {
    label: "پرداخت و صیقل",
    description: "صیقل‌کاری و تنظیم نهایی",
    icon: Sparkles,
    color: "cyan",
  },
  ready: {
    label: "آماده تحویل",
    description: "آماده برای تحویل به مشتری",
    icon: PackageCheck,
    color: "emerald",
  },
  delivered: {
    label: "تحویل به مشتری",
    description: "سفارش به مشتری تحویل داده شد",
    icon: Gift,
    color: "green",
  },
};

// Tailwind color tokens per stage — using amber-accented palette
const STAGE_COLOR_TOKENS: Record<
  string,
  {
    completed: string; // circle bg
    completedIcon: string; // icon color inside completed circle
    current: string; // current ring
    upcoming: string; // upcoming circle bg
    line: string; // connecting line color when completed
    lineUpcoming: string; // connecting line color when upcoming
    text: string; // text color when completed
    textUpcoming: string; // text color when upcoming
  }
> = {
  zinc: {
    completed: "bg-zinc-700 dark:bg-zinc-300",
    completedIcon: "text-white dark:text-zinc-900",
    current: "ring-zinc-500",
    upcoming: "bg-zinc-100 dark:bg-zinc-800",
    line: "bg-zinc-400 dark:bg-zinc-600",
    lineUpcoming: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-zinc-900 dark:text-zinc-100",
    textUpcoming: "text-zinc-400 dark:text-zinc-500",
  },
  violet: {
    completed: "bg-violet-600 dark:bg-violet-400",
    completedIcon: "text-white dark:text-violet-950",
    current: "ring-violet-500",
    upcoming: "bg-violet-100 dark:bg-violet-950/40",
    line: "bg-violet-400 dark:bg-violet-700",
    lineUpcoming: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-violet-900 dark:text-violet-200",
    textUpcoming: "text-zinc-400 dark:text-zinc-500",
  },
  amber: {
    completed: "bg-amber-500 dark:bg-amber-400",
    completedIcon: "text-white dark:text-amber-950",
    current: "ring-amber-500",
    upcoming: "bg-amber-100 dark:bg-amber-950/40",
    line: "bg-amber-400 dark:bg-amber-700",
    lineUpcoming: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-amber-900 dark:text-amber-200",
    textUpcoming: "text-zinc-400 dark:text-zinc-500",
  },
  cyan: {
    completed: "bg-cyan-600 dark:bg-cyan-400",
    completedIcon: "text-white dark:text-cyan-950",
    current: "ring-cyan-500",
    upcoming: "bg-cyan-100 dark:bg-cyan-950/40",
    line: "bg-cyan-400 dark:bg-cyan-700",
    lineUpcoming: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-cyan-900 dark:text-cyan-200",
    textUpcoming: "text-zinc-400 dark:text-zinc-500",
  },
  emerald: {
    completed: "bg-emerald-600 dark:bg-emerald-400",
    completedIcon: "text-white dark:text-emerald-950",
    current: "ring-emerald-500",
    upcoming: "bg-emerald-100 dark:bg-emerald-950/40",
    line: "bg-emerald-400 dark:bg-emerald-700",
    lineUpcoming: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-emerald-900 dark:text-emerald-200",
    textUpcoming: "text-zinc-400 dark:text-zinc-500",
  },
  green: {
    completed: "bg-green-600 dark:bg-green-400",
    completedIcon: "text-white dark:text-green-950",
    current: "ring-green-500",
    upcoming: "bg-green-100 dark:bg-green-950/40",
    line: "bg-green-400 dark:bg-green-700",
    lineUpcoming: "bg-zinc-200 dark:bg-zinc-800",
    text: "text-green-900 dark:text-green-200",
    textUpcoming: "text-zinc-400 dark:text-zinc-500",
  },
};

const PAGE_SIZE = 10;

const KARAT_OPTIONS = Object.keys(KARAT_LABELS);

// ===================== Helper: deadline status =====================
function deadlineStatus(
  deadline: string | null | undefined,
  status: string
): { label: string; tone: "ok" | "warning" | "danger" | "neutral" } {
  if (!deadline) return { label: "بدون مهلت", tone: "neutral" };
  if (status === "delivered" || status === "cancelled")
    return { label: formatPersianDate(deadline), tone: "neutral" };
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return {
      label: `${toPersianDigits(Math.abs(diffDays))} روز تأخیر`,
      tone: "danger",
    };
  if (diffDays <= 2)
    return { label: `${toPersianDigits(diffDays)} روز مانده`, tone: "warning" };
  return { label: `${toPersianDigits(diffDays)} روز مانده`, tone: "ok" };
}

// ===================== Sub-components =====================

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`${STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.pending} gap-1`}
    >
      {status === "cancelled" ? (
        <Ban className="w-3 h-3" />
      ) : status === "delivered" ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      {statusText(status)}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] || ClipboardList;
  return (
    <Badge
      variant="outline"
      className={`${TYPE_BADGE_CLASSES[type] || ""} gap-1`}
    >
      <Icon className="w-3 h-3" />
      {TYPE_LABELS[type] || type}
    </Badge>
  );
}

function DeadlineCell({
  deadline,
  status,
}: {
  deadline: string | null | undefined;
  status: string;
}) {
  const ds = deadlineStatus(deadline, status);
  const toneClass =
    ds.tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : ds.tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : ds.tone === "ok"
          ? "text-green-600 dark:text-green-400"
          : "text-muted-foreground";
  return (
    <span className={`text-xs ${toneClass}`}>
      {ds.label}
      {deadline && ds.tone !== "neutral" && (
        <span className="block text-[10px] text-muted-foreground mt-0.5">
          {formatPersianDate(deadline)}
        </span>
      )}
    </span>
  );
}

// ===================== Manufacturing Timeline =====================

function ManufacturingTimeline({
  order,
}: {
  order: OrderDetail;
}) {
  const isCancelled = order.status === "delivered"
    ? false
    : order.status === "cancelled";

  // Map status -> first timeline entry (most recent entry with that status)
  // We take the FIRST occurrence so the timeline reflects when each stage started.
  const timelineByStatus = new Map<string, TimelineEntry>();
  for (const entry of order.timeline) {
    if (!timelineByStatus.has(entry.status)) {
      timelineByStatus.set(entry.status, entry);
    }
  }

  // Determine which flow stages are completed.
  // A stage is "completed" if either:
  //  - it's the current status, OR
  //  - it appears earlier in the flow than the current status
  //  - OR has a timeline entry (covers cancelled→reopened cases)
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const cancelledTimelineEntry = isCancelled
    ? order.timeline.find((t) => t.status === "cancelled")
    : null;

  return (
    <div className="relative pr-2">
      {/* Cancelled banner */}
      {isCancelled && (
        <div className="mb-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-2">
          <Ban className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-700 dark:text-red-300">
              این سفارش لغو شده است
            </p>
            {cancelledTimelineEntry?.note && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                {cancelledTimelineEntry.note}
              </p>
            )}
            {cancelledTimelineEntry && (
              <p className="text-red-500/80 dark:text-red-400/80 text-xs mt-1">
                {formatPersianDateTime(cancelledTimelineEntry.createdAt)}
              </p>
            )}
          </div>
        </div>
      )}

      <ol className="relative">
        {STATUS_FLOW.map((stage, idx) => {
          const cfg = STAGE_CONFIG[stage];
          const tokens = STAGE_COLOR_TOKENS[cfg.color];
          const Icon = cfg.icon;
          const entry = timelineByStatus.get(stage);

          // Determine stage state
          let stageState: "completed" | "current" | "upcoming";
          if (isCancelled) {
            // For cancelled orders, show stages that were completed before cancellation
            stageState = entry ? "completed" : "upcoming";
          } else if (currentIdx === -1) {
            // Unknown status, fallback to entry-based
            stageState = entry ? "completed" : "upcoming";
          } else {
            if (idx < currentIdx) stageState = "completed";
            else if (idx === currentIdx) stageState = "current";
            else stageState = "upcoming";
          }

          // If this stage has a timeline entry but isn't yet "current"/"completed" by flow,
          // mark as completed (e.g. when cancelled, prior stages still show as completed)
          if (entry && stageState === "upcoming") {
            stageState = "completed";
          }

          const isLast = idx === STATUS_FLOW.length - 1;
          const lineState =
            stageState === "completed" && !isLast
              ? "completed"
              : "upcoming";

          return (
            <li
              key={stage}
              className="relative flex gap-3 pb-6 last:pb-0"
            >
              {/* Connecting line — sits BEHIND the circle */}
              {!isLast && (
                <span
                  className={`absolute top-9 right-[15px] w-0.5 h-[calc(100%-1.5rem)] ${
                    lineState === "completed"
                      ? tokens.line
                      : tokens.lineUpcoming
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Circle with icon */}
              <div className="relative shrink-0 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    stageState === "completed"
                      ? `${tokens.completed} ${tokens.completedIcon}`
                      : stageState === "current"
                        ? `${tokens.upcoming} ring-2 ${tokens.current} ring-offset-2 ring-offset-background`
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stageState === "completed" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {stageState === "current" && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                  </span>
                )}
              </div>

              {/* Stage content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-medium text-sm ${
                      stageState === "upcoming"
                        ? tokens.textUpcoming
                        : tokens.text
                    }`}
                  >
                    {cfg.label}
                  </span>
                  {stageState === "current" && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px]"
                    >
                      مرحله فعلی
                    </Badge>
                  )}
                  {stageState === "completed" && entry && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatPersianDateTime(entry.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cfg.description}
                </p>
                {entry?.note && (
                  <p className="text-xs text-foreground/80 bg-muted/60 dark:bg-muted/30 rounded-md px-2 py-1 mt-1.5 border border-border/50">
                    {entry.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ===================== Stat Card =====================

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "amber" | "green" | "orange" | "violet";
}) {
  const accentClasses: Record<string, string> = {
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400",
    orange: "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
    violet: "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-xl font-bold truncate">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== Main Module =====================

export function OrdersModule() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [stats, setStats] = React.useState<OrdersStats | null>(null);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [typeTab, setTypeTab] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  // Dialogs
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Order | null>(null);
  const [selected, setSelected] = React.useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Order | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = React.useState("");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchInput]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (typeTab !== "all") params.set("type", typeTab);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/orders?${params.toString()}`, {
        credentials: "include",
      });
      const data: ListResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error || "خطا");
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در بارگذاری سفارشات");
    } finally {
      setLoading(false);
    }
  }, [page, typeTab, statusFilter, search]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openDetail = async (o: Order) => {
    setDetailOpen(true);
    setSelected(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/orders/${o.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setSelected(data as OrderDetail);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت جزئیات");
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setSelected(data as OrderDetail);
    } catch {
      // ignore
    }
  };

  const handleFormSubmit = () => {
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/orders/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در حذف سفارش");
      }
      toast.success("سفارش با موفقیت حذف شد");
      setDeleteTarget(null);
      if (detailOpen && selected?.id === deleteTarget.id) {
        setDetailOpen(false);
        setSelected(null);
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در حذف سفارش");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            سفارشات و تعمیرات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مدیریت سفارش‌های سفارشی، تعمیرات و ساخت طلا و جواهر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 ml-1" />
            به‌روزرسانی
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            ثبت سفارش جدید
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 h-32">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="سفارشات در حال انجام"
              value={toPersianDigits(stats?.inProgress ?? 0)}
              subtitle="مراحل طراحی تا آماده تحویل"
              icon={Clock}
              accent="amber"
            />
            <StatCard
              title="تحویل شده"
              value={toPersianDigits(stats?.delivered ?? 0)}
              subtitle={`لغو شده: ${toPersianDigits(stats?.cancelled ?? 0)}`}
              icon={CheckCircle}
              accent="green"
            />
            <StatCard
              title="تعمیرات"
              value={toPersianDigits(stats?.repairs ?? 0)}
              subtitle="سفارشات تعمیری فعال"
              icon={Wrench}
              accent="orange"
            />
            <StatCard
              title="میانگین زمان تحویل"
              value={`${toPersianDigits(
                (stats?.avgDeliveryDays ?? 0).toFixed(1)
              )} روز`}
              subtitle="از ثبت تا تحویل"
              icon={Calendar}
              accent="violet"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            {/* Type tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  typeTab === "all"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setTypeTab("all");
                  setPage(1);
                }}
              >
                <ClipboardList className="w-4 h-4" />
                همه
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  typeTab === "custom"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setTypeTab("custom");
                  setPage(1);
                }}
              >
                <ClipboardList className="w-4 h-4" />
                سفارشی
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  typeTab === "repair"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setTypeTab("repair");
                  setPage(1);
                }}
              >
                <Wrench className="w-4 h-4" />
                تعمیر
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  typeTab === "manufacturing"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setTypeTab("manufacturing");
                  setPage(1);
                }}
              >
                <Hammer className="w-4 h-4" />
                ساخت
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی شماره سفارش، عنوان، مشتری..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-9"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="همه وضعیت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                {STATUS_FLOW.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusText(s)}
                  </SelectItem>
                ))}
                <SelectItem value="cancelled">{statusText("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="text-right min-w-[110px]">شماره سفارش</TableHead>
                  <TableHead className="text-right min-w-[90px]">نوع</TableHead>
                  <TableHead className="text-right min-w-[160px]">عنوان</TableHead>
                  <TableHead className="text-right min-w-[120px]">مشتری</TableHead>
                  <TableHead className="text-right min-w-[110px]">وضعیت</TableHead>
                  <TableHead className="text-right min-w-[90px]">وزن طلا</TableHead>
                  <TableHead className="text-right min-w-[120px]">هزینه تخمینی</TableHead>
                  <TableHead className="text-right min-w-[120px]">مهلت تحویل</TableHead>
                  <TableHead className="text-right min-w-[110px]">مسئول</TableHead>
                  <TableHead className="text-right min-w-[80px]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={10}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-16"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
                        <p>سفارشی یافت نشد</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          ثبت اولین سفارش
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => {
                    const ds = deadlineStatus(o.deadline, o.status);
                    return (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors"
                        onClick={() => openDetail(o)}
                      >
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                            {o.orderNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TypeBadge type={o.type} />
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {o.title}
                            </p>
                            {o.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {o.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {o.customer ? (
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[120px]">
                                {o.customer.name}
                              </p>
                              {o.customer.phone && (
                                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                  {toPersianDigits(o.customer.phone)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              بدون مشتری
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm flex items-center gap-1">
                            <Weight className="w-3 h-3 text-muted-foreground" />
                            {formatWeight(o.goldWeight)}
                          </span>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-800"
                          >
                            {karatLabel(o.karat)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {formatToman(o.estimatedCost)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DeadlineCell deadline={o.deadline} status={o.status} />
                        </TableCell>
                        <TableCell>
                          {o.assignedTo ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                                <User className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              </div>
                              <span className="text-xs truncate max-w-[80px]">
                                {o.assignedTo.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              تعیین نشده
                            </span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="مشاهده جزئیات"
                              onClick={() => openDetail(o)}
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="حذف"
                              onClick={() => setDeleteTarget(o)}
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
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                نمایش{" "}
                <span className="font-medium text-foreground">
                  {toPersianDigits((page - 1) * PAGE_SIZE + 1)}
                </span>{" "}
                تا{" "}
                <span className="font-medium text-foreground">
                  {toPersianDigits(Math.min(page * PAGE_SIZE, total))}
                </span>{" "}
                از{" "}
                <span className="font-medium text-foreground">
                  {toPersianDigits(total)}
                </span>{" "}
                سفارش
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </Button>
                <span className="text-sm text-muted-foreground">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingDetail || !selected ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : (
            <OrderDetailContent
              order={selected}
              onRefresh={() => refreshDetail(selected.id)}
              onAfterStatusChange={() => {
                load();
              }}
              onClose={() => setDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New / Edit Order Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <OrderForm
            editing={editing}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سفارش</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف سفارش{" "}
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                {deleteTarget?.orderNumber}
              </span>{" "}
              («{deleteTarget?.title}») مطمئن هستید؟ این عملیات قابل بازگشت نیست
              و تمام اطلاعات مرتبط شامل آیتم‌ها و خط زمانی حذف خواهند شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              حذف سفارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===================== Order Detail Content =====================

function OrderDetailContent({
  order,
  onRefresh,
  onAfterStatusChange,
  onClose,
}: {
  order: OrderDetail;
  onRefresh: () => void;
  onAfterStatusChange: () => void;
  onClose: () => void;
}) {
  const [advancing, setAdvancing] = React.useState(false);
  const [advNote, setAdvNote] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [reopenConfirm, setReopenConfirm] = React.useState(false);

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStage =
    currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIdx + 1]
      : null;

  const advanceStatus = async (target: string, note?: string) => {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: target, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در تغییر وضعیت");
      toast.success(
        `وضعیت سفارش به «${statusText(target)}» تغییر یافت`
      );
      setAdvNote("");
      onRefresh();
      onAfterStatusChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در تغییر وضعیت");
    } finally {
      setAdvancing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    await advanceStatus("cancelled", advNote || "لغو توسط کاربر");
    setCancelling(false);
  };

  const handleReopen = async () => {
    setReopenConfirm(false);
    await advanceStatus("pending", "بازگشایی سفارش");
  };

  const ds = deadlineStatus(order.deadline, order.status);
  const totalDays = (() => {
    if (!order.timeline || order.timeline.length === 0) return null;
    const first = new Date(order.timeline[0].createdAt);
    const last = new Date(
      order.timeline[order.timeline.length - 1].createdAt
    );
    return Math.max(
      0,
      Math.round(
        (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  })();

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <DialogTitle className="text-lg flex items-center gap-2">
                {order.title}
              </DialogTitle>
              <TypeBadge type={order.type} />
              <StatusBadge status={order.status} />
            </div>
            <DialogDescription className="font-mono text-xs">
              {order.orderNumber} · ثبت: {formatPersianDateTime(order.createdAt)}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </DialogHeader>

      {/* Summary info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Customer card */}
        <Card className="bg-muted/30 dark:bg-muted/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <User className="w-4 h-4" />
              اطلاعات مشتری
            </div>
            {order.customer ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-medium">{order.customer.name}</span>
                </div>
                {order.customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {toPersianDigits(order.customer.phone)}
                    </span>
                  </div>
                )}
                {order.customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-xs truncate">
                      {order.customer.email}
                    </span>
                  </div>
                )}
                {order.customer.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 mt-0.5" />
                    <span className="text-xs">{order.customer.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                سفارش بدون مشتری ثبت شده است
              </p>
            )}
          </CardContent>
        </Card>

        {/* Specs card */}
        <Card className="bg-muted/30 dark:bg-muted/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <Gem className="w-4 h-4" />
              مشخصات سفارش
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SpecItem
                icon={Weight}
                label="وزن طلا"
                value={formatWeight(order.goldWeight)}
              />
              <SpecItem
                icon={Coins}
                label="عیار"
                value={karatLabel(order.karat)}
              />
              <SpecItem
                icon={Wallet}
                label="اجرت ساخت"
                value={formatToman(order.makingCharge)}
              />
              <SpecItem
                icon={Gem}
                label="هزینه سنگ"
                value={formatToman(order.stoneCost)}
              />
              <SpecItem
                icon={Wallet}
                label="هزینه تخمینی"
                value={formatToman(order.estimatedCost)}
                highlight
              />
              {isDelivered && order.finalCost > 0 && (
                <SpecItem
                  icon={CheckCircle}
                  label="هزینه نهایی"
                  value={formatToman(order.finalCost)}
                  highlight
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadline + assignee + total days */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
        <div className="rounded-lg border border-border p-3 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">مهلت تحویل</p>
            <p
              className={`text-sm font-medium ${
                ds.tone === "danger"
                  ? "text-red-600 dark:text-red-400"
                  : ds.tone === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
              }`}
            >
              {order.deadline
                ? formatPersianDate(order.deadline)
                : "بدون مهلت"}
            </p>
            {ds.tone !== "neutral" && (
              <p className="text-[10px] text-muted-foreground">{ds.label}</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border p-3 flex items-center gap-3">
          <UserCog className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">مسئول پیگیری</p>
            <p className="text-sm font-medium">
              {order.assignedTo?.name || "تعیین نشده"}
            </p>
            {order.assignedTo && (
              <p className="text-[10px] text-muted-foreground">
                {order.assignedTo.role}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border p-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">مدت زمان سپری شده</p>
            <p className="text-sm font-medium">
              {totalDays !== null
                ? `${toPersianDigits(totalDays)} روز`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {order.description && (
        <div className="rounded-lg border border-border p-3 mt-3">
          <p className="text-xs text-muted-foreground mb-1">توضیحات</p>
          <p className="text-sm whitespace-pre-wrap">{order.description}</p>
        </div>
      )}

      <Separator className="my-4" />

      {/* Manufacturing Workflow Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Hammer className="w-4 h-4 text-amber-500" />
              خط زمانی ساخت
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              مراحل تولید از ثبت تا تحویل
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border p-4 bg-gradient-to-bl from-amber-50/50 to-transparent dark:from-amber-950/10">
          <ManufacturingTimeline order={order} />
        </div>
      </div>

      {/* Action: advance status */}
      {!isCancelled && !isDelivered && nextStage && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4 mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              انتقال به مرحله بعد:{" "}
              <span className="font-semibold">
                {STAGE_CONFIG[nextStage].label}
              </span>
            </p>
          </div>
          <Input
            placeholder="یادداشت اختیاری برای این مرحله (مثلاً: تایید مشتری، پایان ریخته‌گری...)"
            value={advNote}
            onChange={(e) => setAdvNote(e.target.value)}
            className="bg-background"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={advancing}
              onClick={() => advanceStatus(nextStage, advNote)}
            >
              {advancing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              انتقال به مرحله بعد
            </Button>
            <Button
              variant="outline"
              className="text-destructive border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
              disabled={cancelling}
              onClick={handleCancel}
            >
              <Ban className="w-4 h-4" />
              لغو سفارش
            </Button>
          </div>
        </div>
      )}

      {/* Action: delivered (show success state) */}
      {isDelivered && (
        <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 p-4 mt-3 flex items-start gap-3">
          <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              سفارش با موفقیت تحویل داده شد
            </p>
            {order.finalCost > 0 && (
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                هزینه نهایی: {formatToman(order.finalCost)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action: cancelled (reopen) */}
      {isCancelled && (
        <div className="rounded-lg border border-border p-4 mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            سفارش لغو شده است. در صورت نیاز می‌توانید آن را مجدداً بازگشایی کنید.
          </p>
          <Button
            variant="outline"
            onClick={() => setReopenConfirm(true)}
            disabled={advancing}
          >
            <RotateCcw className="w-4 h-4" />
            بازگشایی
          </Button>
        </div>
      )}

      <AlertDialog
        open={reopenConfirm}
        onOpenChange={setReopenConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>بازگشایی سفارش</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از بازگشایی این سفارش لغو شده مطمئن هستید؟ وضعیت به «در انتظار»
              باز خواهد گشت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReopen}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              بازگشایی سفارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SpecItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-2 border ${
        highlight
          ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          : "border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
        <Icon className="w-3 h-3" />
        <span className="text-[10px]">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}

// ===================== Order Form (New / Edit) =====================

interface FormState {
  type: string;
  title: string;
  description: string;
  customerId: string;
  karat: string;
  goldWeight: string;
  makingCharge: string;
  stoneCost: string;
  estimatedCost: string;
  assignedToId: string;
  deadline: string;
}

const EMPTY_FORM: FormState = {
  type: "custom",
  title: "",
  description: "",
  customerId: "",
  karat: "750",
  goldWeight: "",
  makingCharge: "",
  stoneCost: "",
  estimatedCost: "",
  assignedToId: "",
  deadline: "",
};

function OrderForm({
  editing,
  onSubmit,
  onCancel,
}: {
  editing: Order | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [customers, setCustomers] = React.useState<CustomerRef[]>([]);
  const [staff, setStaff] = React.useState<StaffRef[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState("");

  // Load customers + staff on mount
  React.useEffect(() => {
    (async () => {
      try {
        const [custRes, staffRes] = await Promise.all([
          fetch("/api/customers?pageSize=200", { credentials: "include" }),
          fetch("/api/staff", { credentials: "include" }),
        ]);
        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(data.items || []);
        }
        if (staffRes.ok) {
          const data = await staffRes.json();
          setStaff(data.items || []);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Hydrate form on edit
  React.useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type || "custom",
        title: editing.title || "",
        description: editing.description || "",
        customerId: editing.customerId || "",
        karat: editing.karat || "750",
        goldWeight:
          editing.goldWeight !== undefined
            ? String(editing.goldWeight)
            : "",
        makingCharge:
          editing.makingCharge !== undefined
            ? String(editing.makingCharge)
            : "",
        stoneCost:
          editing.stoneCost !== undefined ? String(editing.stoneCost) : "",
        estimatedCost:
          editing.estimatedCost !== undefined
            ? String(editing.estimatedCost)
            : "",
        assignedToId: editing.assignedToId || "",
        deadline: editing.deadline
          ? new Date(editing.deadline).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing]);

  // Filtered customers (client-side filter on name/phone)
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 50);
    const q = customerSearch.trim();
    return customers
      .filter(
        (c) =>
          c.name.includes(q) ||
          (c.phone && c.phone.includes(q))
      )
      .slice(0, 50);
  }, [customers, customerSearch]);

  const update = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان سفارش الزامی است");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        customerId: form.customerId || null,
        karat: form.karat,
        goldWeight: Number(form.goldWeight) || 0,
        makingCharge: Number(form.makingCharge) || 0,
        stoneCost: Number(form.stoneCost) || 0,
        estimatedCost: Number(form.estimatedCost) || 0,
        assignedToId: form.assignedToId || null,
        deadline: form.deadline || null,
      };

      let res: Response;
      if (editing) {
        res = await fetch(`/api/orders/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت سفارش");
      toast.success(
        editing ? "سفارش با موفقیت ویرایش شد" : "سفارش جدید با موفقیت ثبت شد"
      );
      onSubmit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-500" />
          {editing ? "ویرایش سفارش" : "ثبت سفارش جدید"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? `ویرایش سفارش ${editing.orderNumber}`
            : "مشخصات سفارش را برای ثبت وارد کنید"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        {/* Type */}
        <div className="space-y-1.5">
          <Label>نوع سفارش *</Label>
          <Select
            value={form.type}
            onValueChange={(v) => update("type", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">سفارشی</SelectItem>
              <SelectItem value="repair">تعمیر</SelectItem>
              <SelectItem value="manufacturing">ساخت</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Karat */}
        <div className="space-y-1.5">
          <Label>عیار طلا *</Label>
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
        </div>

        {/* Title */}
        <div className="space-y-1.5 md:col-span-2">
          <Label>عنوان سفارش *</Label>
          <Input
            placeholder="مثلاً: انگشتر طلا با نگین سبز"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <Label>توضیحات</Label>
          <Textarea
            placeholder="جزئیات طراحی، ابعاد، نوع نگین، الگو و..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </div>

        {/* Customer */}
        <div className="space-y-1.5 md:col-span-2">
          <Label>مشتری</Label>
          <Select
            value={form.customerId}
            onValueChange={(v) => update("customerId", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب مشتری (اختیاری)" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="جستجوی نام یا تلفن..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8"
                />
              </div>
              <SelectItem value="">بدون مشتری</SelectItem>
              {filteredCustomers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` — ${toPersianDigits(c.phone)}` : ""}
                </SelectItem>
              ))}
              {customers.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  مشتری‌ای یافت نشد
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Gold Weight */}
        <div className="space-y-1.5">
          <Label>وزن طلا (گرم)</Label>
          <Input
            type="number"
            step="0.001"
            min="0"
            placeholder="مثلاً ۵.۲"
            value={form.goldWeight}
            onChange={(e) => update("goldWeight", e.target.value)}
          />
        </div>

        {/* Making Charge */}
        <div className="space-y-1.5">
          <Label>اجرت ساخت (تومان)</Label>
          <Input
            type="number"
            step="1000"
            min="0"
            placeholder="مثلاً ۵۰۰۰۰۰"
            value={form.makingCharge}
            onChange={(e) => update("makingCharge", e.target.value)}
          />
        </div>

        {/* Stone Cost */}
        <div className="space-y-1.5">
          <Label>هزینه سنگ (تومان)</Label>
          <Input
            type="number"
            step="1000"
            min="0"
            placeholder="مثلاً ۲۰۰۰۰۰۰"
            value={form.stoneCost}
            onChange={(e) => update("stoneCost", e.target.value)}
          />
        </div>

        {/* Estimated Cost */}
        <div className="space-y-1.5">
          <Label>هزینه تخمینی (تومان)</Label>
          <Input
            type="number"
            step="1000"
            min="0"
            placeholder="مثلاً ۱۵۰۰۰۰۰۰"
            value={form.estimatedCost}
            onChange={(e) => update("estimatedCost", e.target.value)}
          />
        </div>

        {/* Assigned To */}
        <div className="space-y-1.5">
          <Label>مسئول پیگیری</Label>
          <Select
            value={form.assignedToId}
            onValueChange={(v) => update("assignedToId", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب کارمند" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">تعیین نشده</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label>مهلت تحویل</Label>
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          انصراف
        </Button>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          disabled={submitting || !form.title.trim()}
          onClick={handleSubmit}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editing ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {editing ? "ذخیره تغییرات" : "ثبت سفارش"}
        </Button>
      </DialogFooter>
    </>
  );
}
