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

/** Generate a unique order number: ORD-XXXXXX (timestamp6) */
function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `ORD-${ts}${rand}`;
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
    const tenantId = user.tenantId;

    const url = new URL(req.url);
    const page = Math.max(
      1,
      parseInt(url.searchParams.get("page") || "1", 10)
    );
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "10", 10))
    );
    const search = url.searchParams.get("search")?.trim() || "";
    const type = url.searchParams.get("type") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const customerId = url.searchParams.get("customerId") || undefined;
    const assignedToId = url.searchParams.get("assignedToId") || undefined;

    // Build where clause
    const where: Record<string, unknown> = { tenantId };
    if (type && VALID_TYPES.includes(type)) where.type = type;
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (customerId) where.customerId = customerId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      (where as any).OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      db.customOrder.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          assignedTo: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.customOrder.count({ where }),
    ]);

    // Compute aggregated stats for current tenant
    const allOrders = await db.customOrder.findMany({
      where: { tenantId },
      select: {
        id: true,
        status: true,
        type: true,
        createdAt: true,
        deadline: true,
      },
    });

    const inProgressStatuses = [
      "pending",
      "design",
      "manufacturing",
      "polishing",
      "ready",
    ];
    const inProgress = allOrders.filter((o) =>
      inProgressStatuses.includes(o.status)
    ).length;
    const delivered = allOrders.filter(
      (o) => o.status === "delivered"
    ).length;
    const repairs = allOrders.filter(
      (o) => o.type === "repair" && o.status !== "cancelled"
    ).length;
    const cancelled = allOrders.filter(
      (o) => o.status === "cancelled"
    ).length;

    // Average delivery time (days) for delivered orders.
    // We approximate deliveredAt by the latest timeline "delivered" entry;
    // here we use order.createdAt → first delivered timeline entry.
    const deliveredOrders = allOrders.filter(
      (o) => o.status === "delivered"
    );
    let avgDeliveryDays = 0;
    if (deliveredOrders.length > 0) {
      const deliveredIds = deliveredOrders.map((o) => o.id);
      const timelines = await db.orderTimeline.findMany({
        where: { orderId: { in: deliveredIds }, status: "delivered" },
        select: { orderId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });
      const byOrder = new Map<string, Date>();
      for (const t of timelines) {
        // take the first "delivered" entry per order
        if (!byOrder.has(t.orderId)) byOrder.set(t.orderId, t.createdAt);
      }
      let totalDays = 0;
      let count = 0;
      for (const o of deliveredOrders) {
        const d = byOrder.get(o.id);
        if (!d) continue;
        const diffMs = d.getTime() - new Date(o.createdAt).getTime();
        const days = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
        totalDays += days;
        count++;
      }
      avgDeliveryDays = count > 0 ? totalDays / count : 0;
    }

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      stats: {
        inProgress,
        delivered,
        repairs,
        cancelled,
        avgDeliveryDays,
      },
    });
  } catch (err) {
    console.error("[GET /api/orders] error:", err);
    return NextResponse.json(
      { error: "خطا در دریافت سفارشات" },
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

    // Validate required fields
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "عنوان سفارش الزامی است" },
        { status: 400 }
      );
    }

    const type = VALID_TYPES.includes(body.type) ? body.type : "custom";
    const karat = VALID_KARATS.includes(String(body.karat))
      ? String(body.karat)
      : "750";

    const goldWeight = Number(body.goldWeight) || 0;
    const makingCharge = Number(body.makingCharge) || 0;
    const stoneCost = Number(body.stoneCost) || 0;
    const estimatedCost = Number(body.estimatedCost) || 0;

    // Parse deadline
    let deadlineDate: Date | null = null;
    if (body.deadline) {
      const d = new Date(body.deadline);
      if (!isNaN(d.getTime())) deadlineDate = d;
    }

    // Validate customer if provided
    let customerId: string | null = null;
    if (body.customerId) {
      const cust = await db.customer.findFirst({
        where: { id: body.customerId, tenantId },
      });
      if (cust) customerId = cust.id;
    }

    // Validate assignedTo if provided (must be same tenant)
    let assignedToId: string | null = null;
    if (body.assignedToId) {
      const staff = await db.user.findFirst({
        where: { id: body.assignedToId, tenantId },
      });
      if (staff) assignedToId = staff.id;
    }

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    for (let attempts = 0; attempts < 10; attempts++) {
      const existing = await db.customOrder.findUnique({
        where: { orderNumber },
      });
      if (!existing) break;
      orderNumber = generateOrderNumber();
    }

    const order = await db.customOrder.create({
      data: {
        tenantId,
        orderNumber,
        customerId,
        type,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        status: "pending",
        goldWeight,
        karat,
        makingCharge,
        stoneCost,
        estimatedCost,
        finalCost: 0,
        assignedToId,
        deadline: deadlineDate,
        timeline: {
          create: {
            status: "pending",
            note: "سفارش ثبت شد",
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] error:", err);
    return NextResponse.json(
      { error: "خطا در ایجاد سفارش" },
      { status: 500 }
    );
  }
}
