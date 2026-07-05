import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "10", 10))
    );
    const search = url.searchParams.get("search")?.trim() || "";
    const sort = url.searchParams.get("sort") || "createdAt"; // totalSpent | createdAt | name | loyaltyPoints
    const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Sort field whitelist
    const sortFieldMap: Record<string, string> = {
      totalSpent: "totalSpent",
      createdAt: "createdAt",
      name: "name",
      loyaltyPoints: "loyaltyPoints",
      totalOrders: "totalOrders",
    };
    const sortField = sortFieldMap[sort] || "createdAt";

    const [items, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          birthday: true,
          nationalId: true,
          loyaltyPoints: true,
          totalSpent: true,
          totalOrders: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.customer.count({ where }),
    ]);

    // Aggregate stats for current view (used by header summary)
    const agg = await db.customer.aggregate({
      where: { tenantId },
      _sum: { totalSpent: true, loyaltyPoints: true },
      _avg: { totalSpent: true },
      _count: { _all: true },
    });

    // Birthdays in current month (Gregorian)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const allBirthdayCustomers = await db.customer.findMany({
      where: {
        tenantId,
        birthday: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        birthday: true,
        totalSpent: true,
        loyaltyPoints: true,
      },
    });
    const birthdaysThisMonth = allBirthdayCustomers
      .filter((c) => {
        if (!c.birthday) return false;
        return new Date(c.birthday).getMonth() + 1 === currentMonth;
      })
      .sort((a, b) => {
        const da = a.birthday ? new Date(a.birthday).getDate() : 99;
        const db2 = b.birthday ? new Date(b.birthday).getDate() : 99;
        return da - db2;
      });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      stats: {
        count: agg._count._all,
        totalSpent: agg._sum.totalSpent || 0,
        avgSpent: agg._avg.totalSpent || 0,
        totalLoyalty: agg._sum.loyaltyPoints || 0,
      },
      birthdaysThisMonth,
    });
  } catch (err) {
    console.error("[GET /api/customers] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت مشتریان" },
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
    const tenantId = user.tenantId;

    const body = await req.json();
    const {
      name,
      phone,
      email,
      address,
      birthday,
      nationalId,
      notes,
    } = body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "نام مشتری الزامی است" },
        { status: 400 }
      );
    }

    // Validate phone uniqueness within tenant if provided
    if (phone && phone.trim().length > 0) {
      const existing = await db.customer.findFirst({
        where: { tenantId, phone: phone.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { error: "مشتری با این شماره تلفن قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
    }

    // Parse birthday if provided
    let birthdayDate: Date | null = null;
    if (birthday) {
      const d = new Date(birthday);
      if (!isNaN(d.getTime())) birthdayDate = d;
    }

    const customer = await db.customer.create({
      data: {
        tenantId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        birthday: birthdayDate,
        nationalId: nationalId?.trim() || null,
        notes: notes?.trim() || null,
        loyaltyPoints: 0,
        totalSpent: 0,
        totalOrders: 0,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error("[POST /api/customers] error:", err);
    return NextResponse.json(
      { error: "خطا در ایجاد مشتری" },
      { status: 500 }
    );
  }
}
