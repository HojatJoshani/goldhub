import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const VALID_TYPES = ["custom", "repair", "manufacturing"];
const VALID_STATUSES = [
  "pending",
  "design",
  "manufacturing",
  "polishing",
  "ready",
  "delivered",
  "cancelled",
];
const VALID_KARATS = ["999", "916", "750", "585", "417", "375"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;
    const { id } = await params;

    const order = await db.customOrder.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        assignedTo: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("[GET /api/orders/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت سفارش" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;
    const { id } = await params;

    const existing = await db.customOrder.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined && typeof body.title === "string") {
      data.title = body.title.trim();
    }
    if (body.description !== undefined) {
      data.description = body.description
        ? String(body.description).trim()
        : null;
    }
    if (body.type !== undefined && VALID_TYPES.includes(body.type)) {
      data.type = body.type;
    }
    if (
      body.karat !== undefined &&
      VALID_KARATS.includes(String(body.karat))
    ) {
      data.karat = String(body.karat);
    }
    if (body.goldWeight !== undefined && !isNaN(Number(body.goldWeight))) {
      data.goldWeight = Number(body.goldWeight);
    }
    if (
      body.makingCharge !== undefined &&
      !isNaN(Number(body.makingCharge))
    ) {
      data.makingCharge = Number(body.makingCharge);
    }
    if (body.stoneCost !== undefined && !isNaN(Number(body.stoneCost))) {
      data.stoneCost = Number(body.stoneCost);
    }
    if (
      body.estimatedCost !== undefined &&
      !isNaN(Number(body.estimatedCost))
    ) {
      data.estimatedCost = Number(body.estimatedCost);
    }
    if (body.finalCost !== undefined && !isNaN(Number(body.finalCost))) {
      data.finalCost = Number(body.finalCost);
    }
    if (body.customerId !== undefined) {
      if (!body.customerId) {
        data.customerId = null;
      } else {
        const cust = await db.customer.findFirst({
          where: { id: body.customerId, tenantId },
        });
        if (cust) data.customerId = cust.id;
      }
    }
    if (body.assignedToId !== undefined) {
      if (!body.assignedToId) {
        data.assignedToId = null;
      } else {
        const staff = await db.user.findFirst({
          where: { id: body.assignedToId, tenantId },
        });
        if (staff) data.assignedToId = staff.id;
      }
    }
    if (body.deadline !== undefined) {
      if (!body.deadline) {
        data.deadline = null;
      } else {
        const d = new Date(body.deadline);
        if (!isNaN(d.getTime())) data.deadline = d;
      }
    }

    // Status change: append a timeline entry
    const statusChanged =
      body.status !== undefined &&
      body.status !== existing.status &&
      VALID_STATUSES.includes(body.status);

    const timelineNote =
      body.statusNote && typeof body.statusNote === "string"
        ? body.statusNote.trim() || null
        : null;

    if (statusChanged) {
      data.status = body.status;
      // If status becomes "delivered" and finalCost not provided, set from estimatedCost
      if (
        body.status === "delivered" &&
        body.finalCost === undefined &&
        existing.finalCost === 0
      ) {
        data.finalCost = existing.estimatedCost;
      }
    }

    const updated = await db.$transaction(async (tx) => {
      if (statusChanged) {
        await tx.orderTimeline.create({
          data: {
            orderId: id,
            status: body.status,
            note: timelineNote,
          },
        });
      }
      return tx.customOrder.update({
        where: { id },
        data,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          assignedTo: { select: { id: true, name: true, role: true } },
          timeline: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/orders/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی سفارش" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;
    const { id } = await params;

    const existing = await db.customOrder.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }

    // Hard delete (cascade deletes items + timeline)
    await db.customOrder.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[DELETE /api/orders/[id]] error:", err);
    return NextResponse.json(
      { error: "خطا در حذف سفارش" },
      { status: 500 }
    );
  }
}
