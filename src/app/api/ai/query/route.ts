import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Build a compact JSON snapshot of the tenant's current business data. */
async function buildTenantContext(tenantId: string): Promise<string> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [sales, expensesAgg, customersCount, products, topProductsAgg] =
    await Promise.all([
      db.sale.findMany({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
          status: "completed",
        },
        select: {
          total: true,
          createdAt: true,
          paymentMethod: true,
        },
      }),
      db.expense.aggregate({
        where: { tenantId, date: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      db.customer.count({ where: { tenantId } }),
      db.product.findMany({
        where: { tenantId },
        select: {
          name: true,
          karat: true,
          weight: true,
          salePrice: true,
          stock: true,
          minStock: true,
        },
      }),
      db.saleItem.groupBy({
        by: ["productId", "name"],
        where: {
          sale: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        },
        _sum: { total: true, quantity: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
    ]);

  const totalSales30 = sales.reduce((s, x) => s + x.total, 0);
  const todaySales = sales
    .filter((s) => s.createdAt >= todayStart)
    .reduce((s, x) => s + x.total, 0);

  const lowStock = products
    .filter((p) => p.stock <= p.minStock)
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      karat: p.karat,
      stock: p.stock,
      minStock: p.minStock,
    }));

  const inventorySummary = {
    totalProducts: products.length,
    totalStockUnits: products.reduce((s, p) => s + p.stock, 0),
    inventoryRetailValue: products.reduce((s, p) => s + p.salePrice * p.stock, 0),
    totalGoldWeightGrams: products.reduce(
      (s, p) => s + p.weight * p.stock,
      0
    ),
  };

  const paymentMethods: Record<string, number> = {};
  for (const s of sales) {
    paymentMethods[s.paymentMethod] =
      (paymentMethods[s.paymentMethod] || 0) + s.total;
  }

  const context = {
    period: "30 روز گذشته",
    today: todayStart.toISOString().slice(0, 10),
    sales: {
      totalRevenue30Days: Math.round(totalSales30),
      todayRevenue: Math.round(todaySales),
      transactionsCount: sales.length,
      paymentMethods,
    },
    expenses: {
      total30Days: Math.round(expensesAgg._sum.amount || 0),
    },
    netProfitEstimate30Days: Math.round(
      totalSales30 - (expensesAgg._sum.amount || 0)
    ),
    customers: {
      total: customersCount,
    },
    inventory: inventorySummary,
    topProducts: topProductsAgg.map((p) => ({
      name: p.name,
      quantitySold: p._sum.quantity,
      revenue: Math.round(p._sum.total || 0),
    })),
    lowStockItems: lowStock,
  };

  return JSON.stringify(context, null, 2);
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

    let body: { question?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "بدنه درخواست نامعتبر است" },
        { status: 400 }
      );
    }

    const question = (body.question || "").trim();
    if (!question) {
      return NextResponse.json(
        { error: "سوال را وارد کنید" },
        { status: 400 }
      );
    }
    if (question.length > 2000) {
      return NextResponse.json(
        { error: "سوال بیش از حد طولانی است" },
        { status: 400 }
      );
    }

    const context = await buildTenantContext(tenantId);

    const systemPrompt = `تو دستیار هوشمند گلد هاب هستی، یک پلتفرم مدیریت طلا و جواهر. به سوالات کاربر درباره فروش، انبار، مشتریان و مالی پاسخ بده. داده‌های فعلی فروشگاه:\n${context}\n\nپاسخ‌ها را به فارسی، خلاصه و دقیق بده. اگر عددی می‌دهی به تومان باشد و اعداد را به فارسی بنویس. اگر داده کافی برای پاسخ نداری صادقانه اعلام کن.`;

    let answer = "";
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.5,
        max_tokens: 1200,
      });
      answer =
        completion?.choices?.[0]?.message?.content?.trim() ||
        "پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.";
    } catch (aiErr) {
      console.error("AI query error:", aiErr);
      return NextResponse.json(
        { error: "خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید." },
        { status: 502 }
      );
    }

    const record = await db.aIQuery.create({
      data: {
        tenantId,
        userId: user.id,
        type: "text_query",
        input: question,
        output: answer,
        meta: JSON.stringify({ tokens: answer.length }),
      },
    });

    return NextResponse.json({
      answer,
      queryId: record.id,
      createdAt: record.createdAt,
    });
  } catch (error) {
    console.error("AI query route error:", error);
    return NextResponse.json(
      { error: "خطای سرور در پردازش درخواست" },
      { status: 500 }
    );
  }
}
