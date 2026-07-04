import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (user) {
      await db.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "logout",
          entity: "User",
          entityId: user.id,
        },
      });
    }
    const res = NextResponse.json({ success: true });
    return clearSessionCookie(res);
  } catch {
    return NextResponse.json({ success: true });
  }
}
