import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  hashPassword,
} from "@/lib/auth";

// Demo users for fallback when database is not available (e.g., on Vercel without DB)
const DEMO_USERS: Record<string, {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  branchId: string | null;
  passwordHash: string;
  status: string;
  tenant: { name: string; plan: string };
  branch: string | null;
}> = {};

async function getDemoUsers() {
  if (Object.keys(DEMO_USERS).length === 0) {
    const adminHash = await hashPassword("admin123");
    const staffHash = await hashPassword("staff123");
    DEMO_USERS["admin@goldhub.ir"] = {
      id: "demo-admin",
      email: "admin@goldhub.ir",
      name: "حجت جوشانی",
      role: "super_admin",
      tenantId: "demo-tenant",
      branchId: "demo-branch",
      passwordHash: adminHash,
      status: "active",
      tenant: { name: "طلا و جواهر زرین شهر", plan: "enterprise" },
      branch: "شعبه مرکزی - بازار طلا",
    };
    DEMO_USERS["cashier@goldhub.ir"] = {
      id: "demo-cashier",
      email: "cashier@goldhub.ir",
      name: "علی محمدی",
      role: "cashier",
      tenantId: "demo-tenant",
      branchId: "demo-branch",
      passwordHash: staffHash,
      status: "active",
      tenant: { name: "طلا و جواهر زرین شهر", plan: "enterprise" },
      branch: "شعبه مرکزی - بازار طلا",
    };
    DEMO_USERS["manager@goldhub.ir"] = {
      id: "demo-manager",
      email: "manager@goldhub.ir",
      name: "فاطمه احمدی",
      role: "manager",
      tenantId: "demo-tenant",
      branchId: "demo-branch-2",
      passwordHash: staffHash,
      status: "active",
      tenant: { name: "طلا و جواهر زرین شهر", plan: "enterprise" },
      branch: "شعبه اصفهان - قیصریه",
    };
  }
  return DEMO_USERS;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Try database first
    let userRecord: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId: string;
      branchId: string | null;
      passwordHash: string;
      status: string;
      tenant: { name: string; plan: string };
      branch: { name: string } | null;
    } | null = null;

    try {
      const dbUser = await db.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          tenant: true,
          branch: true,
        },
      });

      if (dbUser) {
        userRecord = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          tenantId: dbUser.tenantId,
          branchId: dbUser.branchId,
          passwordHash: dbUser.passwordHash,
          status: dbUser.status,
          tenant: { name: dbUser.tenant.name, plan: dbUser.tenant.plan },
          branch: dbUser.branch ? { name: dbUser.branch.name } : null,
        };
      }
    } catch (dbError) {
      // Database not available, try demo users
      console.log("Database not available, trying demo users:", dbError instanceof Error ? dbError.message : "unknown");
    }

    // If no user in database, try demo users
    if (!userRecord) {
      const demoUsers = await getDemoUsers();
      const demoUser = demoUsers[normalizedEmail];
      if (demoUser) {
        userRecord = {
          ...demoUser,
          branch: demoUser.branch ? { name: demoUser.branch } : null,
        };
      }
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: "کاربری با این اطلاعات یافت نشد" },
        { status: 401 }
      );
    }

    if (userRecord.status !== "active") {
      return NextResponse.json(
        { error: "حساب کاربری شما غیرفعال است" },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, userRecord.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // Try to update last login and create audit log (ignore errors)
    try {
      if (!userRecord.id.startsWith("demo-")) {
        await db.user.update({
          where: { id: userRecord.id },
          data: { lastLoginAt: new Date() },
        });

        await db.auditLog.create({
          data: {
            tenantId: userRecord.tenantId,
            userId: userRecord.id,
            action: "login",
            entity: "User",
            entityId: userRecord.id,
            details: JSON.stringify({ email: userRecord.email }),
            ip: req.headers.get("x-forwarded-for") || "unknown",
          },
        });
      }
    } catch {
      // Ignore audit log errors
    }

    const sessionUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      tenantId: userRecord.tenantId,
      branchId: userRecord.branchId,
    };

    const token = createSessionToken(sessionUser);
    const res = NextResponse.json({
      user: {
        ...sessionUser,
        tenant: userRecord.tenant,
        branch: userRecord.branch?.name || null,
      },
    });
    return setSessionCookie(res, token);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
}
