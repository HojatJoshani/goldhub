import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/staff
 * Returns the list of staff (Users) for the current tenant.
 * Used by selectors that need to assign work to a person (e.g. orders).
 */
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

    const staff = await db.user.findMany({
      where: { tenantId, status: "active" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items: staff });
  } catch (err) {
    console.error("[GET /api/staff] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت لیست کارکنان" },
      { status: 500 }
    );
  }
}
