import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

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
    const tenantId = user.tenantId;
    const { id } = await ctx.params;

    const customer = await db.customer.findFirst({
      where: { id, tenantId },
      include: {
        sales: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              select: {
                id: true,
                name: true,
                karat: true,
                weight: true,
                unitPrice: true,
                quantity: true,
                total: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    // Compute stats
    const totalSpent = customer.totalSpent;
    const loyaltyPoints = customer.loyaltyPoints;
    const totalOrders = customer.totalOrders;
    const lastVisit =
      customer.sales.length > 0 ? customer.sales[0].createdAt : null;

    // Days to next birthday
    let daysToBirthday: number | null = null;
    if (customer.birthday) {
      const now = new Date();
      const bd = new Date(customer.birthday);
      // This year's birthday
      let next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      if (next.getTime() < now.getTime()) {
        next = new Date(now.getFullYear() + 1, bd.getMonth(), bd.getDate());
      }
      daysToBirthday = Math.ceil(
        (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      ...customer,
      stats: {
        totalSpent,
        loyaltyPoints,
        totalOrders,
        lastVisit,
        daysToBirthday,
        avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
      },
    });
  } catch (err) {
    console.error("[GET /api/customers/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت مشتری" },
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
    const tenantId = user.tenantId;
    const { id } = await ctx.params;

    const existing = await db.customer.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, phone, email, address, birthday, nationalId, notes } =
      body || {};

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "نام مشتری نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }

    // Phone uniqueness check (excluding current)
    if (phone && phone.trim().length > 0 && phone !== existing.phone) {
      const dup = await db.customer.findFirst({
        where: {
          tenantId,
          phone: phone.trim(),
          NOT: { id },
        },
      });
      if (dup) {
        return NextResponse.json(
          { error: "مشتری دیگری با این شماره تلفن وجود دارد" },
          { status: 409 }
        );
      }
    }

    let birthdayDate: Date | null | undefined = undefined;
    if (birthday === null || birthday === "") {
      birthdayDate = null;
    } else if (birthday) {
      const d = new Date(birthday);
      if (!isNaN(d.getTime())) birthdayDate = d;
    }

    const updated = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
        ...(email !== undefined ? { email: email.trim() || null } : {}),
        ...(address !== undefined ? { address: address.trim() || null } : {}),
        ...(birthdayDate !== undefined ? { birthday: birthdayDate } : {}),
        ...(nationalId !== undefined
          ? { nationalId: nationalId.trim() || null }
          : {}),
        ...(notes !== undefined ? { notes: notes.trim() || null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/customers/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی مشتری" },
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
    const tenantId = user.tenantId;
    const { id } = await ctx.params;

    const existing = await db.customer.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { sales: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    if (existing._count.sales > 0) {
      return NextResponse.json(
        {
          error: `این مشتری ${existing._count.sales} سفارش ثبت‌شده دارد و قابل حذف نیست`,
          salesCount: existing._count.sales,
        },
        { status: 409 }
      );
    }

    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/customers/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در حذف مشتری" },
      { status: 500 }
    );
  }
}
