import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, hashPassword } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin"];

function publicUser(u: any) {
  if (!u) return null;
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }
    const tenantId = user.tenantId;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
    );
    const search = url.searchParams.get("search")?.trim() || "";
    const role = url.searchParams.get("role")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const branchId = url.searchParams.get("branchId")?.trim() || "";

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map(publicUser),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[GET /api/admin/users] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت کاربران" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }
    const tenantId = user.tenantId;

    const body = await req.json();
    const { name, email, phone, password, role, branchId, status } =
      body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "نام کاربر الزامی است" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { error: "ایمیل الزامی است" },
        { status: 400 }
      );
    }
    if (
      !password ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    const validRoles = ["super_admin", "admin", "manager", "cashier", "staff"];
    const finalRole = validRoles.includes(role) ? role : "staff";

    // Email uniqueness (global unique in schema)
    const emailLower = email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "کاربری با این ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // Validate branch belongs to tenant if provided
    let finalBranchId: string | null = null;
    if (branchId && typeof branchId === "string" && branchId.trim() !== "") {
      const branch = await db.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (!branch) {
        return NextResponse.json(
          { error: "شعبه انتخاب‌شده معتبر نیست" },
          { status: 400 }
        );
      }
      finalBranchId = branch.id;
    }

    const passwordHash = await hashPassword(password);

    const created = await db.user.create({
      data: {
        tenantId,
        name: name.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        passwordHash,
        role: finalRole,
        status: status === "inactive" ? "inactive" : "active",
        branchId: finalBranchId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: "create",
        entity: "User",
        entityId: created.id,
        details: JSON.stringify({
          name: created.name,
          email: created.email,
          role: created.role,
        }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(publicUser(created), { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/users] error:", err);
    return NextResponse.json(
      { error: "خطا در ایجاد کاربر" },
      { status: 500 }
    );
  }
}
