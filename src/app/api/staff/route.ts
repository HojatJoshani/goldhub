import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_USERS } from "@/lib/demo-data";

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

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoStaff());
    }

    try {
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
    } catch (dbError) {
      console.error("Staff DB error, using demo:", dbError);
      return NextResponse.json(getDemoStaff());
    }
  } catch (err) {
    console.error("[GET /api/staff] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت لیست کارکنان" },
      { status: 500 }
    );
  }
}

/**
 * Demo staff data for when database is not available (Vercel)
 */
function getDemoStaff() {
  const items = DEMO_USERS.filter((u) => u.status === "active").map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
  }));
  items.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  return { items };
}
