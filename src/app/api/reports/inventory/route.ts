import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

/** Bucket a date into aging buckets (in days) based on product.createdAt. */
function ageBucket(days: number): string {
  if (days <= 30) return "0-30";
  if (days <= 90) return "31-90";
  if (days <= 180) return "91-180";
  if (days <= 365) return "181-365";
  return "365+";
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }
    const tenantId = user.tenantId;

    // Fetch all tenant products (active only — discontinued are excluded)
    const products = await db.product.findMany({
      where: { tenantId, status: { not: "discontinued" } },
      select: {
        id: true,
        name: true,
        karat: true,
        weight: true,
        salePrice: true,
        purchasePrice: true,
        costPrice: true,
        stock: true,
        minStock: true,
        categoryId: true,
        createdAt: true,
      },
    });

    // ---- Total inventory value (purchase & retail) ----
    const purchaseValue = products.reduce(
      (s, p) => s + p.purchasePrice * p.stock,
      0
    );
    const retailValue = products.reduce(
      (s, p) => s + p.salePrice * p.stock,
      0
    );
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const totalSkus = products.length;

    // ---- Total gold weight by karat ----
    const karatMap = new Map<
      string,
      { weight: number; units: number; products: number }
    >();
    for (const p of products) {
      const entry = karatMap.get(p.karat) || {
        weight: 0,
        units: 0,
        products: 0,
      };
      entry.weight += p.weight * p.stock;
      entry.units += p.stock;
      entry.products += 1;
      karatMap.set(p.karat, entry);
    }
    const byKarat = Array.from(karatMap.entries()).map(([karat, v]) => ({
      karat,
      weight: Math.round(v.weight * 1000) / 1000,
      units: v.units,
      products: v.products,
    }));
    const totalGoldWeight = byKarat.reduce((s, k) => s + k.weight, 0);

    // ---- Stock status breakdown ----
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of products) {
      if (p.stock === 0) outOfStock += 1;
      else if (p.stock <= p.minStock) lowStock += 1;
      else inStock += 1;
    }
    const stockStatus = [
      { status: "in_stock", label: "موجود", count: inStock, color: "#10b981" },
      { status: "low_stock", label: "کم موجود", count: lowStock, color: "#f59e0b" },
      { status: "out_of_stock", label: "ناموجود", count: outOfStock, color: "#ef4444" },
    ];

    // ---- Products by category ----
    const categoryIds = Array.from(
      new Set(products.map((p) => p.categoryId).filter(Boolean) as string[])
    );
    const categories = categoryIds.length
      ? await db.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryName = (id: string | null) =>
      (id && categories.find((c) => c.id === id)?.name) || "بدون دسته";

    const categoryMap = new Map<
      string,
      { products: number; units: number; value: number }
    >();
    for (const p of products) {
      const key = p.categoryId || "uncat";
      const entry = categoryMap.get(key) || {
        products: 0,
        units: 0,
        value: 0,
      };
      entry.products += 1;
      entry.units += p.stock;
      entry.value += p.salePrice * p.stock;
      categoryMap.set(key, entry);
    }
    const byCategory = Array.from(categoryMap.entries()).map(([key, v]) => ({
      categoryId: key === "uncat" ? null : key,
      categoryName: categoryName(key === "uncat" ? null : key),
      products: v.products,
      units: v.units,
      value: v.value,
    }));

    // ---- Inventory aging (based on product.createdAt) ----
    const now = new Date();
    const agingMap = new Map<string, { units: number; value: number }>();
    for (const p of products) {
      if (p.stock === 0) continue;
      const days = Math.floor(
        (now.getTime() - p.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      const bucket = ageBucket(days);
      const entry = agingMap.get(bucket) || { units: 0, value: 0 };
      entry.units += p.stock;
      entry.value += p.purchasePrice * p.stock;
      agingMap.set(bucket, entry);
    }
    const agingOrder = ["0-30", "31-90", "91-180", "181-365", "365+"];
    const aging = agingOrder.map((bucket) => {
      const v = agingMap.get(bucket) || { units: 0, value: 0 };
      return {
        bucket,
        label: bucket.replace("-", " تا ").replace("+", " به بالا"),
        units: v.units,
        value: v.value,
      };
    });

    // ---- Top 10 highest value products (purchase * stock) ----
    const topValue = [...products]
      .map((p) => ({
        id: p.id,
        name: p.name,
        karat: p.karat,
        stock: p.stock,
        unitPrice: p.salePrice,
        weight: p.weight,
        totalValue: p.purchasePrice * p.stock,
        retailValue: p.salePrice * p.stock,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        purchaseValue,
        retailValue,
        potentialProfit: retailValue - purchaseValue,
        totalUnits,
        totalSkus,
        totalGoldWeight: Math.round(totalGoldWeight * 1000) / 1000,
        inStock,
        lowStock,
        outOfStock,
      },
      byKarat,
      stockStatus,
      byCategory,
      aging,
      topValue,
    });
  } catch (error) {
    console.error("Reports inventory API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش انبار" },
      { status: 500 }
    );
  }
}
