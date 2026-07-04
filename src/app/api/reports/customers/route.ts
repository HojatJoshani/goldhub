import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Loyalty tier based on totalSpent (toman). */
function loyaltyTier(totalSpent: number): string {
  if (totalSpent >= 100_000_000) return "platinum";
  if (totalSpent >= 50_000_000) return "gold";
  if (totalSpent >= 20_000_000) return "silver";
  if (totalSpent > 0) return "bronze";
  return "new";
}

const TIER_LABELS: Record<string, string> = {
  platinum: "پلاتین",
  gold: "طلایی",
  silver: "نقره‌ای",
  bronze: "برنزی",
  new: "جدید",
};

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }
    const tenantId = user.tenantId;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Fetch all customers with key fields
    const customers = await db.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        phone: true,
        totalSpent: true,
        totalOrders: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    const totalCustomers = customers.length;
    const newCustomers = customers.filter(
      (c) => c.createdAt >= thirtyDaysAgo
    ).length;

    // Repeat customers = customers with totalOrders >= 2
    const repeatCustomers = customers.filter(
      (c) => c.totalOrders >= 2
    ).length;
    const repeatRate =
      totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 1000) / 10
        : 0;

    // Total spend across customers
    const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
    const avgSpendPerCustomer =
      totalCustomers > 0 ? totalSpentAll / totalCustomers : 0;
    const avgOrdersPerCustomer =
      totalCustomers > 0
        ? customers.reduce((s, c) => s + c.totalOrders, 0) / totalCustomers
        : 0;

    // Loyalty tier distribution
    const tierMap = new Map<string, { count: number; totalSpent: number }>();
    for (const c of customers) {
      const tier = loyaltyTier(c.totalSpent);
      const entry = tierMap.get(tier) || { count: 0, totalSpent: 0 };
      entry.count += 1;
      entry.totalSpent += c.totalSpent;
      tierMap.set(tier, entry);
    }
    const tierOrder = ["platinum", "gold", "silver", "bronze", "new"];
    const segments = tierOrder
      .filter((t) => tierMap.has(t))
      .map((t) => ({
        tier: t,
        label: TIER_LABELS[t],
        count: tierMap.get(t)!.count,
        totalSpent: tierMap.get(t)!.totalSpent,
      }));

    // Top 10 customers by spending
    const topCustomers = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalSpent: c.totalSpent,
        totalOrders: c.totalOrders,
        loyaltyPoints: c.loyaltyPoints,
        tier: loyaltyTier(c.totalSpent),
        tierLabel: TIER_LABELS[loyaltyTier(c.totalSpent)],
        createdAt: c.createdAt,
        avgOrder: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
      }));

    // New customers trend (last 14 days)
    const trend: { label: string; key: string; count: number }[] = [];
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - 13);
    for (let i = 0; i < 14; i++) {
      const d = new Date(cursor);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = customers.filter(
        (c) => c.createdAt >= d && c.createdAt < next
      ).length;
      const label = new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "short",
      }).format(d);
      trend.push({ label, key: dayKey(d), count });
      cursor.setDate(cursor.getDate() + 1);
    }

    return NextResponse.json({
      summary: {
        totalCustomers,
        newCustomers,
        repeatCustomers,
        repeatRate,
        avgSpendPerCustomer,
        avgOrdersPerCustomer,
        totalSpent: totalSpentAll,
        totalLoyaltyPoints: customers.reduce(
          (s, c) => s + c.loyaltyPoints,
          0
        ),
      },
      segments,
      topCustomers,
      newCustomersTrend: trend,
    });
  } catch (error) {
    console.error("Reports customers API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش مشتریان" },
      { status: 500 }
    );
  }
}
