import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin"];

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
    const action = url.searchParams.get("action")?.trim() || "";
    const entity = url.searchParams.get("entity")?.trim() || "";
    const userId = url.searchParams.get("userId")?.trim() || "";
    const from = url.searchParams.get("from")?.trim() || "";
    const to = url.searchParams.get("to")?.trim() || "";

    const where: any = { tenantId };
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    if (from || to) {
      const dateFilter: any = {};
      if (from) {
        const fd = new Date(from);
        if (!isNaN(fd.getTime())) dateFilter.gte = fd;
      }
      if (to) {
        const td = new Date(to);
        if (!isNaN(td.getTime())) {
          // Include the entire "to" day
          td.setHours(23, 59, 59, 999);
          dateFilter.lte = td;
        }
      }
      where.createdAt = dateFilter;
    }

    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    // Distinct action/entity values for filter UIs
    const distinctActions = await db.auditLog.findMany({
      where: { tenantId },
      distinct: ["action"],
      select: { action: true },
    });
    const distinctEntities = await db.auditLog.findMany({
      where: { tenantId },
      distinct: ["entity"],
      select: { entity: true },
    });

    return NextResponse.json({
      items: items.map((log) => ({
        ...log,
        details: safeParseJson(log.details),
      })),
      total,
      page,
      pageSize,
      filters: {
        actions: distinctActions.map((a) => a.action),
        entities: distinctEntities.map((e) => e.entity),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/audit-logs] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت لاگ‌های ممیزی" },
      { status: 500 }
    );
  }
}

function safeParseJson(input: string | null | undefined): any {
  if (!input) return {};
  try {
    return JSON.parse(input);
  } catch {
    return { raw: input };
  }
}
