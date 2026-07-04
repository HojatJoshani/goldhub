import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const VALID_TYPES = [
  "purchase",
  "sale",
  "transfer_in",
  "transfer_out",
  "adjustment",
  "return",
];

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

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const fromDate = url.searchParams.get("from");
    const toDate = url.searchParams.get("to");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
    );

    const where: Prisma.StockMovementWhereInput = { tenantId };
    if (productId) where.productId = productId;
    if (type && VALID_TYPES.includes(type)) where.type = type;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        const d = new Date(fromDate);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (toDate) {
        const d = new Date(toDate);
        if (!isNaN(d.getTime())) {
          // include the entire "to" day
          d.setHours(23, 59, 59, 999);
          where.createdAt.lte = d;
        }
      }
    }

    const [total, items] = await Promise.all([
      db.stockMovement.count({ where }),
      db.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true, karat: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("Stock movements GET error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت حرکات انبار" },
      { status: 500 }
    );
  }
}
