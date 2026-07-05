import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_GOLD_PRICES } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const karat = searchParams.get("karat");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: { tenantId: string; createdAt: { gte: Date }; karat?: string } = {
      tenantId: user.tenantId,
      createdAt: { gte: since },
    };
    if (karat) where.karat = karat;

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoGoldPriceHistory(days, karat));
    }

    try {
      const prices = await db.goldPrice.findMany({
        where,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          karat: true,
          pricePerGram: true,
          source: true,
          createdAt: true,
        },
      });

      // Group by karat
      const grouped: Record<string, { time: string; price: number; source: string }[]> = {};
      for (const p of prices) {
        if (!grouped[p.karat]) grouped[p.karat] = [];
        grouped[p.karat].push({
          time: p.createdAt.toISOString(),
          price: p.pricePerGram,
          source: p.source,
        });
      }

      // Calculate stats per karat
      const stats: Record<string, {
        current: number;
        min: number;
        max: number;
        avg: number;
        change: number;
        changePercent: number;
        count: number;
      }> = {};

      for (const [k, arr] of Object.entries(grouped)) {
        if (arr.length === 0) continue;
        const prices_arr = arr.map((x) => x.price);
        const current = prices_arr[prices_arr.length - 1];
        const first = prices_arr[0];
        const min = Math.min(...prices_arr);
        const max = Math.max(...prices_arr);
        const avg = Math.round(prices_arr.reduce((s, x) => s + x, 0) / prices_arr.length);
        const change = current - first;
        const changePercent = first > 0 ? Math.round((change / first) * 1000) / 10 : 0;
        stats[k] = { current, min, max, avg, change, changePercent, count: arr.length };
      }

      return NextResponse.json({
        success: true,
        days,
        history: grouped,
        stats,
        total: prices.length,
      });
    } catch (dbError) {
      console.error("Gold price history DB error, using demo:", dbError);
      return NextResponse.json(getDemoGoldPriceHistory(days, karat));
    }
  } catch (error) {
    console.error("Gold price history API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تاریخچه قیمت طلا" },
      { status: 500 }
    );
  }
}

/**
 * Demo gold price history data for when database is not available (Vercel)
 */
function getDemoGoldPriceHistory(days: number, karat: string | null) {
  // Generate synthetic history from current demo prices
  const basePrices = DEMO_GOLD_PRICES.filter((p) => !karat || p.karat === karat);
  const grouped: Record<string, { time: string; price: number; source: string }[]> = {};
  const now = new Date();

  for (const base of basePrices) {
    const arr: { time: string; price: number; source: string }[] = [];
    for (let d = days; d >= 0; d--) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      // Simulate ±2% variance around base price
      const variance = 1 + (Math.sin(d * 0.5) * 0.02);
      arr.push({
        time: date.toISOString(),
        price: Math.round(base.pricePerGram * variance),
        source: base.source,
      });
    }
    grouped[base.karat] = arr;
  }

  const stats: Record<string, {
    current: number;
    min: number;
    max: number;
    avg: number;
    change: number;
    changePercent: number;
    count: number;
  }> = {};

  for (const [k, arr] of Object.entries(grouped)) {
    if (arr.length === 0) continue;
    const prices_arr = arr.map((x) => x.price);
    const current = prices_arr[prices_arr.length - 1];
    const first = prices_arr[0];
    const min = Math.min(...prices_arr);
    const max = Math.max(...prices_arr);
    const avg = Math.round(prices_arr.reduce((s, x) => s + x, 0) / prices_arr.length);
    const change = current - first;
    const changePercent = first > 0 ? Math.round((change / first) * 1000) / 10 : 0;
    stats[k] = { current, min, max, avg, change, changePercent, count: arr.length };
  }

  const totalCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  return {
    success: true,
    days,
    history: grouped,
    stats,
    total: totalCount,
  };
}

export const dynamic = "force-dynamic";
