import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";

// مرجوعی کالا - Product Returns
// Handles sale returns/refunds with stock restoration

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoReturns(page, pageSize));
    }

    try {
      // Get refunded sales (sales with status "refunded" or "void")
      const [returns, total] = await Promise.all([
        db.sale.findMany({
          where: {
            tenantId: user.tenantId,
            status: { in: ["refunded", "void"] },
          },
          include: {
            customer: { select: { name: true, phone: true } },
            cashier: { select: { name: true } },
            items: true,
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.sale.count({
          where: {
            tenantId: user.tenantId,
            status: { in: ["refunded", "void"] },
          },
        }),
      ]);

      // Summary stats
      const totalRefundAmount = returns.reduce((s, r) => s + r.total, 0);
      const totalRefundCount = total;

      return NextResponse.json({
        success: true,
        items: returns,
        total,
        page,
        pageSize,
        stats: {
          totalRefundAmount,
          totalRefundCount,
          avgRefundAmount: totalRefundCount > 0 ? totalRefundAmount / totalRefundCount : 0,
        },
      });
    } catch (dbError) {
      console.error("Returns DB error, using demo:", dbError);
      return NextResponse.json(getDemoReturns(page, pageSize));
    }
  } catch (error) {
    console.error("Returns API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت مرجوعی‌ها" },
      { status: 500 }
    );
  }
}

/**
 * Demo returns data for when database is not available (Vercel)
 */
function getDemoReturns(page: number, pageSize: number) {
  // Returns are empty in demo (no refunds in demo sales)
  return {
    success: true,
    items: [],
    total: 0,
    page,
    pageSize,
    stats: {
      totalRefundAmount: 0,
      totalRefundCount: 0,
      avgRefundAmount: 0,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await req.json();
    const { saleId, reason, restoreStock = true } = body;

    if (!saleId) {
      return NextResponse.json(
        { error: "شناسه فروش الزامی است" },
        { status: 400 }
      );
    }

    const sale = await db.sale.findFirst({
      where: { id: saleId, tenantId: user.tenantId },
      include: { items: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "فروش یافت نشد" },
        { status: 404 }
      );
    }

    if (sale.status === "refunded") {
      return NextResponse.json(
        { error: "این فروش قبلاً مرجوع شده است" },
        { status: 400 }
      );
    }

    // Use transaction for atomic operation
    const result = await db.$transaction(async (tx) => {
      // Update sale status to refunded
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "refunded",
          notes: `مرجوعی: ${reason || "بدون دلیل"}`,
        },
      });

      // Restore stock if requested
      if (restoreStock) {
        for (const item of sale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });

          // Create stock movement for return
          await tx.stockMovement.create({
            data: {
              tenantId: user.tenantId,
              productId: item.productId,
              type: "return",
              quantity: item.quantity, // positive = stock in
              reason: `مرجوعی فاکتور ${sale.invoiceNumber}`,
              refId: sale.id,
            },
          });
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "update",
          entity: "Sale",
          entityId: sale.id,
          details: JSON.stringify({
            action: "refund",
            invoiceNumber: sale.invoiceNumber,
            reason,
            restoreStock,
            amount: sale.total,
          }),
          ip: req.headers.get("x-forwarded-for") || "unknown",
        },
      });

      return updatedSale;
    });

    return NextResponse.json({
      success: true,
      message: "مرجوعی با موفقیت ثبت شد",
      sale: result,
    });
  } catch (error) {
    console.error("Return create API error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت مرجوعی" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
