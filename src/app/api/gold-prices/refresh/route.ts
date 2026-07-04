import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { fetchLiveGoldPrices } from "@/lib/gold-price";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }

    // Fetch live prices
    const data = await fetchLiveGoldPrices();

    // Save to database for this tenant
    const saved: {
      id: string;
      karat: string;
      pricePerGram: number;
      currency: string;
      source: string;
      tenantId: string;
      createdAt: Date;
    }[] = [];
    for (const price of data.prices) {
      const record = await db.goldPrice.create({
        data: {
          tenantId: user.tenantId,
          karat: price.karat,
          pricePerGram: price.pricePerGram,
          currency: "IRR",
          source: `live:manual-refresh`,
        },
      });
      saved.push(record);
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "update",
        entity: "GoldPrice",
        details: JSON.stringify({
          count: saved.length,
          source: "live-refresh",
        }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${saved.length} قیمت طلا با موفقیت به‌روزرسانی شد`,
      prices: data.prices,
      coins: data.coins,
      ounce: data.ounce,
      dollar: data.dollar,
      fetchedAt: data.fetchedAt,
      source: data.source,
    });
  } catch (error) {
    console.error("Gold price refresh API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی قیمت طلا" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
