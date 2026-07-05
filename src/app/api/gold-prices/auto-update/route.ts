import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchLiveGoldPrices } from "@/lib/gold-price";

// This endpoint is called by the mini-service (gold-price-updater) to update prices
// It's protected by a simple API key for security
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const apiKey = process.env.GOLD_UPDATER_API_KEY || "goldhub-internal-updater-key";
    const expectedAuth = `Bearer ${apiKey}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    // Fetch live prices
    const data = await fetchLiveGoldPrices();

    // Save to database for ALL tenants
    const tenants = await db.tenant.findMany({ select: { id: true } });
    let totalSaved = 0;

    for (const tenant of tenants) {
      for (const price of data.prices) {
        await db.goldPrice.create({
          data: {
            tenantId: tenant.id,
            karat: price.karat,
            pricePerGram: price.pricePerGram,
            currency: "IRR",
            source: `auto:${data.source}`,
          },
        });
        totalSaved++;
      }
    }

    console.log(`[auto-update] ${totalSaved} prices saved for ${tenants.length} tenants`);

    return NextResponse.json({
      success: true,
      message: `${totalSaved} قیمت برای ${tenants.length} مستاجر ذخیره شد`,
      tenantsCount: tenants.length,
      totalSaved,
      prices: data.prices.map((p) => ({
        karat: p.karat,
        price: p.pricePerGram,
      })),
      fetchedAt: data.fetchedAt,
    });
  } catch (error) {
    console.error("Auto-update gold prices error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی خودکار" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
