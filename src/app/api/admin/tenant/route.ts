import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin"];

interface TenantSettings {
  taxRate?: number;
  currency?: string;
  autoUpdateGoldPrice?: boolean;
  [k: string]: unknown;
}

function parseSettings(raw: string | null | undefined): TenantSettings {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
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

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "سازمان یافت نشد" },
        { status: 404 }
      );
    }

    const settings = parseSettings(tenant.settings);

    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      settings,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  } catch (err) {
    console.error("[GET /api/admin/tenant] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات سازمان" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: "سازمان یافت نشد" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, settings } = body || {};

    const currentSettings = parseSettings(tenant.settings);
    const incomingSettings: TenantSettings =
      settings && typeof settings === "object" ? settings : {};

    // Merge settings with type validation
    const merged: TenantSettings = { ...currentSettings };

    if (incomingSettings.taxRate !== undefined) {
      const tr = Number(incomingSettings.taxRate);
      merged.taxRate = isNaN(tr) || tr < 0 ? 0 : tr;
    }
    if (incomingSettings.currency !== undefined) {
      merged.currency =
        typeof incomingSettings.currency === "string"
          ? incomingSettings.currency.trim().slice(0, 10)
          : "IRR";
    }
    if (incomingSettings.autoUpdateGoldPrice !== undefined) {
      merged.autoUpdateGoldPrice = Boolean(incomingSettings.autoUpdateGoldPrice);
    }

    const data: any = { settings: JSON.stringify(merged) };
    if (
      typeof name === "string" &&
      name.trim().length > 0 &&
      name.trim() !== tenant.name
    ) {
      data.name = name.trim();
    }

    const updated = await db.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        settings: true,
        updatedAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: "update",
        entity: "Tenant",
        entityId: tenantId,
        details: JSON.stringify({
          fields: Object.keys(data),
        }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      plan: updated.plan,
      status: updated.status,
      settings: parseSettings(updated.settings),
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error("[PUT /api/admin/tenant] error:", err);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی تنظیمات سازمان" },
      { status: 500 }
    );
  }
}
