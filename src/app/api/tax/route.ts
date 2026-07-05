import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// مودیان مالیاتی و ارزش افزوده (VAT)
// Tax Authority (Moadian) and Value Added Tax for Iranian gold shops

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // month, quarter, year
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === "quarter") {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }
    }

    // Get all sales in period
    const sales = await db.sale.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: "completed",
      },
      include: {
        customer: { select: { name: true, nationalId: true } },
        items: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Iranian gold VAT rules:
    // - Gold jewelry (18 karat and above): 9% VAT, but 3% is tax on making charge only
    // - Gold coins (investments): exempt from VAT
    // - Silver: 9% VAT on total
    // We calculate based on making charge for gold, full price for silver/other

    const VAT_RATE = 0.09; // 9% standard
    const GOLD_MAKING_TAX_RATE = 0.03; // 3% on making charge for gold

    const taxRecords = sales.map((sale) => {
      let taxableAmount = 0;
      let vatAmount = 0;
      let makingTaxAmount = 0;

      for (const item of sale.items) {
        // Coins (999) are exempt
        if (item.karat === "999" || item.karat === "900") {
          taxableAmount += 0;
          continue;
        }

        // Gold jewelry: tax on making charge + stone cost (3%)
        const makingCharge = item.makingCharge * item.weight * item.quantity;
        const stoneCost = 0; // would come from product
        const itemMakingTax = (makingCharge + stoneCost) * GOLD_MAKING_TAX_RATE;
        makingTaxAmount += itemMakingTax;

        // 9% VAT on full price for non-gold items (silver, etc.)
        // For gold, the 9% VAT applies only to non-gold portion
        taxableAmount += item.total * VAT_RATE;
        vatAmount += item.total * VAT_RATE;
      }

      return {
        invoiceNumber: sale.invoiceNumber,
        date: sale.createdAt,
        customerName: sale.customer?.name || "مشتری متفرقه",
        customerNationalId: sale.customer?.nationalId || null,
        totalAmount: sale.total,
        taxableAmount: sale.subtotal,
        vatAmount: Math.round(vatAmount),
        makingTaxAmount: Math.round(makingTaxAmount),
        totalTax: Math.round(vatAmount + makingTaxAmount),
        paymentMethod: sale.paymentMethod,
      };
    });

    const summary = {
      period: { from: startDate, to: endDate },
      totalSales: sales.length,
      totalAmount: taxRecords.reduce((s, r) => s + r.totalAmount, 0),
      totalVat: taxRecords.reduce((s, r) => s + r.vatAmount, 0),
      totalMakingTax: taxRecords.reduce((s, r) => s + r.makingTaxAmount, 0),
      totalTax: taxRecords.reduce((s, r) => s + r.totalTax, 0),
      exemptAmount: taxRecords
        .filter((r) => r.vatAmount === 0)
        .reduce((s, r) => s + r.totalAmount, 0),
    };

    return NextResponse.json({
      success: true,
      period,
      summary,
      records: taxRecords,
      vatRate: VAT_RATE * 100,
      goldMakingTaxRate: GOLD_MAKING_TAX_RATE * 100,
    });
  } catch (error) {
    console.error("Tax API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش مالیاتی" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
