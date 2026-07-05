import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (user && !user.id.startsWith("demo-")) {
      try {
        await db.auditLog.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            action: "logout",
            entity: "User",
            entityId: user.id,
          },
        });
      } catch {
        // Ignore audit log errors (e.g., database not available)
      }
    }
    const res = NextResponse.json({ success: true });
    return clearSessionCookie(res);
  } catch {
    // Even on error, clear the cookie and return success
    const res = NextResponse.json({ success: true });
    res.cookies.set("gh_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }
}
