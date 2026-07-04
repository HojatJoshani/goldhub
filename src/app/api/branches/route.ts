import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

/** GET /api/branches — list branches for the tenant with counts */
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

    const branches = await db.branch.findMany({
      where: { tenantId },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            sales: true,
            cashboxes: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        address: b.address,
        phone: b.phone,
        isWarehouse: b.isWarehouse,
        isMain: b.isMain,
        status: b.status,
        createdAt: b.createdAt,
        usersCount: b._count.users,
        productsCount: b._count.products,
        salesCount: b._count.sales,
        cashboxesCount: b._count.cashboxes,
      })),
      total: branches.length,
    });
  } catch (error) {
    console.error("Branches GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست شعبات" },
      { status: 500 }
    );
  }
}

/** POST /api/branches — create a new branch */
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
    const {
      name,
      code,
      address,
      phone,
      isWarehouse = false,
      isMain = false,
      status = "active",
    } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "نام شعبه الزامی است" },
        { status: 400 }
      );
    }

    // Generate a code if not provided
    let branchCode = (code || "").trim();
    if (!branchCode) {
      const existing = await db.branch.count({ where: { tenantId } });
      const prefix = isWarehouse ? "WH" : "BR";
      branchCode = `${prefix}-${String(existing + 1).padStart(3, "0")}`;
    }

    // Ensure code uniqueness within tenant
    const existingByCode = await db.branch.findFirst({
      where: { tenantId, code: branchCode },
    });
    if (existingByCode) {
      return NextResponse.json(
        { error: "کد شعبه تکراری است" },
        { status: 409 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      // If new branch is main, demote other main branches
      if (isMain) {
        await tx.branch.updateMany({
          where: { tenantId, isMain: true },
          data: { isMain: false },
        });
      }
      return tx.branch.create({
        data: {
          tenantId,
          name: name.trim(),
          code: branchCode,
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          isWarehouse: Boolean(isWarehouse),
          isMain: Boolean(isMain),
          status: status || "active",
        },
      });
    });

    return NextResponse.json(
      {
        id: result.id,
        name: result.name,
        code: result.code,
        address: result.address,
        phone: result.phone,
        isWarehouse: result.isWarehouse,
        isMain: result.isMain,
        status: result.status,
        createdAt: result.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Branches POST API error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد شعبه" },
      { status: 500 }
    );
  }
}
