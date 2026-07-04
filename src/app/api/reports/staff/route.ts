import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدیر ارشد",
  admin: "مدیر",
  manager: "مدیر شعبه",
  cashier: "صندوق‌دار",
  staff: "کارمند",
};

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }
    const tenantId = user.tenantId;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const to = toParam ? new Date(toParam) : new Date(now);
    to.setHours(23, 59, 59, 999);
    const from = fromParam
      ? new Date(fromParam)
      : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
      return NextResponse.json(
        { error: "بازه تاریخ نامعتبر است" },
        { status: 400 }
      );
    }

    // Fetch all tenant users (staff) with branch info
    const users = await db.user.findMany({
      where: { tenantId, status: "active" },
      select: {
        id: true,
        name: true,
        role: true,
        branchId: true,
        lastLoginAt: true,
      },
      orderBy: { name: "asc" },
    });

    const branchIds = Array.from(
      new Set(users.map((u) => u.branchId).filter(Boolean) as string[])
    );
    const branches = branchIds.length
      ? await db.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true, name: true },
        })
      : [];
    const branchName = (id: string | null) =>
      (id && branches.find((b) => b.id === id)?.name) || "—";

    // Aggregate sales per cashier in date range
    const salesAgg = await db.sale.groupBy({
      by: ["cashierId"],
      where: {
        tenantId,
        status: "completed",
        createdAt: { gte: from, lte: to },
      },
      _sum: { total: true, subtotal: true, makingTotal: true, discount: true },
      _count: { id: true },
    });

    const salesMap = new Map<
      string,
      {
        total: number;
        subtotal: number;
        makingTotal: number;
        discount: number;
        count: number;
      }
    >();
    for (const s of salesAgg) {
      salesMap.set(s.cashierId, {
        total: s._sum.total || 0,
        subtotal: s._sum.subtotal || 0,
        makingTotal: s._sum.makingTotal || 0,
        discount: s._sum.discount || 0,
        count: s._count.id,
      });
    }

    // Per-cashier stats list
    type StaffStat = {
      id: string;
      name: string;
      role: string;
      roleLabel: string;
      branchName: string;
      salesCount: number;
      totalRevenue: number;
      avgOrderValue: number;
      totalDiscount: number;
      totalMaking: number;
      lastLoginAt: string | null;
    };
    const staff: StaffStat[] = users.map((u) => {
      const s =
        salesMap.get(u.id) || {
          total: 0,
          subtotal: 0,
          makingTotal: 0,
          discount: 0,
          count: 0,
        };
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        roleLabel: ROLE_LABELS[u.role] || u.role,
        branchName: branchName(u.branchId),
        salesCount: s.count,
        totalRevenue: s.total,
        avgOrderValue: s.count > 0 ? s.total / s.count : 0,
        totalDiscount: s.discount,
        totalMaking: s.makingTotal,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      };
    });

    // Sort by total revenue desc
    staff.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalRevenueAll = staff.reduce((s, x) => s + x.totalRevenue, 0);
    const totalSalesAll = staff.reduce((s, x) => s + x.salesCount, 0);
    const activeCashiers = staff.filter((s) => s.salesCount > 0).length;
    const avgOrderAll =
      totalSalesAll > 0 ? totalRevenueAll / totalSalesAll : 0;
    const topPerformer = staff.find((s) => s.salesCount > 0) || null;

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalStaff: staff.length,
        activeCashiers,
        totalRevenue: totalRevenueAll,
        totalSales: totalSalesAll,
        avgOrderValue: avgOrderAll,
        topPerformer: topPerformer
          ? {
              id: topPerformer.id,
              name: topPerformer.name,
              roleLabel: topPerformer.roleLabel,
              totalRevenue: topPerformer.totalRevenue,
              salesCount: topPerformer.salesCount,
              avgOrderValue: topPerformer.avgOrderValue,
            }
          : null,
      },
      staff,
    });
  } catch (error) {
    console.error("Reports staff API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش عملکرد کارکنان" },
      { status: 500 }
    );
  }
}
