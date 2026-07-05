import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // If demo user, return from session
    if (sessionUser.id.startsWith("demo-")) {
      return NextResponse.json({
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          role: sessionUser.role,
          phone: null,
          avatar: null,
          tenantId: sessionUser.tenantId,
          branchId: sessionUser.branchId,
          tenant: { name: "طلا و جواهر زرین شهر", plan: "enterprise", slug: "zarrin-shahr" },
          branch: "شعبه مرکزی - بازار طلا",
        },
      });
    }

    // Try database
    try {
      const user = await db.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          tenant: { select: { name: true, plan: true, slug: true } },
          branch: { select: { name: true, id: true } },
        },
      });

      if (!user || user.status !== "active") {
        return NextResponse.json({ user: null }, { status: 200 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          tenantId: user.tenantId,
          branchId: user.branchId,
          tenant: user.tenant,
          branch: user.branch?.name || null,
        },
      });
    } catch {
      // Database not available, return session user
      return NextResponse.json({
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          role: sessionUser.role,
          phone: null,
          avatar: null,
          tenantId: sessionUser.tenantId,
          branchId: sessionUser.branchId,
          tenant: { name: "طلا و جواهر زرین شهر", plan: "enterprise", slug: "zarrin-shahr" },
          branch: "شعبه مرکزی - بازار طلا",
        },
      });
    }
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
