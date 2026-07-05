import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

interface TransferItem {
  productId: string;
  name: string;
  qty: number;
}

const VALID_STATUSES = ["pending", "in_transit", "received", "cancelled"];

/** GET /api/transfers/[id] — fetch a single transfer */
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

    const transfer = await db.transfer.findFirst({
      where: { id, tenantId },
      include: {
        fromBranch: { select: { id: true, name: true, code: true } },
        toBranch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "انتقال یافت نشد" },
        { status: 404 }
      );
    }

    let items: TransferItem[] = [];
    try {
      items = JSON.parse(transfer.itemsJson || "[]") as TransferItem[];
    } catch {
      items = [];
    }

    return NextResponse.json({
      id: transfer.id,
      reference: transfer.reference,
      status: transfer.status,
      notes: transfer.notes,
      items,
      itemsCount: items.reduce((s, i) => s + (i.qty || 0), 0),
      fromBranch: transfer.fromBranch,
      toBranch: transfer.toBranch,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    });
  } catch (error) {
    console.error("Transfer GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت انتقال" },
      { status: 500 }
    );
  }
}

/** PUT /api/transfers/[id] — update transfer status (workflow) */
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

    const body = await req.json();
    const { status, notes } = body || {};

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    const transfer = await db.transfer.findFirst({
      where: { id, tenantId },
    });
    if (!transfer) {
      return NextResponse.json(
        { error: "انتقال یافت نشد" },
        { status: 404 }
      );
    }

    // Enforce workflow
    const current = transfer.status;
    if (status === current) {
      return NextResponse.json(
        { error: "انتقال هم‌اکنون در این وضعیت قرار دارد" },
        { status: 400 }
      );
    }
    const allowed: Record<string, string[]> = {
      pending: ["in_transit", "cancelled"],
      in_transit: ["received", "cancelled", "pending"],
      received: [],
      cancelled: ["pending"],
    };
    if (!allowed[current]?.includes(status)) {
      return NextResponse.json(
        { error: `انتقال از وضعیت «${current}» به «${status}» مجاز نیست` },
        { status: 400 }
      );
    }

    // On "received": create stock movements + move products to destination branch
    let movedItemsCount = 0;
    if (status === "received") {
      let items: TransferItem[] = [];
      try {
        items = JSON.parse(transfer.itemsJson || "[]") as TransferItem[];
      } catch {
        items = [];
      }

      await db.$transaction(async (tx) => {
        for (const it of items) {
          // Update product's branchId to destination branch (if product exists in tenant)
          const product = await tx.product.findFirst({
            where: { id: it.productId, tenantId },
            select: { id: true, stock: true, name: true },
          });
          if (!product) continue;

          // Create two stock movements: out from source, in to destination
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: it.productId,
              fromBranchId: transfer.fromBranchId,
              toBranchId: transfer.toBranchId,
              type: "transfer_out",
              quantity: -Math.abs(it.qty),
              reason: `انتقال ${transfer.reference} از ${transfer.fromBranchId} به ${transfer.toBranchId}`,
              refId: transfer.id,
            },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: it.productId,
              fromBranchId: transfer.fromBranchId,
              toBranchId: transfer.toBranchId,
              type: "transfer_in",
              quantity: Math.abs(it.qty),
              reason: `دریافت انتقال ${transfer.reference}`,
              refId: transfer.id,
            },
          });

          // Reassign product to destination branch
          await tx.product.update({
            where: { id: it.productId },
            data: { branchId: transfer.toBranchId },
          });
          movedItemsCount += 1;
        }

        await tx.transfer.update({
          where: { id: transfer.id },
          data: {
            status,
            notes: notes?.trim() || transfer.notes,
          },
        });
      });
    } else {
      await db.transfer.update({
        where: { id: transfer.id },
        data: {
          status,
          notes: notes?.trim() || transfer.notes,
        },
      });
    }

    const updated = await db.transfer.findFirst({
      where: { id, tenantId },
      include: {
        fromBranch: { select: { id: true, name: true, code: true } },
        toBranch: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({
      id: updated?.id,
      reference: updated?.reference,
      status: updated?.status,
      notes: updated?.notes,
      movedItemsCount,
      fromBranch: updated?.fromBranch,
      toBranch: updated?.toBranch,
      createdAt: updated?.createdAt,
      updatedAt: updated?.updatedAt,
    });
  } catch (error) {
    console.error("Transfer PUT API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی انتقال" },
      { status: 500 }
    );
  }
}
