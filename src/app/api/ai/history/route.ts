import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

const TYPE_LABELS: Record<string, string> = {
  text_query: "پرسش متنی",
  ocr_scan: "اسکن فاکتور",
  image_recognition: "تشخیص محصول",
};

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

    const records = await db.aIQuery.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        input: true,
        output: true,
        createdAt: true,
        meta: true,
      },
    });

    const items = records.map((r) => ({
      id: r.id,
      type: r.type,
      typeLabel: TYPE_LABELS[r.type] || r.type,
      input:
        r.input === "[image]"
          ? "[تصویر]"
          : r.input.length > 240
          ? r.input.slice(0, 240) + "…"
          : r.input,
      output:
        r.output.length > 320
          ? r.output.slice(0, 320) + "…"
          : r.output,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("AI history route error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تاریخچه" },
      { status: 500 }
    );
  }
}
