import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_CASHBOXES, DEMO_BRANCHES } from "@/lib/demo-data";

const VALID_TX_TYPES = ["sale", "expense", "deposit", "withdrawal", "transfer"];
const VALID_METHODS = ["cash", "card", "transfer"];

/** GET /api/accounting/cashbox — list cashboxes for tenant with transactions */
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

    const { searchParams } = new URL(req.url);
    const cashboxId = searchParams.get("cashboxId");

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoCashboxes(cashboxId));
    }

    try {
      if (cashboxId) {
        // Return a single cashbox with its recent transactions
        const cashbox = await db.cashbox.findFirst({
          where: { id: cashboxId, tenantId },
          include: {
            branch: { select: { id: true, name: true, code: true } },
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 100,
            },
          },
        });
        if (!cashbox) {
          return NextResponse.json(
            { error: "صندوق یافت نشد" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          id: cashbox.id,
          name: cashbox.name,
          balance: cashbox.balance,
          openingBalance: cashbox.openingBalance,
          closingBalance: cashbox.closingBalance,
          status: cashbox.status,
          openedAt: cashbox.openedAt,
          closedAt: cashbox.closedAt,
          branch: cashbox.branch,
          transactions: cashbox.transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            method: t.method,
            description: t.description,
            refId: t.refId,
            createdAt: t.createdAt,
          })),
        });
      }

      const cashboxes = await db.cashbox.findMany({
        where: { tenantId },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          _count: { select: { transactions: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      });

      return NextResponse.json({
        items: cashboxes.map((c) => ({
          id: c.id,
          name: c.name,
          balance: c.balance,
          openingBalance: c.openingBalance,
          closingBalance: c.closingBalance,
          status: c.status,
          openedAt: c.openedAt,
          closedAt: c.closedAt,
          branch: c.branch,
          transactionsCount: c._count.transactions,
        })),
        total: cashboxes.length,
        totalBalance: cashboxes.reduce((s, c) => s + c.balance, 0),
      });
    } catch (dbError) {
      console.error("Cashbox DB error, using demo:", dbError);
      return NextResponse.json(getDemoCashboxes(cashboxId));
    }
  } catch (error) {
    console.error("Cashbox GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت صندوق‌ها" },
      { status: 500 }
    );
  }
}

/**
 * Demo cashboxes data for when database is not available (Vercel)
 */
function getDemoCashboxes(cashboxId: string | null) {
  if (cashboxId) {
    const cb = DEMO_CASHBOXES.find((c) => c.id === cashboxId);
    if (!cb) {
      return { error: "صندوق یافت نشد" };
    }
    return {
      id: cb.id,
      name: cb.name,
      balance: cb.balance,
      openingBalance: cb.openingBalance,
      closingBalance: cb.closingBalance,
      status: cb.status,
      openedAt: cb.openedAt,
      closedAt: cb.closedAt,
      branch: { id: cb.branchId, name: DEMO_BRANCHES.find((b) => b.id === cb.branchId)?.name || "شعبه", code: "" },
      transactions: cb.transactions || [],
    };
  }

  const items = DEMO_CASHBOXES.map((c) => ({
    id: c.id,
    name: c.name,
    balance: c.balance,
    openingBalance: c.openingBalance,
    closingBalance: c.closingBalance,
    status: c.status,
    openedAt: c.openedAt,
    closedAt: c.closedAt,
    branch: { id: c.branchId, name: DEMO_BRANCHES.find((b) => b.id === c.branchId)?.name || "شعبه", code: "" },
    transactionsCount: 0,
  }));
  return {
    items,
    total: items.length,
    totalBalance: items.reduce((s, c) => s + c.balance, 0),
  };
}

/** POST /api/accounting/cashbox — multi-action (create/open/close/transaction) */
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
    const action = body?.action as string;

    // ---------- Create new cashbox ----------
    if (action === "create") {
      const { name, branchId, openingBalance = 0 } = body || {};
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "نام صندوق الزامی است" },
          { status: 400 }
        );
      }
      // Resolve branch
      let resolvedBranchId = branchId;
      if (!resolvedBranchId) {
        const firstBranch = await db.branch.findFirst({
          where: { tenantId },
          orderBy: { createdAt: "asc" },
        });
        if (!firstBranch) {
          return NextResponse.json(
            { error: "هیچ شعبه‌ای ثبت نشده است" },
            { status: 400 }
          );
        }
        resolvedBranchId = firstBranch.id;
      } else {
        const branch = await db.branch.findFirst({
          where: { id: resolvedBranchId, tenantId },
        });
        if (!branch) {
          return NextResponse.json(
            { error: "شعبه یافت نشد" },
            { status: 400 }
          );
        }
      }
      const opening = Math.max(0, Number(openingBalance) || 0);
      const cashbox = await db.cashbox.create({
        data: {
          tenantId,
          branchId: resolvedBranchId,
          name: name.trim(),
          balance: opening,
          openingBalance: opening,
          status: "open",
          openedAt: new Date(),
        },
        include: {
          branch: { select: { id: true, name: true, code: true } },
        },
      });
      return NextResponse.json(
        {
          id: cashbox.id,
          name: cashbox.name,
          balance: cashbox.balance,
          openingBalance: cashbox.openingBalance,
          status: cashbox.status,
          openedAt: cashbox.openedAt,
          branch: cashbox.branch,
        },
        { status: 201 }
      );
    }

    // ---------- Open a closed cashbox ----------
    if (action === "open") {
      const { cashboxId, openingBalance = 0 } = body || {};
      if (!cashboxId) {
        return NextResponse.json(
          { error: "شناسه صندوق الزامی است" },
          { status: 400 }
        );
      }
      const cashbox = await db.cashbox.findFirst({
        where: { id: cashboxId, tenantId },
      });
      if (!cashbox) {
        return NextResponse.json(
          { error: "صندوق یافت نشد" },
          { status: 404 }
        );
      }
      if (cashbox.status === "open") {
        return NextResponse.json(
          { error: "صندوق هم‌اکنون باز است" },
          { status: 400 }
        );
      }
      const opening = Math.max(0, Number(openingBalance) || 0);
      const updated = await db.cashbox.update({
        where: { id: cashboxId },
        data: {
          status: "open",
          openedAt: new Date(),
          closedAt: null,
          openingBalance: opening,
          balance: opening,
          closingBalance: 0,
        },
      });
      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        balance: updated.balance,
        openingBalance: updated.openingBalance,
        openedAt: updated.openedAt,
      });
    }

    // ---------- Close an open cashbox ----------
    if (action === "close") {
      const { cashboxId } = body || {};
      if (!cashboxId) {
        return NextResponse.json(
          { error: "شناسه صندوق الزامی است" },
          { status: 400 }
        );
      }
      const cashbox = await db.cashbox.findFirst({
        where: { id: cashboxId, tenantId },
      });
      if (!cashbox) {
        return NextResponse.json(
          { error: "صندوق یافت نشد" },
          { status: 404 }
        );
      }
      if (cashbox.status === "closed") {
        return NextResponse.json(
          { error: "صندوق هم‌اکنون بسته است" },
          { status: 400 }
        );
      }
      const updated = await db.cashbox.update({
        where: { id: cashboxId },
        data: {
          status: "closed",
          closedAt: new Date(),
          closingBalance: cashbox.balance,
        },
      });
      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        balance: updated.balance,
        closingBalance: updated.closingBalance,
        closedAt: updated.closedAt,
      });
    }

    // ---------- Add a transaction ----------
    if (action === "transaction") {
      const {
        cashboxId,
        type,
        amount,
        method = "cash",
        description,
      } = body || {};
      if (!cashboxId) {
        return NextResponse.json(
          { error: "شناسه صندوق الزامی است" },
          { status: 400 }
        );
      }
      if (!VALID_TX_TYPES.includes(type)) {
        return NextResponse.json(
          { error: "نوع تراکنش نامعتبر است" },
          { status: 400 }
        );
      }
      const amt = Number(amount);
      if (!amt || amt <= 0 || isNaN(amt)) {
        return NextResponse.json(
          { error: "مبلغ تراکنش باید عددی مثبت باشد" },
          { status: 400 }
        );
      }
      const txMethod = VALID_METHODS.includes(method) ? method : "cash";

      const cashbox = await db.cashbox.findFirst({
        where: { id: cashboxId, tenantId },
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

      // deposit / sale / transfer_in → balance += amount
      // expense / withdrawal → balance -= amount
      const delta = ["deposit", "sale", "transfer"].includes(type)
        ? amt
        : -amt;

      const result = await db.$transaction(async (tx) => {
        const txRec = await tx.cashboxTransaction.create({
          data: {
            cashboxId,
            type,
            amount: amt,
            method: txMethod,
            description: description?.trim() || null,
          },
        });
        const updatedCashbox = await tx.cashbox.update({
          where: { id: cashboxId },
          data: { balance: { increment: delta } },
        });
        return { txRec, updatedCashbox };
      });

      return NextResponse.json(
        {
          id: result.txRec.id,
          type: result.txRec.type,
          amount: result.txRec.amount,
          method: result.txRec.method,
          description: result.txRec.description,
          createdAt: result.txRec.createdAt,
          balance: result.updatedCashbox.balance,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "اکشن نامعتبر است" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Cashbox POST API error:", error);
    return NextResponse.json(
      { error: "خطا در عملیات صندوق" },
      { status: 500 }
    );
  }
}
