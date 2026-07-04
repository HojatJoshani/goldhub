import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const VALID_KARATS = ["999", "916", "750", "585", "417", "375"];
const VALID_MAKING_TYPES = ["per_gram", "flat", "percent"];
const VALID_STATUSES = ["active", "inactive", "discontinued"];

export async function GET(
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

    const product = await db.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        stockMoves: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصول" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const existing = await db.product.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Build update payload with validation
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.barcode !== undefined)
      data.barcode = body.barcode ? String(body.barcode).trim() : null;
    if (body.description !== undefined)
      data.description = body.description
        ? String(body.description).trim()
        : null;
    if (body.categoryId !== undefined)
      data.categoryId = body.categoryId || null;
    if (body.branchId !== undefined) data.branchId = body.branchId || null;
    if (body.karat !== undefined && VALID_KARATS.includes(String(body.karat)))
      data.karat = String(body.karat);
    if (body.weight !== undefined && !isNaN(Number(body.weight)))
      data.weight = Number(body.weight);
    if (
      body.makingCharge !== undefined &&
      !isNaN(Number(body.makingCharge))
    )
      data.makingCharge = Number(body.makingCharge);
    if (
      body.makingType !== undefined &&
      VALID_MAKING_TYPES.includes(body.makingType)
    )
      data.makingType = body.makingType;
    if (
      body.stoneWeight !== undefined &&
      !isNaN(Number(body.stoneWeight))
    )
      data.stoneWeight = Number(body.stoneWeight);
    if (body.stoneCost !== undefined && !isNaN(Number(body.stoneCost)))
      data.stoneCost = Number(body.stoneCost);
    if (
      body.purchasePrice !== undefined &&
      !isNaN(Number(body.purchasePrice))
    )
      data.purchasePrice = Number(body.purchasePrice);
    if (body.salePrice !== undefined && !isNaN(Number(body.salePrice)))
      data.salePrice = Number(body.salePrice);
    if (body.costPrice !== undefined && !isNaN(Number(body.costPrice)))
      data.costPrice = Number(body.costPrice);
    if (body.minStock !== undefined)
      data.minStock = parseInt(body.minStock, 10) || 0;
    if (
      body.status !== undefined &&
      VALID_STATUSES.includes(body.status)
    )
      data.status = body.status;

    // Don't allow direct stock edits here; use /stock endpoint
    // SKU is unique and shouldn't be edited directly here
    if (body.sku !== undefined && body.sku !== existing.sku) {
      const conflict = await db.product.findUnique({
        where: { sku: String(body.sku) },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: "این SKU قبلاً استفاده شده است" },
          { status: 400 }
        );
      }
      data.sku = String(body.sku).trim();
    }

    const updated = await db.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی محصول" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existing = await db.product.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    // Soft delete: mark as discontinued
    const updated = await db.product.update({
      where: { id },
      data: { status: "discontinued" },
    });

    return NextResponse.json({ success: true, id, status: updated.status });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "خطا در حذف محصول" },
      { status: 500 }
    );
  }
}
