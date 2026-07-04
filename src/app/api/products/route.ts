import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const VALID_KARATS = ["999", "916", "750", "585", "417", "375"];
const VALID_MAKING_TYPES = ["per_gram", "flat", "percent"];

function generateSku(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GH-${code}`;
}

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
    const search = url.searchParams.get("search")?.trim() || "";
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const karat = url.searchParams.get("karat") || undefined;
    const lowStockParam = url.searchParams.get("lowStock");
    const lowStock = lowStockParam === "true" || lowStockParam === "1";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
    );

    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: { not: "discontinued" },
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (karat && VALID_KARATS.includes(karat)) where.karat = karat;

    // When filtering by low stock we need to compare stock <= minStock.
    // Prisma cannot compare two columns directly in SQLite, so we fetch
    // all matching records, filter in memory, then slice for pagination.
    if (lowStock) {
      const all = await db.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
      });
      const filtered = all.filter((p) => p.stock <= p.minStock);
      const total = filtered.length;
      const items = filtered.slice((page - 1) * pageSize, page * pageSize);
      return NextResponse.json({ items, total, page, pageSize });
    }

    const [total, items] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصولات" },
      { status: 500 }
    );
  }
}

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

    // Validate required fields
    const requiredErrors: string[] = [];
    if (!body.name || typeof body.name !== "string" || !body.name.trim())
      requiredErrors.push("نام محصول");
    if (!body.karat || !VALID_KARATS.includes(String(body.karat)))
      requiredErrors.push("عیار");
    if (
      body.weight === undefined ||
      body.weight === null ||
      isNaN(Number(body.weight))
    )
      requiredErrors.push("وزن");
    if (
      body.salePrice === undefined ||
      body.salePrice === null ||
      isNaN(Number(body.salePrice))
    )
      requiredErrors.push("قیمت فروش");

    if (requiredErrors.length > 0) {
      return NextResponse.json(
        { error: `فیلدهای الزامی ناقص: ${requiredErrors.join("، ")}` },
        { status: 400 }
      );
    }

    // Auto-generate unique SKU
    let sku = body.sku?.trim() || generateSku();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.product.findUnique({ where: { sku } });
      if (!existing) break;
      sku = generateSku();
      attempts++;
    }

    // Auto-generate barcode if missing
    const barcode =
      body.barcode?.trim() ||
      `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 90 + 10)}`;

    const makingType = VALID_MAKING_TYPES.includes(body.makingType)
      ? body.makingType
      : "per_gram";

    const initialStock = parseInt(body.stock, 10) || 0;

    const product = await db.product.create({
      data: {
        tenantId,
        branchId: body.branchId || null,
        categoryId: body.categoryId || null,
        sku,
        barcode: barcode || null,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        images: "[]",
        karat: String(body.karat),
        weight: Number(body.weight) || 0,
        makingCharge: Number(body.makingCharge) || 0,
        makingType,
        stoneWeight: Number(body.stoneWeight) || 0,
        stoneCost: Number(body.stoneCost) || 0,
        purchasePrice: Number(body.purchasePrice) || 0,
        salePrice: Number(body.salePrice) || 0,
        costPrice: Number(body.costPrice) || 0,
        stock: initialStock,
        minStock: parseInt(body.minStock, 10) || 0,
        status: body.status || "active",
      },
      include: { category: true },
    });

    // If initial stock > 0, record a purchase stock movement
    if (initialStock > 0) {
      await db.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          type: "purchase",
          quantity: initialStock,
          reason: "موجودی اولیه",
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد محصول" },
      { status: 500 }
    );
  }
}
