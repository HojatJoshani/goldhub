import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_PRODUCTS } from "@/lib/demo-data";

// چاپ بارکد محصولات
// Generate barcode data for printing

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productIds = searchParams.get("ids")?.split(",") || [];
    const all = searchParams.get("all") === "true";

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoBarcodes(productIds, all));
    }

    try {
      let where: { tenantId: string; status: string; id?: { in: string[] } } = {
        tenantId: user.tenantId,
        status: "active",
      };

      if (!all && productIds.length > 0) {
        where.id = { in: productIds };
      }

      const products = await db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          barcode: true,
          sku: true,
          karat: true,
          weight: true,
          salePrice: true,
        },
        take: all ? 500 : 100,
        orderBy: { name: "asc" },
      });

      // Filter products that have barcodes
      const withBarcodes = products.filter((p) => p.barcode);

      return NextResponse.json({
        success: true,
        products: withBarcodes,
        count: withBarcodes.length,
      });
    } catch (dbError) {
      console.error("Barcode DB error, using demo:", dbError);
      return NextResponse.json(getDemoBarcodes(productIds, all));
    }
  } catch (error) {
    console.error("Barcode API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت بارکدها" },
      { status: 500 }
    );
  }
}

/**
 * Demo barcodes data for when database is not available (Vercel)
 */
function getDemoBarcodes(productIds: string[], all: boolean) {
  let products = DEMO_PRODUCTS.filter((p) => p.barcode);
  if (!all && productIds.length > 0) {
    products = products.filter((p) => productIds.includes(p.id));
  }
  const withBarcodes = products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    sku: p.sku,
    karat: p.karat,
    weight: p.weight,
    salePrice: p.salePrice,
  }));
  return {
    success: true,
    products: withBarcodes,
    count: withBarcodes.length,
  };
}

export const dynamic = "force-dynamic";
