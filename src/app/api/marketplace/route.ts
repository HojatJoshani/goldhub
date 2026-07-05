import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const VALID_KARATS = ["999", "916", "750", "585", "417", "375"];
const VALID_SORTS = ["price_asc", "price_desc", "newest", "popular"];

/**
 * Deterministic pseudo-random in [0,1) seeded by a string.
 * Used so each product gets a stable simulated rating & reviewCount
 * (so the UI doesn't flicker between requests for the same product).
 */
function seededRandom(seedStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to uint32 then to [0,1)
  const u = h >>> 0;
  return u / 4294967296;
}

function simulatedRating(id: string): number {
  // 4.0 - 5.0 with one decimal
  const r = 4 + seededRandom("rate:" + id);
  return Math.round(r * 10) / 10;
}

function simulatedReviewCount(id: string): number {
  // 1 - 120
  return 1 + Math.floor(seededRandom("rev:" + id) * 120);
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
    const branchId = url.searchParams.get("branchId") || undefined;
    const sort = url.searchParams.get("sort") || "newest";
    const minPriceRaw = url.searchParams.get("minPrice");
    const maxPriceRaw = url.searchParams.get("maxPrice");
    const minWeightRaw = url.searchParams.get("minWeight");
    const maxWeightRaw = url.searchParams.get("maxWeight");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      60,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "12", 10))
    );

    const minPrice = minPriceRaw ? Number(minPriceRaw) : null;
    const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null;
    const minWeight = minWeightRaw ? Number(minWeightRaw) : null;
    const maxWeight = maxWeightRaw ? Number(maxWeightRaw) : null;

    void VALID_SORTS; // referenced for documentation; sort validated below

    // Marketplace shows only active products that are in stock
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: "active",
      stock: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (karat && VALID_KARATS.includes(karat)) where.karat = karat;
    if (branchId) where.branchId = branchId;

    // Price range filter
    const salePriceFilter: { gte?: number; lte?: number } = {};
    if (minPrice !== null && !isNaN(minPrice)) salePriceFilter.gte = minPrice;
    if (maxPrice !== null && !isNaN(maxPrice)) salePriceFilter.lte = maxPrice;
    if (Object.keys(salePriceFilter).length > 0)
      where.salePrice = salePriceFilter;

    // Weight range filter
    const weightFilter: { gte?: number; lte?: number } = {};
    if (minWeight !== null && !isNaN(minWeight)) weightFilter.gte = minWeight;
    if (maxWeight !== null && !isNaN(maxWeight)) weightFilter.lte = maxWeight;
    if (Object.keys(weightFilter).length > 0) where.weight = weightFilter;

    // Determine sort order. `popular` is approximated using simulated review
    // counts which are derived in JS — so we fetch then re-sort in JS.
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === "price_asc"
        ? [{ salePrice: "asc" }]
        : sort === "price_desc"
          ? [{ salePrice: "desc" }]
          : sort === "popular"
            ? [{ salePrice: "desc" }] // placeholder, re-sorted in JS
            : [{ createdAt: "desc" }];

    const [total, rawItems, categories, branches] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: { category: true, branch: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.category.findMany({
        where: { tenantId },
        include: { _count: { select: { products: { where } } } },
        orderBy: { name: "asc" },
      }),
      db.branch.findMany({
        where: { tenantId, status: "active" },
        orderBy: { name: "asc" },
      }),
    ]);

    // Compute product counts per branch (active+in stock only) for store cards
    const branchCounts = await db.branch.findMany({
      where: { tenantId, status: "active" },
      include: { _count: { select: { products: { where } } } },
      orderBy: { name: "asc" },
    });

    // Re-sort by "popularity" (simulated reviewCount desc, then rating desc)
    let items = rawItems;
    if (sort === "popular") {
      items = [...rawItems].sort((a, b) => {
        const ra = simulatedReviewCount(a.id);
        const rb = simulatedReviewCount(b.id);
        if (rb !== ra) return rb - ra;
        return simulatedRating(b.id) - simulatedRating(a.id);
      });
    }

    // Annotate each product with simulated marketplace fields
    const enriched = items.map((p) => ({
      ...p,
      rating: simulatedRating(p.id),
      reviewCount: simulatedReviewCount(p.id),
    }));

    const stores = branchCounts.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      isMain: b.isMain,
      productCount: b._count.products,
      // store rating also simulated, seeded by branch id
      rating: Math.round((4.2 + seededRandom("store:" + b.id) * 0.8) * 10) / 10,
    }));

    // branches is currently unused beyond being fetched; keep for future use
    void branches;

    return NextResponse.json({
      items: enriched,
      total,
      page,
      pageSize,
      stores,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    console.error("Marketplace GET error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصولات ویترین" },
      { status: 500 }
    );
  }
}
