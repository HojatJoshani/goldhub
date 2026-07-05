import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

type GroupBy = "day" | "week" | "month";

/** Build a stable YYYY-MM-DD key for grouping sales. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get the start of the ISO week (Saturday in Persian calendar context — we use Saturday as week start). */
function weekStart(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0=Sun ... 6=Sat
  // Shift to Saturday (Persian week starts Saturday)
  const diff = (day + 1) % 7; // Sat -> 0, Sun -> 1, ... Fri -> 6
  date.setDate(date.getDate() - diff);
  return date;
}

/** Build a YYYY-MM key for month grouping. */
function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }
    const tenantId = user.tenantId;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const groupBy = (searchParams.get("groupBy") || "day") as GroupBy;

    // Default: last 30 days
    const to = toParam ? new Date(toParam) : new Date(now);
    if (toParam) to.setHours(23, 59, 59, 999);
    else to.setHours(23, 59, 59, 999);

    const from = fromParam
      ? new Date(fromParam)
      : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);

    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
      return NextResponse.json(
        { error: "بازه تاریخ نامعتبر است" },
        { status: 400 }
      );
    }

    // Fetch all completed sales in the range with key fields
    const sales = await db.sale.findMany({
      where: {
        tenantId,
        status: "completed",
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        discount: true,
        makingTotal: true,
        paymentMethod: true,
        branchId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totalSales = sales.reduce((s, x) => s + x.total, 0);
    const totalSubtotal = sales.reduce((s, x) => s + x.subtotal, 0);
    const totalDiscount = sales.reduce((s, x) => s + x.discount, 0);
    const totalMaking = sales.reduce((s, x) => s + x.makingTotal, 0);
    const count = sales.length;
    const avgOrderValue = count > 0 ? totalSales / count : 0;

    // ---- Grouped time series for chart ----
    type Bucket = { label: string; key: string; total: number; count: number };
    const bucketMap = new Map<string, Bucket>();

    const ensureBucket = (key: string, label: string) => {
      if (!bucketMap.has(key)) {
        bucketMap.set(key, { label, key, total: 0, count: 0 });
      }
      return bucketMap.get(key)!;
    };

    for (const s of sales) {
      const d = s.createdAt;
      let key: string;
      let label: string;
      if (groupBy === "month") {
        key = monthKey(d);
        const dt = new Intl.DateTimeFormat("fa-IR", {
          month: "long",
          year: "numeric",
        }).format(d);
        label = dt;
      } else if (groupBy === "week") {
        const ws = weekStart(d);
        key = dayKey(ws);
        const dt = new Intl.DateTimeFormat("fa-IR", {
          day: "numeric",
          month: "short",
        }).format(ws);
        label = dt;
      } else {
        key = dayKey(d);
        const dt = new Intl.DateTimeFormat("fa-IR", {
          day: "numeric",
          month: "short",
        }).format(d);
        label = dt;
      }
      const b = ensureBucket(key, label);
      b.total += s.total;
      b.count += 1;
    }

    // Fill empty day buckets between from and to for "day" grouping
    const series: Bucket[] = [];
    if (groupBy === "day") {
      const cursor = new Date(from);
      while (cursor <= to) {
        const key = dayKey(cursor);
        const label = new Intl.DateTimeFormat("fa-IR", {
          day: "numeric",
          month: "short",
        }).format(cursor);
        const b = bucketMap.get(key);
        series.push({
          key,
          label,
          total: b?.total || 0,
          count: b?.count || 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // Sort by key ascending for week/month
      const sorted = Array.from(bucketMap.values()).sort((a, b) =>
        a.key < b.key ? -1 : a.key > b.key ? 1 : 0
      );
      series.push(...sorted);
    }

    // ---- Sales by payment method ----
    const paymentMap = new Map<string, { total: number; count: number }>();
    for (const s of sales) {
      const entry =
        paymentMap.get(s.paymentMethod) || { total: 0, count: 0 };
      entry.total += s.total;
      entry.count += 1;
      paymentMap.set(s.paymentMethod, entry);
    }
    const byPaymentMethod = Array.from(paymentMap.entries()).map(
      ([method, v]) => ({ method, total: v.total, count: v.count })
    );

    // ---- Sales by branch ----
    const branchMap = new Map<string, { total: number; count: number }>();
    for (const s of sales) {
      const entry = branchMap.get(s.branchId) || { total: 0, count: 0 };
      entry.total += s.total;
      entry.count += 1;
      branchMap.set(s.branchId, entry);
    }
    const branchIds = Array.from(branchMap.keys());
    const branches = branchIds.length
      ? await db.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true, name: true },
        })
      : [];
    const branchName = (id: string) =>
      branches.find((b) => b.id === id)?.name || "نامشخص";
    const byBranch = Array.from(branchMap.entries()).map(([branchId, v]) => ({
      branchId,
      branchName: branchName(branchId),
      total: v.total,
      count: v.count,
    }));

    // ---- Sales by hour of day (0..23) ----
    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      total: 0,
      count: 0,
    }));
    for (const s of sales) {
      const h = s.createdAt.getHours();
      hourBuckets[h].total += s.total;
      hourBuckets[h].count += 1;
    }

    // ---- Top 10 products ----
    const topProductsRaw = await db.saleItem.groupBy({
      by: ["productId", "name"],
      where: {
        sale: { tenantId, createdAt: { gte: from, lte: to }, status: "completed" },
      },
      _sum: { total: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    });
    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      name: p.name,
      revenue: p._sum.total || 0,
      quantity: p._sum.quantity || 0,
      salesCount: p._count.id,
    }));

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString(), groupBy },
      summary: {
        totalSales,
        totalSubtotal,
        totalDiscount,
        totalMaking,
        count,
        avgOrderValue,
      },
      series: series.map((b) => ({
        label: b.label,
        key: b.key,
        total: b.total,
        count: b.count,
      })),
      byPaymentMethod,
      byBranch,
      byHour: hourBuckets,
      topProducts,
    });
  } catch (error) {
    console.error("Reports sales API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش فروش" },
      { status: 500 }
    );
  }
}
