import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

interface TransferItemInput {
  productId: string;
  name: string;
  qty: number;
}

/** GET /api/transfers — list transfers for the tenant */
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
    const status = searchParams.get("status") || "";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "50", 10),
      200
    );

    const where: { tenantId: string; status?: string } = { tenantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      db.transfer.findMany({
        where,
        include: {
          fromBranch: { select: { id: true, name: true, code: true } },
          toBranch: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.transfer.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((t) => {
        let parsedItems: TransferItemInput[] = [];
        try {
          parsedItems = JSON.parse(t.itemsJson || "[]") as TransferItemInput[];
        } catch {
          parsedItems = [];
        }
        return {
          id: t.id,
          reference: t.reference,
          status: t.status,
          notes: t.notes,
          items: parsedItems,
          itemsCount: parsedItems.reduce((s, i) => s + (i.qty || 0), 0),
          fromBranch: t.fromBranch,
          toBranch: t.toBranch,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      }),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Transfers GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست انتقالات" },
      { status: 500 }
    );
  }
}

/** POST /api/transfers — create a new transfer */
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
      fromBranchId,
      toBranchId,
      items: rawItems,
      notes,
    } = body || {};

    if (!fromBranchId || !toBranchId) {
      return NextResponse.json(
        { error: "شعبه مبدا و مقصد الزامی است" },
        { status: 400 }
      );
    }
    if (fromBranchId === toBranchId) {
      return NextResponse.json(
        { error: "شعبه مبدا و مقصد نمی‌توانند یکسان باشند" },
        { status: 400 }
      );
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک کالا برای انتقال لازم است" },
        { status: 400 }
      );
    }

    // Verify both branches belong to tenant
    const [fromBranch, toBranch] = await Promise.all([
      db.branch.findFirst({ where: { id: fromBranchId, tenantId } }),
      db.branch.findFirst({ where: { id: toBranchId, tenantId } }),
    ]);
    if (!fromBranch || !toBranch) {
      return NextResponse.json(
        { error: "شعبه مبدا یا مقصد یافت نشد" },
        { status: 400 }
      );
    }

    // Normalize items
    const items: TransferItemInput[] = [];
    for (const it of rawItems) {
      if (!it || typeof it.productId !== "string") continue;
      const qty = Math.max(parseInt(String(it.qty || "1"), 10) || 1, 1);
      if (!it.name || typeof it.name !== "string") continue;
      items.push({ productId: it.productId, name: it.name, qty });
    }
    if (items.length === 0) {
      return NextResponse.json(
        { error: "اقلام انتقال نامعتبر است" },
        { status: 400 }
      );
    }

    const reference = `TR-${Date.now().toString().slice(-8)}${Math.floor(
      Math.random() * 90 + 10
    )}`;

    const transfer = await db.transfer.create({
      data: {
        tenantId,
        fromBranchId,
        toBranchId,
        reference,
        status: "pending",
        itemsJson: JSON.stringify(items),
        notes: notes?.trim() || null,
      },
      include: {
        fromBranch: { select: { id: true, name: true, code: true } },
        toBranch: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(
      {
        id: transfer.id,
        reference: transfer.reference,
        status: transfer.status,
        notes: transfer.notes,
        items,
        itemsCount: items.reduce((s, i) => s + i.qty, 0),
        fromBranch: transfer.fromBranch,
        toBranch: transfer.toBranch,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transfers POST API error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد انتقال" },
      { status: 500 }
    );
  }
}
