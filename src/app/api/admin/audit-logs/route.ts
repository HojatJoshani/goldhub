import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_AUDIT_LOGS } from "@/lib/demo-data";

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

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoAuditLogs(action, entity, userId, from, to, page, pageSize));
    }

    try {
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
    } catch (dbError) {
      console.error("Admin audit-logs DB error, using demo:", dbError);
      return NextResponse.json(getDemoAuditLogs(action, entity, userId, from, to, page, pageSize));
    }
  } catch (err) {
    console.error("[GET /api/admin/audit-logs] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت لاگ‌های ممیزی" },
      { status: 500 }
    );
  }
}

/**
 * Demo audit logs data for when database is not available (Vercel)
 */
function getDemoAuditLogs(
  action: string,
  entity: string,
  userId: string,
  from: string,
  to: string,
  page: number,
  pageSize: number
) {
  let items = [...DEMO_AUDIT_LOGS];
  if (action) items = items.filter((l) => l.action === action);
  if (entity) items = items.filter((l) => l.entity === entity);
  if (userId) items = items.filter((l) => l.userId === userId);
  if (from) {
    const fd = new Date(from);
    if (!isNaN(fd.getTime())) items = items.filter((l) => l.createdAt >= fd);
  }
  if (to) {
    const td = new Date(to);
    if (!isNaN(td.getTime())) {
      td.setHours(23, 59, 59, 999);
      items = items.filter((l) => l.createdAt <= td);
    }
  }

  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize).map((l) => ({
    ...l,
    details: safeParseJson(l.details),
  }));

  const actions = Array.from(new Set(DEMO_AUDIT_LOGS.map((l) => l.action)));
  const entities = Array.from(
    new Set(DEMO_AUDIT_LOGS.map((l) => l.entity).filter(Boolean) as string[])
  );

  return {
    items: paged,
    total,
    page,
    pageSize,
    filters: { actions, entities },
  };
}

function safeParseJson(input: string | null | undefined): any {
  if (!input) return {};
  try {
    return JSON.parse(input);
  } catch {
    return { raw: input };
  }
}
