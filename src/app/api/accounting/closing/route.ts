import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

/** POST /api/accounting/closing — perform daily closing on a cashbox */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;

    const body = await req.json();
    const { cashboxId } = body || {};
    if (!cashboxId) {
      return NextResponse.json(
        { error: "شناسه صندوق الزامی است" },
        { status: 400 }
      );
    }

    const cashbox = await db.cashbox.findFirst({
      where: { id: cashboxId, tenantId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    if (!cashbox) {
      return NextResponse.json(
        { error: "صندوق یافت نشد" },
        { status: 404 }
      );
    }
    if (cashbox.status !== "open") {
      return NextResponse.json(
        { error: "صندوق بسته است؛ ابتدا آن را باز کنید" },
        { status: 400 }
      );
    }

    // Today's window for this cashbox's branch
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Determine effective window: from openedAt (today) until now
    const windowStart =
      cashbox.openedAt && cashbox.openedAt > dayStart
        ? cashbox.openedAt
        : dayStart;

    // Sales for branch today (income)
    const todaySales = await db.sale.findMany({
      where: {
        tenantId,
        branchId: cashbox.branchId,
        status: "completed",
        createdAt: { gte: windowStart, lt: dayEnd },
      },
      select: { total: true, paymentMethod: true, invoiceNumber: true },
    });
    const salesTotal = todaySales.reduce((s, x) => s + x.total, 0);

    // Expenses for branch today (outcome)
    const todayExpenses = await db.expense.findMany({
      where: {
        tenantId,
        branchId: cashbox.branchId,
        date: { gte: windowStart, lt: dayEnd },
      },
      select: { amount: true, category: true, description: true },
    });
    const expensesTotal = todayExpenses.reduce((s, x) => s + x.amount, 0);

    // Cashbox transactions today (already recorded)
    const cashboxTransactions = await db.cashboxTransaction.findMany({
      where: {
        cashboxId,
        createdAt: { gte: windowStart, lt: dayEnd },
      },
      select: { type: true, amount: true },
    });
    const txIncome = cashboxTransactions
      .filter((t) => ["deposit", "sale", "transfer"].includes(t.type))
      .reduce((s, t) => s + t.amount, 0);
    const txOutcome = cashboxTransactions
      .filter((t) => ["expense", "withdrawal"].includes(t.type))
      .reduce((s, t) => s + t.amount, 0);

    const openingBalance = cashbox.openingBalance || 0;
    const closingBalance = cashbox.balance;
    const expectedBalance = openingBalance + salesTotal + txIncome - expensesTotal - txOutcome;

    // Close the cashbox
    const updated = await db.cashbox.update({
      where: { id: cashboxId },
      data: {
        status: "closed",
        closedAt: now,
        closingBalance,
      },
    });

    return NextResponse.json({
      cashbox: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        closedAt: updated.closedAt,
        openingBalance,
        closingBalance,
        branch: cashbox.branch,
      },
      summary: {
        salesCount: todaySales.length,
        salesTotal,
        expensesCount: todayExpenses.length,
        expensesTotal,
        cashboxIncome: txIncome,
        cashboxOutcome: txOutcome,
        expectedBalance,
        actualBalance: closingBalance,
        difference: Math.round((closingBalance - expectedBalance) * 100) / 100,
      },
      sales: todaySales.map((s) => ({
        invoiceNumber: s.invoiceNumber,
        total: s.total,
        paymentMethod: s.paymentMethod,
      })),
      expenses: todayExpenses.map((e) => ({
        category: e.category,
        description: e.description,
        amount: e.amount,
      })),
    });
  } catch (error) {
    console.error("Accounting closing API error:", error);
    return NextResponse.json(
      { error: "خطا در تسویه روزانه صندوق" },
      { status: 500 }
    );
  }
}
