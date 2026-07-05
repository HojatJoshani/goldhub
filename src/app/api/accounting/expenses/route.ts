import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const VALID_CATEGORIES = [
  "rent",
  "salary",
  "utilities",
  "supplies",
  "marketing",
  "other",
];

/** GET /api/accounting/expenses — list expenses with filters */
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
    const category = searchParams.get("category") || "";
    const branchId = searchParams.get("branchId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "50", 10),
      200
    );

    const where: {
      tenantId: string;
      category?: string;
      branchId?: string;
      date?: { gte?: Date; lte?: Date };
    } = { tenantId };
    if (category) where.category = category;
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.expense.count({ where }),
    ]);

    const totalAmount = await db.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    // Manually resolve branches (Expense has no Prisma relation to Branch)
    const branchIds = Array.from(
      new Set(items.map((e) => e.branchId).filter(Boolean) as string[])
    );
    const branches =
      branchIds.length > 0
        ? await db.branch.findMany({
            where: { id: { in: branchIds } },
            select: { id: true, name: true },
          })
        : [];
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    return NextResponse.json({
      items: items.map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: e.amount,
        date: e.date,
        branchId: e.branchId,
        branch: e.branchId ? branchMap.get(e.branchId) || null : null,
        createdAt: e.createdAt,
      })),
      total,
      page,
      pageSize,
      totalAmount: totalAmount._sum.amount || 0,
    });
  } catch (error) {
    console.error("Expenses GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست هزینه‌ها" },
      { status: 500 }
    );
  }
}

/** POST /api/accounting/expenses — create a new expense */
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
    const { category, description, amount, date, branchId } = body || {};

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "دسته‌بندی هزینه نامعتبر است" },
        { status: 400 }
      );
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "توضیحات هزینه الزامی است" },
        { status: 400 }
      );
    }
    const amt = Number(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      return NextResponse.json(
        { error: "مبلغ هزینه باید عددی مثبت باشد" },
        { status: 400 }
      );
    }

    // Validate branch if provided
    let resolvedBranchId: string | null = branchId || null;
    if (resolvedBranchId) {
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

    let expenseDate = new Date();
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) expenseDate = parsed;
    }

    const expense = await db.expense.create({
      data: {
        tenantId,
        branchId: resolvedBranchId,
        category,
        description: description.trim(),
        amount: amt,
        date: expenseDate,
      },
    });

    // Manually resolve branch (no Prisma relation on Expense)
    let branchInfo: { id: string; name: string } | null = null;
    if (expense.branchId) {
      const b = await db.branch.findUnique({
        where: { id: expense.branchId },
        select: { id: true, name: true },
      });
      if (b) branchInfo = b;
    }

    return NextResponse.json(
      {
        id: expense.id,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        branchId: expense.branchId,
        branch: branchInfo,
        createdAt: expense.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Expenses POST API error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت هزینه" },
      { status: 500 }
    );
  }
}

/** DELETE /api/accounting/expenses?id=... — delete an expense */
export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "شناسه هزینه الزامی است" },
        { status: 400 }
      );
    }

    const expense = await db.expense.findFirst({
      where: { id, tenantId },
    });
    if (!expense) {
      return NextResponse.json(
        { error: "هزینه یافت نشد" },
        { status: 404 }
      );
    }

    await db.expense.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Expenses DELETE API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف هزینه" },
      { status: 500 }
    );
  }
}
