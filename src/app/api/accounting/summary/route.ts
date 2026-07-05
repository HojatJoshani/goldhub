import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import {
  DEMO_SALES,
  DEMO_EXPENSES,
  DEMO_CASHBOXES,
  DEMO_BRANCHES,
} from "@/lib/demo-data";

const EXPENSE_CATEGORIES = [
  "rent",
  "salary",
  "utilities",
  "supplies",
  "marketing",
  "other",
];

/** GET /api/accounting/summary — financial overview (cashbox, income/expenses 30d, profit, daily chart) */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoSummary());
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const fourteenDaysAgo = new Date(
        now.getTime() - 13 * 24 * 60 * 60 * 1000
      );

      // Sales (income) — last 30 days
      const sales = await db.sale.findMany({
        where: {
          tenantId,
          status: "completed",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { total: true, createdAt: true, branchId: true },
        orderBy: { createdAt: "asc" },
      });
      const totalIncome30 = sales.reduce((s, x) => s + x.total, 0);

      // Expenses — last 30 days
      const expenses = await db.expense.findMany({
        where: { tenantId, date: { gte: thirtyDaysAgo } },
        select: { amount: true, category: true, date: true, branchId: true },
        orderBy: { date: "asc" },
      });
      const totalExpenses30 = expenses.reduce((s, x) => s + x.amount, 0);

      // Expenses by category
      const expensesByCategory: Record<string, number> = {};
      for (const c of EXPENSE_CATEGORIES) expensesByCategory[c] = 0;
      for (const e of expenses) {
        const key = EXPENSE_CATEGORIES.includes(e.category)
          ? e.category
          : "other";
        expensesByCategory[key] += e.amount;
      }

      // Cashboxes — current balances
      const cashboxes = await db.cashbox.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          balance: true,
          status: true,
          branch: { select: { id: true, name: true } },
        },
      });
      const totalCashboxBalance = cashboxes.reduce(
        (s, c) => s + c.balance,
        0
      );

      // Daily breakdown for the last 14 days (income vs expenses)
      const daily: {
        date: string;
        income: number;
        expenses: number;
      }[] = [];
      for (let i = 13; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayIncome = sales
          .filter(
            (s) =>
              s.createdAt >= dayStart && s.createdAt < dayEnd
          )
          .reduce((sum, s) => sum + s.total, 0);

        const dayExpenses = expenses
          .filter(
            (e) => e.date >= dayStart && e.date < dayEnd
          )
          .reduce((sum, e) => sum + e.amount, 0);

        daily.push({
          date: dayStart.toISOString(),
          income: dayIncome,
          expenses: dayExpenses,
        });
      }

      // Sales per branch (last 30 days)
      const branchSales: Record<string, number> = {};
      for (const s of sales) {
        branchSales[s.branchId] = (branchSales[s.branchId] || 0) + s.total;
      }
      const branches = await db.branch.findMany({
        where: { tenantId },
        select: { id: true, name: true, code: true, isWarehouse: true, isMain: true },
      });
      const branchPerformance = branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        isWarehouse: b.isWarehouse,
        isMain: b.isMain,
        sales: branchSales[b.id] || 0,
      }));

      const netProfit = totalIncome30 - totalExpenses30;
      const profitMargin =
        totalIncome30 > 0
          ? Math.round((netProfit / totalIncome30) * 1000) / 10
          : 0;

      return NextResponse.json({
        kpis: {
          totalIncome30,
          totalExpenses30,
          netProfit,
          profitMargin,
          totalCashboxBalance,
          salesCount30: sales.length,
        },
        cashboxes: cashboxes.map((c) => ({
          id: c.id,
          name: c.name,
          balance: c.balance,
          status: c.status,
          branch: c.branch,
        })),
        expensesByCategory: Object.entries(expensesByCategory)
          .filter(([, v]) => v > 0)
          .map(([category, amount]) => ({ category, amount })),
        daily,
        branchPerformance,
      });
    } catch (dbError) {
      console.error("Accounting summary DB error, using demo:", dbError);
      return NextResponse.json(getDemoSummary());
    }
  } catch (error) {
    console.error("Accounting summary API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت خلاصه مالی" },
      { status: 500 }
    );
  }
}

/**
 * Demo accounting summary data for when database is not available (Vercel)
 */
function getDemoSummary() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sales = DEMO_SALES.filter(
    (s) => s.createdAt >= thirtyDaysAgo && s.status === "completed"
  );
  const totalIncome30 = sales.reduce((s, x) => s + x.total, 0);

  const expenses = DEMO_EXPENSES.filter((e) => e.date >= thirtyDaysAgo);
  const totalExpenses30 = expenses.reduce((s, x) => s + x.amount, 0);

  const expensesByCategory: Record<string, number> = {};
  for (const c of EXPENSE_CATEGORIES) expensesByCategory[c] = 0;
  for (const e of expenses) {
    const key = EXPENSE_CATEGORIES.includes(e.category) ? e.category : "other";
    expensesByCategory[key] += e.amount;
  }

  const totalCashboxBalance = DEMO_CASHBOXES.reduce((s, c) => s + c.balance, 0);

  const daily: { date: string; income: number; expenses: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayIncome = sales
      .filter((s) => s.createdAt >= dayStart && s.createdAt < dayEnd)
      .reduce((sum, s) => sum + s.total, 0);
    const dayExpenses = expenses
      .filter((e) => e.date >= dayStart && e.date < dayEnd)
      .reduce((sum, e) => sum + e.amount, 0);
    daily.push({ date: dayStart.toISOString(), income: dayIncome, expenses: dayExpenses });
  }

  const branchSales: Record<string, number> = {};
  for (const s of sales) {
    branchSales[s.branchId] = (branchSales[s.branchId] || 0) + s.total;
  }
  const branchPerformance = DEMO_BRANCHES.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    isWarehouse: b.isWarehouse,
    isMain: b.isMain,
    sales: branchSales[b.id] || 0,
  }));

  const netProfit = totalIncome30 - totalExpenses30;
  const profitMargin =
    totalIncome30 > 0 ? Math.round((netProfit / totalIncome30) * 1000) / 10 : 0;

  return {
    kpis: {
      totalIncome30,
      totalExpenses30,
      netProfit,
      profitMargin,
      totalCashboxBalance,
      salesCount30: sales.length,
    },
    cashboxes: DEMO_CASHBOXES.map((c) => ({
      id: c.id,
      name: c.name,
      balance: c.balance,
      status: c.status,
      branch: { id: c.branchId, name: DEMO_BRANCHES.find((b) => b.id === c.branchId)?.name || "شعبه" },
    })),
    expensesByCategory: Object.entries(expensesByCategory)
      .filter(([, v]) => v > 0)
      .map(([category, amount]) => ({ category, amount })),
    daily,
    branchPerformance,
  };
}
