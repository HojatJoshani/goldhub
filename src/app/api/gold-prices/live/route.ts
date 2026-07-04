import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { fetchLiveGoldPrices } from "@/lib/gold-price";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }

    const data = await fetchLiveGoldPrices();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Live gold price API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت قیمت زنده طلا" },
      { status: 500 }
    );
  }
}

// Force dynamic to ensure fresh data
export const dynamic = "force-dynamic";
