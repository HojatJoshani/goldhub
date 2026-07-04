import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const VALID_PAYMENT_METHODS = ["cash", "card", "transfer", "gold", "mixed"];

/** Compute making charge for a single product unit based on makingType. */
function computeMakingTotal(
  makingType: string,
  makingCharge: number,
  weight: number,
  salePrice: number
): number {
  switch (makingType) {
    case "flat":
      return makingCharge;
    case "percent":
      return (salePrice * makingCharge) / 100;
    case "per_gram":
    default:
      return makingCharge * weight;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20", 10),
      100
    );
    const paymentMethod = searchParams.get("paymentMethod") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const where: any = { tenantId };
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          cashier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customerId: s.customerId,
        cashierId: s.cashierId,
        subtotal: s.subtotal,
        discount: s.discount,
        tax: s.tax,
        makingTotal: s.makingTotal,
        total: s.total,
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        status: s.status,
        notes: s.notes,
        createdAt: s.createdAt,
        customer: s.customer,
        cashier: s.cashier,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Sales GET API error:", error);
    return NextResponse.json({ error: "خطا در دریافت لیست فروش" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const cashierId = user.id;

    // Resolve branch: user's branch or first branch of tenant
    let branchId = user.branchId;
    if (!branchId) {
      const firstBranch = await db.branch.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "asc" },
      });
      if (!firstBranch) {
        return NextResponse.json(
          { error: "هیچ شعبه‌ای برای این فروشگاه ثبت نشده است" },
          { status: 400 }
        );
      }
      branchId = firstBranch.id;
    }

    const body = await req.json();
    const {
      items: rawItems,
      customerId,
      paymentMethod,
      discount = 0,
      notes = "",
    } = body || {};

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: "سبد خرید خالی است" },
        { status: 400 }
      );
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "روش پرداخت نامعتبر است" },
        { status: 400 }
      );
    }

    // Normalize items: aggregate quantities by productId
    const qtyMap = new Map<string, number>();
    for (const it of rawItems) {
      if (!it || typeof it.productId !== "string") continue;
      const q = Math.max(parseInt(String(it.quantity || "1"), 10) || 1, 1);
      qtyMap.set(it.productId, (qtyMap.get(it.productId) || 0) + q);
    }
    if (qtyMap.size === 0) {
      return NextResponse.json(
        { error: "اقلام سبد نامعتبر است" },
        { status: 400 }
      );
    }

    const productIds = Array.from(qtyMap.keys());
    const products = await db.product.findMany({
      where: { id: { in: productIds }, tenantId },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "برخی محصولات یافت نشدند" },
        { status: 400 }
      );
    }

    // Validate stock & build line items
    type LineItem = {
      product: (typeof products)[number];
      quantity: number;
      unitPrice: number;
      makingTotal: number;
      total: number;
    };
    const lineItems: LineItem[] = [];
    for (const product of products) {
      const quantity = qtyMap.get(product.id)!;
      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `موجودی محصول «${product.name}» کافی نیست (موجودی: ${product.stock}، درخواست: ${quantity})`,
          },
          { status: 400 }
        );
      }
      const unitPrice = product.salePrice;
      const making = computeMakingTotal(
        product.makingType,
        product.makingCharge,
        product.weight,
        product.salePrice
      );
      const lineTotal = unitPrice * quantity;
      lineItems.push({
        product,
        quantity,
        unitPrice,
        makingTotal: making * quantity,
        total: lineTotal,
      });
    }

    const subtotal = lineItems.reduce((s, it) => s + it.total, 0);
    const makingTotal = lineItems.reduce((s, it) => s + it.makingTotal, 0);
    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal));
    const tax = 0; // tax handled at tenant settings if needed
    const total = Math.max(0, subtotal - safeDiscount + tax);

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}${Math.floor(
      Math.random() * 90 + 10
    )}`;

    // Execute sale + stock decrement + stock movements + customer update atomically
    const sale = await db.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          tenantId,
          branchId,
          invoiceNumber,
          customerId: customerId || null,
          cashierId,
          subtotal,
          discount: safeDiscount,
          tax,
          makingTotal,
          total,
          paymentMethod,
          paymentStatus: "paid",
          status: "completed",
          notes: notes || null,
          items: {
            create: lineItems.map((it) => ({
              productId: it.product.id,
              name: it.product.name,
              karat: it.product.karat,
              weight: it.product.weight,
              makingCharge: it.product.makingCharge,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              total: it.total,
            })),
          },
        },
        include: {
          items: true,
          customer: { select: { id: true, name: true, phone: true } },
          cashier: { select: { id: true, name: true } },
        },
      });

      // Decrement stock & create stock movements
      for (const it of lineItems) {
        await tx.product.update({
          where: { id: it.product.id },
          data: { stock: { decrement: it.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: it.product.id,
            toBranchId: branchId,
            type: "sale",
            quantity: -it.quantity,
            reason: `فروش ${invoiceNumber}`,
            refId: created.id,
          },
        });
      }

      // Update customer stats if provided
      if (customerId) {
        const loyaltyPoints = Math.floor(total / 100000);
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: { increment: total },
            totalOrders: { increment: 1 },
            loyaltyPoints: { increment: loyaltyPoints },
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
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
        items: sale.items,
        customer: sale.customer,
        cashier: sale.cashier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sales POST API error:", error);
    return NextResponse.json({ error: "خطا در ثبت فروش" }, { status: 500 });
  }
}
