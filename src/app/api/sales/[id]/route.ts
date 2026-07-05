import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = user.tenantId;

    const sale = await db.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        customer: { select: { id: true, name: true, phone: true } },
        cashier: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, address: true, phone: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "فروش یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerId: sale.customerId,
      cashierId: sale.cashierId,
      branchId: sale.branchId,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      makingTotal: sale.makingTotal,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      status: sale.status,
      notes: sale.notes,
      createdAt: sale.createdAt,
      items: sale.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        karat: it.karat,
        weight: it.weight,
        makingCharge: it.makingCharge,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        total: it.total,
      })),
      customer: sale.customer,
      cashier: sale.cashier,
      branch: sale.branch,
    });
  } catch (error) {
    console.error("Sale GET by id error:", error);
    return NextResponse.json({ error: "خطا در دریافت فاکتور" }, { status: 500 });
  }
}
