import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const VALID_STATUSES = [
  "pending",
  "design",
  "manufacturing",
  "polishing",
  "ready",
  "delivered",
  "cancelled",
];

// Ordered workflow: pending → design → manufacturing → polishing → ready → delivered
const STATUS_FLOW = [
  "pending",
  "design",
  "manufacturing",
  "polishing",
  "ready",
  "delivered",
];

/**
 * Validate status transition.
 * Rules:
 *   - "cancelled" can be set from any non-terminal status (i.e. not "delivered" and not "cancelled")
 *   - Forward jumps are allowed (e.g. pending → manufacturing). Backward moves are NOT allowed
 *     except from "cancelled" (cancelled orders can be re-opened to "pending").
 *   - Setting the same status is allowed (no-op).
 */
function isValidTransition(from: string, to: string): boolean {
  if (from === to) return true;
  if (!VALID_STATUSES.includes(to)) return false;

  // From cancelled, only allow going back to pending (re-open)
  if (from === "cancelled") {
    return to === "pending";
  }

  // Delivered is terminal — cannot move to anything else
  if (from === "delivered") {
    return false;
  }

  // To cancelled is allowed from any in-progress status
  if (to === "cancelled") {
    return STATUS_FLOW.includes(from);
  }

  // Otherwise, "to" must be later in the flow than "from"
  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx > fromIdx;
}

export async function POST(
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
    const status = String(body.status || "").trim();
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    if (!isValidTransition(existing.status, status)) {
      return NextResponse.json(
        {
          error: `انتقال از وضعیت «${existing.status}» به «${status}» مجاز نیست`,
        },
        { status: 400 }
      );
    }

    const note =
      body.note && typeof body.note === "string"
        ? body.note.trim() || null
        : null;

    // finalCost override (optional, only relevant on delivery)
    const finalCostOverride =
      body.finalCost !== undefined && !isNaN(Number(body.finalCost))
        ? Number(body.finalCost)
        : null;

    const updated = await db.$transaction(async (tx) => {
      // Append timeline entry
      await tx.orderTimeline.create({
        data: { orderId: id, status, note },
      });

      const updateData: Record<string, unknown> = { status };

      // If delivered, set finalCost
      if (status === "delivered") {
        updateData.finalCost =
          finalCostOverride !== null
            ? finalCostOverride
            : existing.finalCost > 0
              ? existing.finalCost
              : existing.estimatedCost;
      }

      // If re-opening from cancelled back to pending, keep other fields intact
      return tx.customOrder.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
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
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/orders/[id]/status] error:", err);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت سفارش" },
      { status: 500 }
    );
  }
}
