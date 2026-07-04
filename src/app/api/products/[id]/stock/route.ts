import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const VALID_TYPES = ["purchase", "adjustment"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;
    const { id } = await params;

    const product = await db.product.findFirst({ where: { id, tenantId } });
    if (!product) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const type = body.type;
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "نوع حرکت انبار نامعتبر است" },
        { status: 400 }
      );
    }

    const quantity = parseInt(body.quantity, 10);
    if (isNaN(quantity) || quantity === 0) {
      return NextResponse.json(
        { error: "تعداد باید عددی غیر از صفر باشد" },
        { status: 400 }
      );
    }

    const reason = body.reason?.trim() || null;

    // For "purchase" type, quantity is positive (incoming)
    // For "adjustment", quantity can be positive or negative
    let moveQuantity = quantity;
    if (type === "purchase" && quantity < 0) {
      return NextResponse.json(
        { error: "برای خرید، تعداد باید مثبت باشد" },
        { status: 400 }
      );
    }

    const newStock = product.stock + moveQuantity;
    if (newStock < 0) {
      return NextResponse.json(
        { error: "موجودی منفی امکان‌پذیر نیست" },
        { status: 400 }
      );
    }

    // Create movement and update stock atomically
    const [movement, updated] = await db.$transaction([
      db.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          type,
          quantity: moveQuantity,
          reason,
        },
      }),
      db.product.update({
        where: { id },
        data: { stock: newStock },
        include: { category: true },
      }),
    ]);

    return NextResponse.json({
      movement,
      product: updated,
    });
  } catch (error) {
    console.error("Stock movement POST error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت حرکت انبار" },
      { status: 500 }
    );
  }
}
