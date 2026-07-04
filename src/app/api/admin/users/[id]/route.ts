import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, hashPassword } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin"];

function publicUser(u: any) {
  if (!u) return null;
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
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
    const { id } = await ctx.params;

    const target = await db.user.findFirst({
      where: { id, tenantId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(publicUser(target));
  } catch (err) {
    console.error("[GET /api/admin/users/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت کاربر" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
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
    const { id } = await ctx.params;

    const existing = await db.user.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, phone, password, role, branchId, status } =
      body || {};

    const data: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "نام کاربر نمی‌تواند خالی باشد" },
          { status: 400 }
        );
      }
      data.name = name.trim();
    }

    if (email !== undefined && email !== null) {
      const emailLower = String(email).trim().toLowerCase();
      if (emailLower.length === 0) {
        return NextResponse.json(
          { error: "ایمیل نمی‌تواند خالی باشد" },
          { status: 400 }
        );
      }
      if (emailLower !== existing.email) {
        const dup = await db.user.findUnique({
          where: { email: emailLower },
        });
        if (dup && dup.id !== id) {
          return NextResponse.json(
            { error: "کاربر دیگری با این ایمیل وجود دارد" },
            { status: 409 }
          );
        }
      }
      data.email = emailLower;
    }

    if (phone !== undefined) {
      data.phone =
        typeof phone === "string" && phone.trim().length > 0
          ? phone.trim()
          : null;
    }

    if (role !== undefined) {
      const validRoles = [
        "super_admin",
        "admin",
        "manager",
        "cashier",
        "staff",
      ];
      if (validRoles.includes(role)) {
        data.role = role;
      }
    }

    if (status !== undefined) {
      data.status = status === "inactive" ? "inactive" : "active";
    }

    // Branch handling: empty string clears, valid id sets
    if (branchId !== undefined) {
      if (
        branchId === null ||
        (typeof branchId === "string" && branchId.trim() === "")
      ) {
        data.branchId = null;
      } else if (typeof branchId === "string") {
        const branch = await db.branch.findFirst({
          where: { id: branchId, tenantId },
        });
        if (!branch) {
          return NextResponse.json(
            { error: "شعبه انتخاب‌شده معتبر نیست" },
            { status: 400 }
          );
        }
        data.branchId = branch.id;
      }
    }

    if (
      password !== undefined &&
      password !== null &&
      typeof password === "string" &&
      password.length > 0
    ) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
          { status: 400 }
        );
      }
      data.passwordHash = await hashPassword(password);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: "update",
        entity: "User",
        entityId: id,
        details: JSON.stringify({
          changes: Object.keys(data).filter((k) => k !== "passwordHash"),
        }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(publicUser(updated));
  } catch (err) {
    console.error("[PUT /api/admin/users/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی کاربر" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
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
    const { id } = await ctx.params;

    if (id === user.id) {
      return NextResponse.json(
        { error: "شما نمی‌توانید حساب کاربری خود را غیرفعال کنید" },
        { status: 400 }
      );
    }

    const existing = await db.user.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Soft delete: deactivate instead of hard delete
    const updated = await db.user.update({
      where: { id },
      data: { status: "inactive" },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: "delete",
        entity: "User",
        entityId: id,
        details: JSON.stringify({
          deactivated: true,
          name: existing.name,
          email: existing.email,
        }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      deactivated: true,
      id: updated.id,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در غیرفعال‌سازی کاربر" },
      { status: 500 }
    );
  }
}
