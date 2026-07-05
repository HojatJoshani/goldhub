import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_SALES, DEMO_EXPENSES } from "@/lib/demo-data";

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: "اجاره",
  salary: "حقوق",
  utilities: "آب و برق و گاز",
  supplies: "تأمین کالا",
  marketing: "بازاریابی",
  other: "سایر",
};

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }
    const tenantId = user.tenantId;

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoFinancialReport());
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Revenue (30 days, completed sales)
      const sales = await db.sale.findMany({
        where: {
          tenantId,
          status: "completed",
          createdAt: { gte: thirtyDaysAgo, lte: todayEnd },
        },
        select: {
          total: true,
          subtotal: true,
          makingTotal: true,
          discount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const revenue = sales.reduce((s, x) => s + x.total, 0);
      const grossSales = sales.reduce((s, x) => s + x.subtotal, 0);
      const totalMaking = sales.reduce((s, x) => s + x.makingTotal, 0);
      const totalDiscount = sales.reduce((s, x) => s + x.discount, 0);

      // Expenses (30 days)
      const expenses = await db.expense.findMany({
        where: { tenantId, date: { gte: thirtyDaysAgo, lte: todayEnd } },
        select: { amount: true, category: true, date: true },
      });

      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const netProfit = revenue - totalExpenses;
      const profitMargin =
        revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

      // Expenses by category
      const expCatMap = new Map<string, { total: number; count: number }>();
      for (const e of expenses) {
        const entry = expCatMap.get(e.category) || { total: 0, count: 0 };
        entry.total += e.amount;
        entry.count += 1;
        expCatMap.set(e.category, entry);
      }
      const expensesByCategory = Array.from(expCatMap.entries())
        .map(([category, v]) => ({
          category,
          label: EXPENSE_CATEGORY_LABELS[category] || category,
          total: v.total,
          count: v.count,
        }))
        .sort((a, b) => b.total - a.total);

      // Daily P&L breakdown for the last 30 days
      const dailyMap = new Map<
        string,
        { revenue: number; expenses: number }
      >();
      const ensureDay = (key: string) => {
        if (!dailyMap.has(key)) dailyMap.set(key, { revenue: 0, expenses: 0 });
        return dailyMap.get(key)!;
      };
      for (const s of sales) {
        const k = dayKey(s.createdAt);
        ensureDay(k).revenue += s.total;
      }
      for (const e of expenses) {
        const k = dayKey(e.date);
        ensureDay(k).expenses += e.amount;
      }

      const daily: {
        key: string;
        label: string;
        revenue: number;
        expenses: number;
        profit: number;
      }[] = [];
      const cursor = new Date(thirtyDaysAgo);
      while (cursor <= todayEnd) {
        const k = dayKey(cursor);
        const v = dailyMap.get(k) || { revenue: 0, expenses: 0 };
        const label = new Intl.DateTimeFormat("fa-IR", {
          day: "numeric",
          month: "short",
        }).format(cursor);
        daily.push({
          key: k,
          label,
          revenue: v.revenue,
          expenses: v.expenses,
          profit: v.revenue - v.expenses,
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      return NextResponse.json({
        range: {
          from: thirtyDaysAgo.toISOString(),
          to: todayEnd.toISOString(),
        },
        summary: {
          revenue,
          grossSales,
          totalMaking,
          totalDiscount,
          totalExpenses,
          netProfit,
          profitMargin,
          salesCount: sales.length,
        },
        expensesByCategory,
        daily,
      });
    } catch (dbError) {
      console.error("Reports financial DB error, using demo:", dbError);
      return NextResponse.json(getDemoFinancialReport());
    }
  } catch (error) {
    console.error("Reports financial API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش مالی" },
      { status: 500 }
    );
  }
}

/**
 * Demo financial report data for when database is not available (Vercel)
 */
function getDemoFinancialReport() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const sales = DEMO_SALES.filter(
    (s) =>
      s.createdAt >= thirtyDaysAgo &&
      s.createdAt <= todayEnd &&
      s.status === "completed"
  );

  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const grossSales = sales.reduce((s, x) => s + x.subtotal, 0);
  const totalMaking = sales.reduce((s, x) => s + ((x as any).makingTotal || 0), 0);
  const totalDiscount = sales.reduce((s, x) => s + x.discount, 0);

  const expenses = DEMO_EXPENSES.filter(
    (e) => e.date >= thirtyDaysAgo && e.date <= todayEnd
  );

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = revenue - totalExpenses;
  const profitMargin =
    revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

  const expCatMap = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const entry = expCatMap.get(e.category) || { total: 0, count: 0 };
    entry.total += e.amount;
    entry.count += 1;
    expCatMap.set(e.category, entry);
  }
  const expensesByCategory = Array.from(expCatMap.entries())
    .map(([category, v]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category] || category,
      total: v.total,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);

  const dailyMap = new Map<string, { revenue: number; expenses: number }>();
  const ensureDay = (key: string) => {
    if (!dailyMap.has(key)) dailyMap.set(key, { revenue: 0, expenses: 0 });
    return dailyMap.get(key)!;
  };
  for (const s of sales) {
    const k = dayKey(s.createdAt);
    ensureDay(k).revenue += s.total;
  }
  for (const e of expenses) {
    const k = dayKey(e.date);
    ensureDay(k).expenses += e.amount;
  }

  const daily: {
    key: string;
    label: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[] = [];
  const cursor = new Date(thirtyDaysAgo);
  while (cursor <= todayEnd) {
    const k = dayKey(cursor);
    const v = dailyMap.get(k) || { revenue: 0, expenses: 0 };
    const label = new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "short",
    }).format(cursor);
    daily.push({
      key: k,
      label,
      revenue: v.revenue,
      expenses: v.expenses,
      profit: v.revenue - v.expenses,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    range: {
      from: thirtyDaysAgo.toISOString(),
      to: todayEnd.toISOString(),
    },
    summary: {
      revenue,
      grossSales,
      totalMaking,
      totalDiscount,
      totalExpenses,
      netProfit,
      profitMargin,
      salesCount: sales.length,
    },
    expensesByCategory,
    daily,
  };
}
